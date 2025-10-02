<?php

namespace App\Services;

use App\Mail\ExecutorOrderNotification;
use App\Models\Order;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class ExecutorNotificationService
{
    /**
     * Отправить уведомление исполнителю о выборе для заказа
     * 
     * @param Order $order
     * @param User $executor
     * @return bool
     */
    public function sendExecutorSelectedNotification(Order $order, User $executor): bool
    {
        try {
            // Отправляем email уведомление
            $this->sendEmailNotification($order, $executor);
            
            // Создаем внутреннее уведомление
            $this->createInternalNotification($order, $executor);
            
            Log::info('Executor notification sent successfully', [
                'order_id' => $order->id,
                'executor_id' => $executor->id,
                'executor_email' => $executor->email
            ]);
            
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send executor notification', [
                'order_id' => $order->id,
                'executor_id' => $executor->id,
                'error' => $e->getMessage()
            ]);
            
            return false;
        }
    }
    
    /**
     * Отправить email уведомление
     * 
     * @param Order $order
     * @param User $executor
     * @return void
     */
    private function sendEmailNotification(Order $order, User $executor): void
    {
        if (!$executor->email) {
            Log::warning('Executor has no email address', [
                'executor_id' => $executor->id,
                'order_id' => $order->id
            ]);
            return;
        }
        
        Mail::to($executor->email)->send(new ExecutorOrderNotification($order, $executor));
    }
    
    /**
     * Создать внутреннее уведомление
     * 
     * @param Order $order
     * @param User $executor
     * @return void
     */
    private function createInternalNotification(Order $order, User $executor): void
    {
        $notificationData = [
            'type' => 'executor_selected',
            'title' => __('order.executor.selected_notification_title'),
            'message' => __('order.executor.selected_notification_message', [
                'order_title' => $order->title,
                'order_id' => $order->id,
            ]),
            'order_id' => $order->id,
            'order_title' => $order->title,
            'customer_name' => $order->author->name,
            'max_amount' => $order->max_amount,
            'work_date' => $order->work_date ? $order->work_date->format('d.m.Y') : ($order->start_date ? $order->start_date->format('d.m.Y') : null),
        ];
        
        UserNotification::create([
            'user_id' => $executor->id,
            'data' => json_encode($notificationData),
            'read_at' => null,
        ]);
    }
}
