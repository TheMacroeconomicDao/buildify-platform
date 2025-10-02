<?php

namespace App\Observers;

use App\Models\Order;
use App\Services\NotificationService;
use App\Events\OrderUpdateEvent;
use App\Events\UserNotificationEvent;

class OrderObserver
{
    private NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Handle the Order "created" event.
     */
    public function created(Order $order): void
    {
        // Загружаем автора заказа
        $order->load('author');
        
        // Лимиты тратятся когда исполнитель берет заказ, не при создании
        
        // Отправляем уведомление о новом заказе
        $this->notificationService->notifyNewOrder($order);
    }

    /**
     * Handle the Order "updated" event.
     */
    public function updated(Order $order): void
    {
        // Уведомления об изменении статуса заказа
        if ($order->wasChanged('status')) {
            $this->handleStatusChange($order);
        }

        // Уведомления при назначении исполнителя
        if ($order->wasChanged('executor_id') && $order->executor_id) {
            $this->handleExecutorAssigned($order);
        }

        // Уведомления при назначении посредника
        if ($order->wasChanged('mediator_id') && $order->mediator_id) {
            $this->handleMediatorAssigned($order);
        }
    }

    /**
     * Обработка изменения статуса заказа
     */
    private function handleStatusChange(Order $order): void
    {
        $statusMessages = [
            'search_executor' => 'Заказ переведен в статус "Поиск исполнителя"',
            'selecting_executor' => 'Заказ переведен в статус "Выбор исполнителя"',
            'in_progress' => 'Заказ взят в работу',
            'completed' => 'Заказ завершен',
            'cancelled' => 'Заказ отменен',
        ];

        $message = $statusMessages[$order->status] ?? 'Статус заказа изменен';

        // Лимиты тратятся при создании заказа, не при завершении

        // Отправляем WebSocket уведомление в канал заказа
        broadcast(new OrderUpdateEvent(
            $order,
            'status_changed',
            'Статус заказа изменен',
            $message,
            [
                'old_status' => $order->getOriginal('status'),
                'new_status' => $order->status,
            ]
        ));

        // Уведомляем автора заказа
        if ($order->author) {
            broadcast(new UserNotificationEvent(
                'order_status_changed',
                'Статус заказа изменен',
                "Статус вашего заказа \"{$order->title}\" изменен: {$message}",
                [
                    'order_id' => $order->id,
                    'order_title' => $order->title,
                    'old_status' => $order->getOriginal('status'),
                    'new_status' => $order->status,
                ],
                $order->author_id
            ));
        }

        // Уведомляем исполнителя
        if ($order->executor) {
            broadcast(new UserNotificationEvent(
                'order_status_changed',
                'Статус заказа изменен',
                "Статус заказа \"{$order->title}\" изменен: {$message}",
                [
                    'order_id' => $order->id,
                    'order_title' => $order->title,
                    'old_status' => $order->getOriginal('status'),
                    'new_status' => $order->status,
                ],
                $order->executor_id
            ));
        }
    }

    /**
     * Обработка назначения исполнителя
     */
    private function handleExecutorAssigned(Order $order): void
    {
        $order->load('executor');

        // Уведомляем исполнителя
        if ($order->executor) {
            broadcast(new UserNotificationEvent(
                'executor_assigned',
                'Вы назначены исполнителем',
                "Вы назначены исполнителем заказа \"{$order->title}\"",
                [
                    'order_id' => $order->id,
                    'order_title' => $order->title,
                ],
                $order->executor_id
            ));
        }

        // Уведомляем автора заказа
        if ($order->author) {
            broadcast(new UserNotificationEvent(
                'executor_assigned',
                'Исполнитель назначен',
                "Для вашего заказа \"{$order->title}\" назначен исполнитель: {$order->executor->name}",
                [
                    'order_id' => $order->id,
                    'order_title' => $order->title,
                    'executor_name' => $order->executor->name,
                    'executor_id' => $order->executor_id,
                ],
                $order->author_id
            ));
        }
    }

    /**
     * Обработка назначения посредника
     */
    private function handleMediatorAssigned(Order $order): void
    {
        $order->load('mediator');

        // Уведомляем посредника
        if ($order->mediator) {
            broadcast(new UserNotificationEvent(
                'mediator_assigned',
                'Вы назначены посредником',
                "Вы назначены посредником заказа \"{$order->title}\"",
                [
                    'order_id' => $order->id,
                    'order_title' => $order->title,
                ],
                $order->mediator_id
            ));
        }

        // Уведомляем автора заказа
        if ($order->author) {
            broadcast(new UserNotificationEvent(
                'mediator_assigned',
                'Посредник назначен',
                "Для вашего заказа \"{$order->title}\" назначен посредник: {$order->mediator->name}",
                [
                    'order_id' => $order->id,
                    'order_title' => $order->title,
                    'mediator_name' => $order->mediator->name,
                    'mediator_id' => $order->mediator_id,
                ],
                $order->author_id
            ));
        }
    }

    /**
     * Handle the Order "deleted" event.
     */
    public function deleted(Order $order): void
    {
        //
    }

    /**
     * Handle the Order "restored" event.
     */
    public function restored(Order $order): void
    {
        //
    }

    /**
     * Handle the Order "force deleted" event.
     */
    public function forceDeleted(Order $order): void
    {
        //
    }


}
