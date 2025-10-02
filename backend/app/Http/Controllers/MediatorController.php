<?php

namespace App\Http\Controllers;

use App\Services\MediatorService;
use App\Models\Order;
use App\Models\MediatorTransaction;
use App\Enums\Users\Type;
use App\Enums\Order\Status;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Exception;

class MediatorController extends Controller
{
    protected MediatorService $mediatorService;

    public function __construct(MediatorService $mediatorService)
    {
        $this->mediatorService = $mediatorService;
    }

    /**
     * Получить доступные заказы для посредника
     */
    public function getAvailableOrders(): JsonResponse
    {
        $user = auth()->user();
        
        if ($user->type !== Type::Mediator->value) {
            throw new AccessDeniedHttpException('Only mediators can access this endpoint');
        }

        $orders = $this->mediatorService->getAvailableOrders();

        return response()->json([
            'success' => true,
            'result' => $orders,
        ]);
    }

    /**
     * Получить активные сделки посредника
     */
    public function getActiveDeals(): JsonResponse
    {
        $user = auth()->user();
        
        if ($user->type !== Type::Mediator->value) {
            throw new AccessDeniedHttpException('Only mediators can access this endpoint');
        }

        $deals = $this->mediatorService->getMediatorActiveDeals($user->id);

        return response()->json([
            'success' => true,
            'result' => $deals,
        ]);
    }

    /**
     * Получить статистику посредника
     */
    public function getStats(): JsonResponse
    {
        $user = auth()->user();
        
        if ($user->type !== Type::Mediator->value) {
            throw new AccessDeniedHttpException('Only mediators can access this endpoint');
        }

        $stats = $this->mediatorService->getMediatorStats($user->id);

        return response()->json([
            'success' => true,
            'result' => $stats,
        ]);
    }

