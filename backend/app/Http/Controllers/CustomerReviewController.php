<?php

namespace App\Http\Controllers;

use App\Models\CustomerReview;
use App\Models\Order;
use App\Models\User;
use App\Enums\Order\Status as OrderStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CustomerReviewController extends Controller
{
    /**
     * Создать отзыв о заказчике
     */
    public function store(Request $request): JsonResponse
    {
        \Log::info('🔍 CustomerReviewController::store called', [
            'request_data' => $request->all(),
            'user_id' => auth()->id(),
            'user_email' => auth()->user()->email ?? 'unknown'
        ]);
        
        try {
            $validated = $request->validate([
                'order_id' => 'required|integer|exists:orders,id',
                'rating' => 'required|integer|min:1|max:5',
                'comment' => 'nullable|string|max:1000',
            ]);

            $executor = auth()->user();
            $order = Order::with('author')->findOrFail($validated['order_id']);

            // Проверяем, что пользователь является исполнителем этого заказа
            if ($order->executor_id !== $executor->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not the executor of this order'
                ], 403);
            }

            // Проверяем, что заказ готов для отзыва (статус AwaitingConfirmation, Closed или Completed)
            if ($order->status !== OrderStatus::AwaitingConfirmation->value && 
                $order->status !== OrderStatus::Closed->value && 
                $order->status !== OrderStatus::Completed->value) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order must be awaiting confirmation or completed to leave a review'
                ], 400);
            }

            // Проверяем, что отзыв еще не был оставлен
            $existingReview = CustomerReview::where('order_id', $validated['order_id'])
                ->where('executor_id', $executor->id)
                ->first();

            if ($existingReview) {
                return response()->json([
                    'success' => false,
                    'message' => 'Review already exists for this order'
                ], 400);
            }

            DB::transaction(function () use ($validated, $executor, $order) {
                // Создаем отзыв
                CustomerReview::create([
                    'order_id' => $validated['order_id'],
                    'customer_id' => $order->author_id,
                    'executor_id' => $executor->id,
                    'rating' => $validated['rating'],
                    'comment' => $validated['comment'],
                ]);

                // Пересчитываем рейтинг заказчика
                CustomerReview::recalculateCustomerRating($order->author_id);
            });

            // Проверяем, оставили ли оба пользователя отзывы друг о друге (вне транзакции)
            $this->checkAndCompleteOrderIfBothReviewsExist($validated['order_id']);

            return response()->json([
                'success' => true,
                'message' => 'Review created successfully'
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create review'
            ], 500);
        }
    }

    /**
     * Получить список отзывов о заказчике
     */
    public function index(Request $request, int $customerId): JsonResponse
    {
        try {
            $customer = User::findOrFail($customerId);
            
            $reviews = CustomerReview::with(['executor:id,name,avatar', 'order:id,title', 'replies.author:id,name,avatar'])
                ->where('customer_id', $customerId)
                ->orderBy('created_at', 'desc')
                ->paginate(20);

            $result = [
                'customer' => [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'avatar' => $customer->avatar,
                    'customer_rating' => $customer->customer_rating,
                    'customer_reviews_count' => $customer->customer_reviews_count,
                    'customer_orders_count' => $customer->customer_orders_count,
                    'average_rating' => $customer->average_rating, // Общий рейтинг для мобильного приложения
                    'reviews_count' => $customer->reviews_count, // Общее количество отзывов
                ],
                'reviews' => $reviews->items(),
                'pagination' => [
                    'current_page' => $reviews->currentPage(),
                    'total_pages' => $reviews->lastPage(),
                    'total_items' => $reviews->total(),
                    'per_page' => $reviews->perPage(),
                ]
            ];

            return response()->json([
                'success' => true,
                'result' => $result
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get reviews'
            ], 500);
        }
    }

    /**
     * Получить детальную информацию об отзыве
     */
    public function show(int $reviewId): JsonResponse
    {
        try {
            $review = CustomerReview::with(['customer:id,name,avatar', 'executor:id,name,avatar', 'order:id,title'])
                ->findOrFail($reviewId);

            return response()->json([
                'success' => true,
                'result' => $review
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Review not found'
            ], 404);
        }
    }

    /**
     * Проверить, может ли исполнитель оставить отзыв о заказчике по конкретному заказу
     */
    public function canReview(Request $request, int $orderId): JsonResponse
    {
        try {
            $executor = auth()->user();
            $order = Order::findOrFail($orderId);

            // Проверяем, что пользователь является исполнителем этого заказа
            if ($order->executor_id !== $executor->id) {
                return response()->json([
                    'success' => true,
                    'result' => ['can_review' => false, 'reason' => 'not_executor']
                ]);
            }

            // Проверяем, что заказ готов для отзыва (статус AwaitingConfirmation, Closed или Completed)
            if ($order->status !== OrderStatus::AwaitingConfirmation->value && 
                $order->status !== OrderStatus::Closed->value && 
                $order->status !== OrderStatus::Completed->value) {
                return response()->json([
                    'success' => true,
                    'result' => ['can_review' => false, 'reason' => 'order_not_ready_for_review']
                ]);
            }

            // Проверяем, что отзыв еще не был оставлен
            $existingReview = CustomerReview::where('order_id', $orderId)
                ->where('executor_id', $executor->id)
                ->exists();

            if ($existingReview) {
                return response()->json([
                    'success' => true,
                    'result' => ['can_review' => false, 'reason' => 'already_reviewed']
                ]);
            }

            return response()->json([
                'success' => true,
                'result' => ['can_review' => true]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to check review possibility'
            ], 500);
        }
    }

    /**
     * Проверяет, оставили ли оба пользователя отзывы, и завершает заказ если да
     */
    private function checkAndCompleteOrderIfBothReviewsExist(int $orderId): void
    {
        $order = \App\Models\Order::find($orderId);
        if (!$order) {
            return;
        }

        // Проверяем, что заказ в статусе AwaitingConfirmation
        if ($order->status !== \App\Enums\Order\Status::AwaitingConfirmation->value) {
            return;
        }

        // Проверяем наличие отзыва заказчика об исполнителе
        $executorReviewExists = \App\Models\ExecutorReview::where('order_id', $orderId)
            ->where('customer_id', $order->author_id)
            ->where('executor_id', $order->executor_id)
            ->exists();

        // Проверяем наличие отзыва исполнителя о заказчике
        $customerReviewExists = CustomerReview::where('order_id', $orderId)
            ->where('executor_id', $order->executor_id)
            ->where('customer_id', $order->author_id)
            ->exists();

        // Если оба отзыва существуют - завершаем заказ
        if ($executorReviewExists && $customerReviewExists) {
            $oldStatus = $order->status;
            
            $order->updateOrFail([
                'status' => \App\Enums\Order\Status::Completed->value,
                'completed_by_executor' => true,
                'completed_by_customer' => true,
                'executor_completed_at' => $order->executor_completed_at ?: now(),
                'customer_completed_at' => $order->customer_completed_at ?: now(),
            ]);

            // Отправляем уведомление о смене статуса
            $notificationService = app(\App\Services\OrderStatusNotificationService::class);
            $notificationService->sendOrderStatusNotification($order, $oldStatus, \App\Enums\Order\Status::Completed->value);
        }
    }
}