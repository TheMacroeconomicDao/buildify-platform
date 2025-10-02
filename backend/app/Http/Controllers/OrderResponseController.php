<?php

namespace App\Http\Controllers;

use App\Enums\Order\ResponseStatus;
use App\Enums\Order\Status;
use App\Enums\Users\Type;
use App\Models\Order;
use App\Models\OrderResponse;
use App\Models\UserNotification;
use App\Services\ExecutorNotificationService;
use App\Services\SubscriptionService;
use App\Services\PushNotificationService;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Throwable;

class OrderResponseController extends Controller
{
    /**
     * @param int $orderId
     * @return JsonResponse
     * @throws Throwable
     */
    public function index(int $orderId): JsonResponse
    {
        $order = Order::with(['orderResponses', 'orderResponses.executor'])
            ->findOrFail($orderId);

        $user = auth()->user();
        
        // Разрешаем доступ к ответам автору заказа или посреднику, который взял заказ в работу
        $hasAccess = ($user->id === $order->author_id) || 
                     ($user->type === Type::Mediator->value && $order->mediator_id === $user->id);
        
        throw_if(
            !$hasAccess,
            AccessDeniedHttpException::class,
            __('order.customer.responses_are_available_only_to_author')
        );

        return response()->json([
            'success' => true,
            'result' => $order->orderResponses->map(function (OrderResponse $orderResponse) {
                $user = $orderResponse->executor;
                $responseData = [
                    'id' => $orderResponse->id,
                    'status' => $orderResponse->status,
                    'user' => [
                        'id' => $user->id,
                        'avatar' => $user->avatar,
                        'name' => $user->name,
                        'type' => $user->type,
                        'rating' => $user->average_rating,
                        'reviews_count' => $user->reviews_count,
                    ],
                ];

                // Добавляем специфичную информацию в зависимости от типа пользователя
                if ($user->type === Type::Executor->value) {
                    $responseData['user']['orders_count'] = $user->executorOrders()->count();
                } elseif ($user->type === Type::Mediator->value) {
                    // Для посредников добавляем информацию о марже
                    $responseData['user']['mediator_margin_percentage'] = $user->mediator_margin_percentage;
                    $responseData['user']['mediator_fixed_fee'] = $user->mediator_fixed_fee;
                    $responseData['user']['mediator_agreed_price'] = $user->mediator_agreed_price;
                }

                // Сохраняем обратную совместимость
                $responseData['executor'] = $responseData['user'];

                return $responseData;
            }),
        ]);
    }

    /**
     * @param int $orderId
     * @return JsonResponse
     * @throws Throwable
     */
    public function store(int $orderId): JsonResponse
    {
        $user = auth()->user();
        
        // Разрешаем отклики как исполнителям, так и посредникам
        throw_if(
            !in_array($user->type, [Type::Executor->value, Type::Mediator->value]),
            AccessDeniedHttpException::class,
            __('order.executor.only_executor_and_mediator_can_store_response')
        );
        
        // Проверяем подписку и лимиты
        $subscriptionService = new SubscriptionService();
        $subscriptionCheck = $subscriptionService->canUserRespondToOrder($user);
        
        // Добавляем детальное логирование для отладки
        $currentTariff = $user->currentTariff();
        $isTestTariff = $currentTariff ? stripos($currentTariff->name, 'test') !== false : false;
        
        \Log::info('OrderResponse subscription check', [
            'user_id' => $user->id,
            'user_email' => $user->email,
            'current_tariff' => $currentTariff,
            'is_test_tariff' => $isTestTariff,
            'subscription_ends_at' => $user->subscription_ends_at,
            'has_active_subscription' => $user->hasActiveSubscription(),
            'has_active_paid_subscription' => $user->hasActivePaidSubscription(),
            'can_respond' => $subscriptionCheck['can_respond'],
            'message' => $subscriptionCheck['message']
        ]);
        
        throw_if(
            !$subscriptionCheck['can_respond'],
            AccessDeniedHttpException::class,
            $subscriptionCheck['message']
        );

        $order = Order::findOrFail($orderId);

        // Запрет отклика на заказы вне выбранных категорий только для исполнителей
        // Посредники могут откликаться на любые заказы
        if ($user->type === Type::Executor->value) {
            $hasLicense = $user->works()
                ->where('direction', $order->work_direction)
                ->where(function ($q) use ($order) {
                    $q->whereColumn('type', 'direction') // общий выбор направления (все подтипы)
                      ->orWhere('type', $order->work_type); // конкретный подтип
                })
                ->exists();

            throw_if(
                !$hasLicense,
                AccessDeniedHttpException::class,
                'Недоступно: категория заказа не соответствует выбранным категориям исполнителя'
            );
        }

        $result = OrderResponse::updateOrCreate([
            'order_id' => $orderId,
            'executor_id' => auth()->user()->id,
        ], [
            'status' => ResponseStatus::Sent->value,
        ]);

        // Отправляем уведомление заказчику о новом отклике
        if ($result instanceof OrderResponse && $order->author) {
            UserNotification::create([
                'user_id' => $order->author->id,
                'data' => json_encode([
                    'type' => 'new_response',
                    'title' => 'Новый отклик на заказ',
                    'message' => "Исполнитель {$user->name} откликнулся на ваш заказ \"{$order->title}\"",
                    'order_id' => $order->id,
                    'order_title' => $order->title,
                    'executor_id' => $user->id,
                    'executor_name' => $user->name,
                    'response_id' => $result->id,
                ]),
                'read_at' => null,
            ]);
            
            // НОВОЕ: Отправляем push-уведомление заказчику
            $pushService = app(PushNotificationService::class);
            $pushService->sendOrderResponseNotification($order, $user);
        }

        return response()->json([
            'success' => $result instanceof OrderResponse,
        ]);
    }