    /**
     * Взять заказ в работу как посредник
     */
    public function takeOrder(Request $request, int $orderId): JsonResponse
    {
        $user = auth()->user();
        
        if ($user->type !== Type::Mediator->value) {
            throw new AccessDeniedHttpException('Only mediators can take orders');
        }

        $success = $this->mediatorService->assignMediatorToOrder($orderId, $user->id);

        if ($success) {
            return response()->json([
                'success' => true,
                'message' => 'Order successfully assigned to mediator',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Failed to assign order to mediator',
        ], 400);
    }

    /**
     * Обновить статус заказа
     */
    public function updateOrderStatus(Request $request, int $orderId): JsonResponse
    {
        $user = auth()->user();
        
        if ($user->type !== Type::Mediator->value) {
            throw new AccessDeniedHttpException('Only mediators can update order status');
        }

        $request->validate([
            'status' => 'required|integer|min:0|max:9',
        ]);

        $success = $this->mediatorService->updateOrderStatus(
            $orderId, 
            $request->status, 
            $user->id
        );

        if ($success) {
            return response()->json([
                'success' => true,
                'message' => 'Order status updated successfully',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Failed to update order status',
        ], 400);
    }

    /**
     * Получить детали заказа для посредника
     */
    public function getOrderDetails(int $orderId): JsonResponse
    {
        $user = auth()->user();
        
        if ($user->type !== Type::Mediator->value) {
            throw new AccessDeniedHttpException('Only mediators can access this endpoint');
        }

        $order = Order::with(['author', 'executor', 'files', 'mediatorTransactions'])
            ->where('id', $orderId)
            ->where('mediator_id', $user->id)
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found or not assigned to this mediator',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'result' => [
                'id' => $order->id,
                'title' => $order->title,
                'description' => $order->description,
                'status' => $order->status,
                'max_amount' => $order->max_amount,
                'commission' => $order->mediator_commission,
                'escrow_status' => $order->escrow_status,
                'payment_held' => $order->payment_held,
                'work_direction' => $order->work_direction,
                'work_type' => $order->work_type,
                'city' => $order->city,
                'address' => $order->address,
                'customer' => [
                    'id' => $order->author->id,
                    'name' => $order->author->name,
                    'email' => $order->author->email,
                    'phone' => $order->author->phone,
                    'avatar' => $order->author->avatar,
                ],
                'executor' => $order->executor ? [
                    'id' => $order->executor->id,
                    'name' => $order->executor->name,
                    'email' => $order->executor->email,
                    'phone' => $order->executor->phone,
                    'avatar' => $order->executor->avatar,
                ] : null,
                'files' => $order->files->map(function ($file) {
                    return [
                        'id' => $file->id,
                        'name' => $file->name,
                        'url' => $file->url,
                        'size' => $file->size,
                    ];
                }),
                'transactions' => $order->mediatorTransactions->map(function ($transaction) {
                    return [
                        'id' => $transaction->id,
                        'amount' => $transaction->commission_amount,
                        'status' => $transaction->status,
                        'type' => $transaction->type,
                        'created_at' => $transaction->created_at,
                        'processed_at' => $transaction->processed_at,
                    ];
                }),
                'created_at' => $order->created_at,
                'updated_at' => $order->updated_at,
            ],
        ]);
    }

    /**
     * Получить историю транзакций посредника
     */
    public function getTransactionHistory(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        if ($user->type !== Type::Mediator->value) {
            throw new AccessDeniedHttpException('Only mediators can access this endpoint');
        }

        $query = MediatorTransaction::with(['order'])
            ->where('mediator_id', $user->id);

        // Фильтры
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        $transactions = $query->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'result' => $transactions->items(),
            'pagination' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
            ],
        ]);
    }

    /**
     * Обновить настройки комиссии посредника
     */
    public function updateCommissionSettings(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        if ($user->type !== Type::Mediator->value) {
            throw new AccessDeniedHttpException('Only mediators can update commission settings');
        }

        $request->validate([
            'margin_percentage' => 'nullable|numeric|min:0|max:100',
            'fixed_fee' => 'nullable|numeric|min:0',
            'agreed_price' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        $user->update([
            'mediator_margin_percentage' => $request->margin_percentage,
            'mediator_fixed_fee' => $request->fixed_fee,
            'mediator_agreed_price' => $request->agreed_price,
            'mediator_notes' => $request->notes,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Commission settings updated successfully',
            'result' => [
                'margin_percentage' => $user->mediator_margin_percentage,
                'fixed_fee' => $user->mediator_fixed_fee,
                'agreed_price' => $user->mediator_agreed_price,
                'notes' => $user->mediator_notes,
            ],
        ]);
    }

    /**
     * Получить детали этапа заказа
     */
    public function getOrderStepDetails(int $orderId): JsonResponse
    {
        $user = auth()->user();
        
        if ($user->type !== Type::Mediator->value) {
            throw new AccessDeniedHttpException('Only mediators can access this endpoint');
        }

        try {
            $details = $this->mediatorService->getOrderStepDetails($orderId, $user->id);
            
            return response()->json([
                'success' => true,
                'result' => $details,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Перейти к следующему этапу
     */
    public function moveToNextStep(Request $request, int $orderId): JsonResponse
    {
        $user = auth()->user();
        
        if ($user->type !== Type::Mediator->value) {
            throw new AccessDeniedHttpException('Only mediators can move to next step');
        }

        $request->validate([
            'step_data' => 'nullable|array',
            'notes' => 'nullable|string|max:1000',
        ]);

        $stepData = $request->step_data ?? [];
        if ($request->notes) {
            $stepData['notes'] = $request->notes;
        }

        $success = $this->mediatorService->moveToNextStep($orderId, $user->id, $stepData);

        if ($success) {
            return response()->json([
                'success' => true,
                'message' => 'Successfully moved to next step',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Failed to move to next step',
        ], 400);
    }

    /**
     * Архивировать заказ
     */
    public function archiveOrder(Request $request, int $orderId): JsonResponse
    {
        $user = auth()->user();
        
        if ($user->type !== Type::Mediator->value) {
            throw new AccessDeniedHttpException('Only mediators can archive orders');
        }

        $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        $success = $this->mediatorService->archiveOrder($orderId, $user->id, $request->reason);

        if ($success) {
            return response()->json([
                'success' => true,
                'message' => 'Order archived successfully',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Failed to archive order',
        ], 400);
    }

    /**
     * Вернуть заказ в приложение
     */
    public function returnOrderToApp(Request $request, int $orderId): JsonResponse
    {
        $user = auth()->user();
        
        if ($user->type !== Type::Mediator->value) {
            throw new AccessDeniedHttpException('Only mediators can return orders to app');
        }

        $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        $success = $this->mediatorService->returnOrderToApp($orderId, $user->id, $request->reason);

        if ($success) {
            return response()->json([
                'success' => true,
                'message' => 'Order returned to app successfully',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Failed to return order to app',
        ], 400);
    }

    /**
     * Обновить данные этапа
     */
    public function updateStepData(Request $request, int $orderId, int $step): JsonResponse
    {
        $user = auth()->user();
        
        if ($user->type !== Type::Mediator->value) {
            throw new AccessDeniedHttpException('Only mediators can update step data');
        }

        $validationRules = [
            'notes' => 'nullable|string|max:1000',
        ];

        // Добавляем правила валидации в зависимости от этапа
        if ($step == 2) { // Этап поиска исполнителя
            $validationRules = array_merge($validationRules, [
                'executor_contact_name' => 'nullable|string|max:255',
                'executor_contact_phone' => 'nullable|string|max:20',
                'executor_cost' => 'nullable|numeric|min:0',
            ]);
        } elseif ($step == 3) { // Этап реализации
            $validationRules = array_merge($validationRules, [
                'project_deadline' => 'nullable|date|after:today',
            ]);
        }

        $request->validate($validationRules);

        $success = $this->mediatorService->updateStepData(
            $orderId, 
            $user->id, 
            $step, 
            $request->all()
        );

        if ($success) {
            return response()->json([
                'success' => true,
                'message' => 'Step data updated successfully',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Failed to update step data',
        ], 400);
    }

    /**
     * Завершить заказ успешно
     */
    public function completeOrderSuccessfully(Request $request, int $orderId): JsonResponse
    {
        $user = auth()->user();
        
        if ($user->type !== Type::Mediator->value) {
            throw new AccessDeniedHttpException('Only mediators can complete orders');
        }

        $request->validate([
            'notes' => 'nullable|string|max:1000',
        ]);

        $success = $this->mediatorService->updateOrderStatus($orderId, Status::Completed->value, $user->id);

        if ($success) {
            // Обновляем заметки если есть
            if ($request->notes) {
                $this->mediatorService->updateStepData($orderId, $user->id, 3, [
                    'completion_notes' => $request->notes
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Order completed successfully',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Failed to complete order',
        ], 400);
    }

    /**
     * Завершить заказ с отказом
     */
    public function completeOrderWithRejection(Request $request, int $orderId): JsonResponse
    {
        $user = auth()->user();
        
        if ($user->type !== Type::Mediator->value) {
            throw new AccessDeniedHttpException('Only mediators can reject orders');
        }

        $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        $success = $this->mediatorService->updateOrderStatus($orderId, Status::Rejected->value, $user->id);

        if ($success) {
            // Добавляем причину отказа
            $this->mediatorService->updateStepData($orderId, $user->id, 3, [
                'rejection_reason' => $request->reason
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Order rejected successfully',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Failed to reject order',
        ], 400);
    }

    /**
     * Получить историю комментариев для заказа
     */
    public function getOrderComments(int $orderId): JsonResponse
    {
        $user = auth()->user();
        
        if ($user->type !== Type::Mediator->value) {
            throw new AccessDeniedHttpException('Only mediators can access comments');
        }

        $order = Order::findOrFail($orderId);
        
        // Проверяем, что посредник имеет доступ к этому заказу
        if ($order->mediator_id !== $user->id) {
            throw new AccessDeniedHttpException('You can only access comments for your orders');
        }

        $comments = \App\Models\MediatorOrderComment::getOrderCommentsHistory($orderId);

        return response()->json([
            'success' => true,
            'result' => $comments,
        ]);
    }

    /**
     * Добавить комментарий к заказу
     */
    public function addOrderComment(Request $request, int $orderId): JsonResponse
    {
        $user = auth()->user();
        
        if ($user->type !== Type::Mediator->value) {
            throw new AccessDeniedHttpException('Only mediators can add comments');
        }

        $validated = $request->validate([
            'step' => 'required|integer|min:1|max:3',
            'comment' => 'required|string|max:2000',
            'step_data' => 'nullable|array',
        ]);

        $order = Order::findOrFail($orderId);
        
        // Проверяем, что посредник имеет доступ к этому заказу
        if ($order->mediator_id !== $user->id) {
            throw new AccessDeniedHttpException('You can only add comments to your orders');
        }

        $comment = \App\Models\MediatorOrderComment::create([
            'order_id' => $orderId,
            'mediator_id' => $user->id,
            'step' => $validated['step'],
            'comment' => $validated['comment'],
            'step_data' => $validated['step_data'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'result' => [
                'id' => $comment->id,
                'step' => $comment->step,
                'comment' => $comment->comment,
                'step_data' => $comment->step_data,
                'mediator' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'avatar' => $user->avatar,
                ],
                'created_at' => $comment->created_at,
                'formatted_date' => $comment->created_at->format('d.m.Y H:i'),
            ],
        ]);
    }
}