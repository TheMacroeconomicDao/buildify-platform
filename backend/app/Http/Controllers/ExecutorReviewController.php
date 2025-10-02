<?php

namespace App\Http\Controllers;

use App\Models\ExecutorReview;
use App\Models\Order;
use App\Models\User;
use App\Enums\Order\Status as OrderStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ExecutorReviewController extends Controller
{
    /**
     * Создать отзыв об исполнителе
     */
    public function store(Request $request, int $executor_id = null): JsonResponse
    {
        // Если executor_id не передан в URL, берем из тела запроса
        if ($executor_id === null) {
            $executor_id = $request->input('executor_id');
        }
        
        $validator = Validator::make($request->all(), [
            'order_id' => 'required|integer|exists:orders,id',
            'executor_id' => $executor_id === null ? 'required|integer|exists:users,id' : 'nullable',
            'rating' => 'integer|min:1|max:5',
            'quality_rating' => 'integer|min:1|max:5',
            'speed_rating' => 'integer|min:1|max:5', 
            'communication_rating' => 'integer|min:1|max:5',
            'text' => 'nullable|string|max:1000',
            'comment' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => $validator->errors()->first(),
            ], 400);
        }

        // Проверяем, что исполнитель существует
        $executor = User::find($executor_id);
        if (!$executor) {
            return response()->json([
                'success' => false,
                'error' => 'Executor not found',
            ], 404);
        }

        $user = auth()->user();
        $order = Order::find($request->order_id);

        // Проверяем, что пользователь является заказчиком этого заказа
        if ($order->author_id !== $user->id) {
            return response()->json([
                'success' => false,
                'error' => 'Only order author can leave a review',
            ], 403);
        }

        // Проверяем, что заказ готов для отзыва (статус AwaitingConfirmation, Closed или Completed)
        if ($order->status !== OrderStatus::AwaitingConfirmation->value && 
            $order->status !== OrderStatus::Closed->value && 
            $order->status !== OrderStatus::Completed->value) {
            return response()->json([
                'success' => false,
                'error' => 'Order must be awaiting confirmation or completed to leave a review',
            ], 400);
        }

        // Проверяем, что отзыв еще не оставлен
        $existingReview = ExecutorReview::where('order_id', $request->order_id)
            ->where('author_id', $user->id)
            ->first();

        if ($existingReview) {
            return response()->json([
                'success' => false,
                'error' => 'Review already exists for this order',
            ], 400);
        }

        try {
            // Определяем рейтинг - используем rating или среднее из детальных рейтингов
            $rating = $request->rating;
            if (!$rating && ($request->quality_rating || $request->speed_rating || $request->communication_rating)) {
                $ratings = array_filter([
                    $request->quality_rating,
                    $request->speed_rating, 
                    $request->communication_rating
                ]);
                $rating = count($ratings) > 0 ? round(array_sum($ratings) / count($ratings)) : 5;
            }
            
            $review = ExecutorReview::create([
                'order_id' => $request->order_id,
                'author_id' => $user->id,
                'customer_id' => $user->id,
                'executor_id' => $executor_id,
                'rating' => $rating ?: 5,
                'quality_rating' => $request->quality_rating ?: 0,
                'speed_rating' => $request->speed_rating ?: 0,
                'communication_rating' => $request->communication_rating ?: 0,
                'text' => $request->text ?: $request->comment,
                'comment' => $request->comment,
            ]);

            // Пересчитываем рейтинг исполнителя
            ExecutorReview::recalculateExecutorRating($executor_id);
            
            // Также пересчитываем общий рейтинг исполнителя
            $executor->recalculateOverallRating();

            // Проверяем, оставили ли оба пользователя отзывы друг о друге
            $this->checkAndCompleteOrderIfBothReviewsExist($order_id);

            return response()->json([
                'success' => true,
                'result' => $review,
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to create executor review: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'error' => 'Failed to create review: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Получить отзывы об исполнителе
     */
    public function index(Request $request, int $executorId): JsonResponse
    {
        $perPage = $request->get('per_page', 20);
        $page = $request->get('page', 1);

        $executor = User::find($executorId);
        if (!$executor) {
            return response()->json([
                'success' => false,
                'error' => 'Executor not found',
            ], 404);
        }

        $reviews = ExecutorReview::where('executor_id', $executorId)
            ->with(['customer:id,name,avatar', 'order:id,title', 'replies.author:id,name,avatar'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'success' => true,
            'result' => [
                'executor' => [
                    'id' => $executor->id,
                    'name' => $executor->name,
                    'avatar' => $executor->avatar,
                    'executor_rating' => $executor->executor_rating,
                    'executor_reviews_count' => $executor->executor_reviews_count,
                    'executor_orders_count' => $executor->executor_orders_count,
                ],
                'reviews' => $reviews->items(),
                'pagination' => [
                    'current_page' => $reviews->currentPage(),
                    'per_page' => $reviews->perPage(),
                    'total_items' => $reviews->total(),
                    'total_pages' => $reviews->lastPage(),
                ],
            ],
        ]);
    }

    /**
     * Получить детали отзыва
     */
    public function show(int $reviewId): JsonResponse
    {
        $review = ExecutorReview::with(['customer:id,name,avatar', 'executor:id,name,avatar', 'order:id,title'])
            ->find($reviewId);

        if (!$review) {
            return response()->json([
                'success' => false,
                'error' => 'Review not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'result' => $review,
        ]);
    }

    /**
     * Проверить, может ли пользователь оставить отзыв для данного заказа
     */
    public function canReview(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'order_id' => 'required|integer|exists:orders,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => $validator->errors()->first(),
            ], 400);
        }

        $user = auth()->user();
        $order = Order::find($request->order_id);

        $canReview = $order->author_id === $user->id 
            && ($order->status === OrderStatus::AwaitingConfirmation->value || 
                $order->status === OrderStatus::Closed->value || 
                $order->status === OrderStatus::Completed->value)
            && !ExecutorReview::where('order_id', $request->order_id)
                ->where('author_id', $user->id)
                ->exists();

        return response()->json([
            'success' => true,
            'result' => [
                'can_review' => $canReview,
                'order_status' => $order->status,
                'is_author' => $order->author_id === $user->id,
                'review_exists' => ExecutorReview::where('order_id', $request->order_id)
                    ->where('author_id', $user->id)
                    ->exists(),
            ],
        ]);
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
        $executorReviewExists = ExecutorReview::where('order_id', $orderId)
            ->where('customer_id', $order->author_id)
            ->where('executor_id', $order->executor_id)
            ->exists();

        // Проверяем наличие отзыва исполнителя о заказчике
        $customerReviewExists = \App\Models\CustomerReview::where('order_id', $orderId)
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