    /**
     * @param int $orderId
     * @param int $responseId
     * @return JsonResponse
     * @throws Throwable
     */
    public function sendContact(int $orderId, int $responseId): JsonResponse
    {
        $orderResponse = OrderResponse::query()
            ->where('order_id', $orderId)
            ->where('id', $responseId)
            ->firstOrFail();

        $user = auth()->user();
        $order = $orderResponse->order;
        
        // Разрешаем отправку контактов автору заказа или посреднику, который взял заказ в работу
        $canSendContact = ($user->id === $order->author_id) || 
                          ($user->type === Type::Mediator->value && $order->mediator_id === $user->id);
        
        throw_if(
            !$canSendContact,
            AccessDeniedHttpException::class,
            __('order.customer.only_author_can_send_contact')
        );

        $result = $orderResponse->update([
            'status' => ResponseStatus::ContactOpenedByExecutor->value, // Сразу открываем контакты для обеих сторон
        ]);

        // Отправляем уведомление исполнителю о получении контактов
        if ($result && $orderResponse->executor) {
            UserNotification::create([
                'user_id' => $orderResponse->executor->id,
                'data' => json_encode([
                    'type' => 'contacts_exchanged',
                    'title' => 'Контакты обменены',
                    'message' => "Контакты обменены для заказа \"{$order->title}\". Теперь вы можете связаться с заказчиком.",
                    'order_id' => $order->id,
                    'order_title' => $order->title,
                    'customer_id' => $user->id,
                    'customer_name' => $user->name,
                ]),
                'read_at' => null,
            ]);
        }

        return response()->json([
            'success' => $result,
        ]);
    }

    /**
     * @param int $orderId
     * @param int $responseId
     * @return JsonResponse
     * @throws Throwable
     */
    public function sendExecutorContact(int $orderId, int $responseId): JsonResponse
    {
        $orderResponse = OrderResponse::query()
            ->where('order_id', $orderId)
            ->where('id', $responseId)
            ->firstOrFail();

        throw_if(
            auth()->user()->id !== $orderResponse->executor_id,
            AccessDeniedHttpException::class,
            __('order.executor.only_executor_can_send_contact')
        );

        // Проверяем, что заказчик уже отправил свои контакты
        throw_if(
            $orderResponse->status < ResponseStatus::ContactReceived->value,
            AccessDeniedHttpException::class,
            __('order.executor.customer_must_send_contacts_first')
        );

        // Контакты уже открыты после отправки заказчиком, ничего не меняем
        $result = true;

        // Контакты уже обменены автоматически при отправке заказчиком
        // Этот метод оставлен для совместимости с фронтендом

        return response()->json([
            'success' => $result,
        ]);
    }

