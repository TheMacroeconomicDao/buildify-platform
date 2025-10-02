<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use App\Models\UserNotification;
use App\Enums\Order\Status;
use App\Enums\Users\Type;
use Illuminate\Support\Facades\Log;

class OrderStatusNotificationService
{
    /**
     * Отправить уведомление о смене статуса заказа
     * 
     * @param Order $order
     * @param int|null $oldStatus
     * @param int $newStatus
     * @return void
     */
    public function sendOrderStatusNotification(Order $order, ?int $oldStatus, int $newStatus): void
    {
        try {
            // Определяем, кому отправлять уведомление
            $recipients = $this->getNotificationRecipients($order, $oldStatus, $newStatus);
            
            foreach ($recipients as $recipient) {
                $notificationData = $this->buildNotificationData($order, $oldStatus, $newStatus, $recipient);
                
                if ($notificationData) {
                    UserNotification::create([
                        'user_id' => $recipient->id,
                        'data' => json_encode($notificationData),
                        'read_at' => null,
                    ]);
                }
            }
            
            Log::info('Order status notification sent', [
                'order_id' => $order->id,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'recipients_count' => count($recipients)
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to send order status notification', [
                'order_id' => $order->id,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Определить получателей уведомления
     * 
     * @param Order $order
     * @param int|null $oldStatus
     * @param int $newStatus
     * @return array
     */
    private function getNotificationRecipients(Order $order, ?int $oldStatus, int $newStatus): array
    {
        $recipients = [];
        
        // Всегда уведомляем автора заказа (заказчика)
        if ($order->author) {
            $recipients[] = $order->author;
        }
        
        // Уведомляем исполнителя, если он назначен
        if ($order->executor && $order->executor->id !== $order->author_id) {
            $recipients[] = $order->executor;
        }
        
        return $recipients;
    }
    
    /**
     * Построить данные уведомления
     * 
     * @param Order $order
     * @param int|null $oldStatus
     * @param int $newStatus
     * @param User $recipient
     * @return array|null
     */
    private function buildNotificationData(Order $order, ?int $oldStatus, int $newStatus, User $recipient): ?array
    {
        $statusMessages = $this->getStatusMessages($newStatus, $recipient->type);
        
        if (!$statusMessages) {
            return null;
        }
        
        return [
            'type' => 'order_status_changed',
            'title' => $statusMessages['title'],
            'message' => $statusMessages['message'],
            'order_id' => $order->id,
            'order_title' => $order->title,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'status_name' => $this->getStatusName($newStatus),
            'created_at' => now()->format('Y-m-d H:i:s'),
        ];
    }
    
    /**
     * Получить сообщения для статуса
     * 
     * @param int $status
     * @param int $userType
     * @return array|null
     */
    private function getStatusMessages(int $status, int $userType): ?array
    {
        $isCustomer = $userType === Type::Customer->value;
        
        return match($status) {
            Status::SearchExecutor->value => [
                'title' => $isCustomer ? 'Заказ создан' : 'Новый заказ',
                'message' => $isCustomer ? 'Ваш заказ создан и ищет исполнителя' : 'Появился новый заказ для выполнения'
            ],
            Status::SelectingExecutor->value => [
                'title' => $isCustomer ? 'Получены отклики' : 'Заказчик выбирает исполнителя',
                'message' => $isCustomer ? 'На ваш заказ поступили отклики' : 'Заказчик рассматривает отклики'
            ],
            Status::ExecutorSelected->value => [
                'title' => $isCustomer ? 'Исполнитель выбран' : 'Вас выбрали исполнителем',
                'message' => $isCustomer ? 'Исполнитель выбран для вашего заказа' : 'Вас выбрали исполнителем заказа'
            ],
            Status::InWork->value => [
                'title' => $isCustomer ? 'Заказ в работе' : 'Заказ взят в работу',
                'message' => $isCustomer ? 'Исполнитель начал работу над заказом' : 'Вы взяли заказ в работу'
            ],
            Status::AwaitingConfirmation->value => [
                'title' => $isCustomer ? 'Работа завершена' : 'Работа отправлена на проверку',
                'message' => $isCustomer ? 'Исполнитель завершил работу, требуется подтверждение' : 'Вы завершили работу, ожидается подтверждение заказчика'
            ],
            Status::Closed->value => [
                'title' => $isCustomer ? 'Заказ закрыт' : 'Заказ успешно завершен',
                'message' => $isCustomer ? 'Заказ успешно завершен' : 'Заказ успешно завершен и закрыт'
            ],
            Status::Rejected->value => [
                'title' => $isCustomer ? 'Работа отклонена' : 'Работа отклонена заказчиком',
                'message' => $isCustomer ? 'Работа отклонена, требуется доработка' : 'Заказчик отклонил работу, требуется доработка'
            ],
            Status::Cancelled->value => [
                'title' => $isCustomer ? 'Заказ отменен' : 'Заказ отменен заказчиком',
                'message' => $isCustomer ? 'Заказ отменен' : 'Заказчик отменил заказ'
            ],
            default => null
        };
    }
    
    /**
     * Получить название статуса
     * 
     * @param int $status
     * @return string
     */
    private function getStatusName(int $status): string
    {
        return match($status) {
            Status::SearchExecutor->value => 'Поиск исполнителя',
            Status::SelectingExecutor->value => 'Выбор исполнителя',
            Status::ExecutorSelected->value => 'Исполнитель выбран',
            Status::InWork->value => 'В работе',
            Status::AwaitingConfirmation->value => 'Ожидает подтверждения',
            Status::Closed->value => 'Закрыт',
            Status::Rejected->value => 'Отклонен',
            Status::Cancelled->value => 'Отменен',
            Status::Completed->value => 'Завершен',
            Status::Deleted->value => 'Удален',
            default => 'Неизвестный статус'
        };
    }
}