    /**
     * @param int $orderId
     * @param int $responseId
     * @return JsonResponse
     * @throws Throwable
     */
    public function select(int $orderId, int $responseId): JsonResponse
    {
        $orderResponse = OrderResponse::query()
            ->where('order_id', $orderId)
            ->where('id', $responseId)
            ->firstOrFail();

        $user = auth()->user();
        $order = $orderResponse->order;
        
        // Разрешаем выбор исполнителя автору заказа или посреднику, который взял заказ в работу
        $canSelect = ($user->id === $order->author_id) || 
                     ($user->type === Type::Mediator->value && $order->mediator_id === $user->id);
        
        throw_if(
            !$canSelect,
            AccessDeniedHttpException::class,
            __('order.customer.only_author_can_select_response')
        );

        DB::beginTransaction();
        try {

            throw_if(
                $order->executor_id !== null
                || $order->orderResponses()->where('status', ResponseStatus::OrderReceived->value)
                    ->where('executor_id', '!=', $orderResponse->executor_id)->exists(),
                AccessDeniedHttpException::class,
                __('order.executor.already_selected')
            );

            $orderResponse->updateOrFail([
                'status' => ResponseStatus::OrderReceived->value,
            ]);

            $oldStatus = $order->status;
            $order->updateOrFail([
                'status' => Status::InWork->value, // Сразу в работу, без промежуточного статуса
                'executor_id' => $orderResponse->executor_id,
            ]);

            // Увеличиваем счетчик использованных заказов для исполнителя (перенесено из takeOnWork)
            $executor = $orderResponse->executor;
            if ($executor) {
                $executor->increment('used_orders_count');
            }

            // Отправляем уведомление исполнителю о начале работы
            UserNotification::create([
                'user_id' => $executor->id,
                'data' => json_encode([
                    'type' => 'order_started',
                    'title' => 'Заказ начат',
                    'message' => "Вы выбраны исполнителем заказа \"{$order->title}\". Работа началась автоматически.",
                    'order_id' => $order->id,
                    'order_title' => $order->title,
                    'customer_id' => $order->author->id,
                    'customer_name' => $order->author->name,
                ]),
                'read_at' => null,
            ]);
            
            // НОВОЕ: Удерживаем средства в escrow
            if ($order->max_amount > 0 && $order->author) {
                try {
                    $walletService = app(WalletService::class);
                    $amountCents = $order->max_amount * 100;
                    
                    $walletService->holdFunds($order->author, $amountCents, $order->id);
                    
                    $order->update([
                        'escrow_status' => 'held',
                        'payment_held' => $order->max_amount,
                    ]);
                } catch (\Exception $e) {
                    \Log::error('Failed to hold escrow funds', [
                        'order_id' => $order->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }
            
            // НОВОЕ: Отправляем push-уведомление исполнителю о выборе
            $pushService = app(PushNotificationService::class);
            $pushService->sendExecutorSelectedNotification($order, $executor);
            
            // Отправляем уведомление о смене статуса
            $statusNotificationService = app(\App\Services\OrderStatusNotificationService::class);
            $statusNotificationService->sendOrderStatusNotification($order, $oldStatus, Status::InWork->value);

            DB::commit();
            $result = true;
        } catch (Throwable) {
            DB::rollBack();
            $result = false;
        }

        return response()->json([
            'success' => $result,
        ]);
    }

    /**
     * @param int $orderId
     * @param int $responseId
     * @return JsonResponse
     * @throws Throwable
     */
    public function reject(int $orderId, int $responseId): JsonResponse
    {
        $orderResponse = OrderResponse::query()
            ->where('order_id', $orderId)
            ->where('id', $responseId)
            ->firstOrFail();

        $user = auth()->user();
        $order = $orderResponse->order;
        
        // Разрешаем отклонение ответа автору заказа или посреднику, который взял заказ в работу
        $canReject = ($user->id === $order->author_id) || 
                     ($user->type === Type::Mediator->value && $order->mediator_id === $user->id);
        
        throw_if(
            !$canReject,
            AccessDeniedHttpException::class,
            __('order.customer.only_author_can_reject_response')
        );

        DB::beginTransaction();
        try {

            // Если отклоняем выбранного исполнителя, возвращаем заказ к выбору исполнителя
            if (($order->status === Status::InWork->value || $order->status === Status::ExecutorSelected->value)
                && $orderResponse->executor_id === $order->executor_id) {
                $order->updateOrFail([
                    'status' => Status::SelectingExecutor->value,
                    'executor_id' => null,
                ]);

                // Уменьшаем счетчик использованных заказов если исполнитель был в работе
                if ($order->status === Status::InWork->value && $orderResponse->executor) {
                    $orderResponse->executor->decrement('used_orders_count');
                }
            }

            $orderResponse->updateOrFail([
                'status' => ResponseStatus::Rejected->value,
            ]);

            // Отправляем уведомление исполнителю об отклонении
            if ($orderResponse->executor) {
                UserNotification::create([
                    'user_id' => $orderResponse->executor->id,
                    'data' => json_encode([
                        'type' => 'response_rejected',
                        'title' => 'Отклик отклонен',
                        'message' => "Ваш отклик на заказ \"{$order->title}\" был отклонен заказчиком",
                        'order_id' => $order->id,
                        'order_title' => $order->title,
                        'customer_id' => $order->author->id,
                        'customer_name' => $order->author->name,
                    ]),
                    'read_at' => null,
                ]);
            }

            DB::commit();
            $result = true;
        } catch (Throwable) {
            DB::rollBack();
            $result = false;
        }

        return response()->json([
            'success' => $result,
        ]);
    }

    /**
     * @param int $orderId
     * @param int $responseId
     * @return JsonResponse
     * @throws Throwable
     */
    public function revoke(int $orderId, int $responseId): JsonResponse
    {
        $order = Order::findOrFail($orderId);

        $orderResponse = OrderResponse::query()
            ->where('order_id', $orderId)
            ->where('id', $responseId)
            ->firstOrFail();

        throw_if(
            auth()->user()->id !== $orderResponse->executor_id,
            AccessDeniedHttpException::class,
            __('order.executor.only_executor_can_revoke_response')
        );

        DB::beginTransaction();
        try {
            if ($order->status === Status::ExecutorSelected->value
                && $orderResponse->executor_id === $order->executor_id
            ) {
                $order->updateOrFail([
                    'status' => Status::SelectingExecutor->value,
                    'executor_id' => null,
                ]);
            }

            $orderResponse->deleteOrFail();

            DB::commit();
            $result = true;
        } catch (Throwable) {
            DB::rollBack();
            $result = false;
        }

        return response()->json([
            'success' => $result,
        ]);
    }

    /**
     * @param int $orderId
     * @param int $responseId
     * @return JsonResponse
     * @throws Throwable
     */
    public function takeOnWork(int $orderId, int $responseId): JsonResponse
    {
        $user = auth()->user();
        
        // Проверяем подписку и лимиты
        $subscriptionService = new SubscriptionService();
        $subscriptionCheck = $subscriptionService->canUserTakeOrder($user);
        
        throw_if(
            !$subscriptionCheck['can_take'],
            AccessDeniedHttpException::class,
            $subscriptionCheck['message']
        );

        $order = Order::findOrFail($orderId);

        $orderResponse = OrderResponse::query()
            ->where('order_id', $orderId)
            ->where('id', $responseId)
            ->firstOrFail();

        throw_if(
            $user->id !== $orderResponse->executor_id,
            AccessDeniedHttpException::class,
            __('order.executor.only_executor_can_take_on_work')
        );

        throw_if(
            $order->executor_id === null || $orderResponse->executor_id !== $order->executor_id,
            AccessDeniedHttpException::class,
            __('order.executor.executor_not_selected_for_order')
        );

        // Метод takeOnWork больше не нужен - заказ автоматически начинается после выбора
        throw_if(
            true, // Всегда блокируем этот метод
            AccessDeniedHttpException::class,
            'This action is no longer available. Orders start automatically after executor selection.'
        );

        throw_if(
            $orderResponse->status !== ResponseStatus::OrderReceived->value,
            AccessDeniedHttpException::class,
            __('order.executor.response_not_in_order_received_status')
        );

        DB::beginTransaction();
        try {
            $oldStatus = $order->status;
            $order->updateOrFail([
                'status' => Status::InWork->value,
            ]);

            $orderResponse->updateOrFail([
                'status' => ResponseStatus::TakenIntoWork->value,
            ]);

            // Логика перенесена в метод select - заказ автоматически начинается после выбора исполнителя

            // Отправляем уведомление о смене статуса
            $notificationService = app(\App\Services\OrderStatusNotificationService::class);
            $notificationService->sendOrderStatusNotification($order, $oldStatus, Status::InWork->value);

            DB::commit();
            $result = true;
        } catch (Throwable) {
            DB::rollBack();
            $result = false;
        }

        return response()->json([
            'success' => $result,
        ]);
    }

    /**
     * Получить количество новых откликов на заказы пользователя
     */
    public function getNewResponsesCount(): JsonResponse
    {
        $user = auth()->user();
        
        // Только заказчики могут получать отклики
        if ($user->type !== Type::Customer->value) {
            return response()->json([
                'success' => true,
                'count' => 0
            ]);
        }

        // Считаем новые отклики на заказы пользователя
        $newResponsesCount = OrderResponse::whereHas('order', function ($query) use ($user) {
                $query->where('author_id', $user->id);
            })
            ->where('status', ResponseStatus::Sent->value) // Только новые отклики
            ->count();

        return response()->json([
            'success' => true,
            'count' => $newResponsesCount
        ]);
    }
}
