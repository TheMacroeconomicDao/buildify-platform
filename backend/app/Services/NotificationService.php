<?php

namespace App\Services;

use App\Models\AdminNotification;
use App\Models\User;
use App\Models\Order;
use App\Models\Complaint;
use App\Enums\Users\Type;
use App\Events\AdminNotificationEvent;
use App\Events\UserNotificationEvent;

class NotificationService
{
    /**
     * Уведомление о новом пользователе
     */
    public function notifyNewUser(User $user): void
    {
        $userType = match($user->type) {
            Type::Customer->value => 'заказчик',
            Type::Executor->value => 'исполнитель',
            default => 'пользователь'
        };

        AdminNotification::createForAllAdmins(
            'Новый пользователь зарегистрировался',
            "Новый {$userType} {$user->name} ({$user->email}) зарегистрировался в системе",
            'new_user',
            [
                'user_id' => $user->id,
                'user_type' => $user->type,
                'user_email' => $user->email,
            ],
            $user
        );

        // Отправляем WebSocket уведомление администраторам
        broadcast(new AdminNotificationEvent(
            'new_user',
            'Новый пользователь зарегистрировался',
            "Новый {$userType} {$user->name} ({$user->email}) зарегистрировался в системе",
            [
                'user_id' => $user->id,
                'user_type' => $user->type,
                'user_email' => $user->email,
                'user_name' => $user->name,
            ]
        ));
    }

    /**
     * Уведомление о новом заказе
     */
    public function notifyNewOrder(Order $order): void
    {
        AdminNotification::createForAllAdmins(
            'Новый заказ создан',
            "Создан новый заказ \"{$order->title}\" от пользователя {$order->author->name}",
            'new_order',
            [
                'order_id' => $order->id,
                'author_name' => $order->author->name,
                'max_amount' => $order->max_amount,
            ],
            $order
        );

        // Отправляем WebSocket уведомление администраторам
        broadcast(new AdminNotificationEvent(
            'new_order',
            'Новый заказ создан',
            "Создан новый заказ \"{$order->title}\" от пользователя {$order->author->name}",
            [
                'order_id' => $order->id,
                'order_title' => $order->title,
                'author_name' => $order->author->name,
                'author_id' => $order->author->id,
                'max_amount' => $order->max_amount,
            ]
        ));
    }

    /**
     * Уведомление о новой жалобе
     */
    public function notifyNewComplaint(Complaint $complaint): void
    {
        AdminNotification::createForAllAdmins(
            'Новая жалоба получена',
            "Получена новая жалоба от пользователя {$complaint->complainant->name} на {$complaint->reportedUser->name}",
            'new_complaint',
            [
                'complaint_id' => $complaint->id,
                'reason' => $complaint->reason,
                'complainant_name' => $complaint->complainant->name,
                'reported_user_name' => $complaint->reportedUser->name,
            ],
            $complaint
        );
    }

    /**
     * Уведомление о запросе на верификацию
     */
    public function notifyVerificationRequest(User $user): void
    {
        AdminNotification::createForAllAdmins(
            'Запрос на верификацию исполнителя',
            "Исполнитель {$user->name} подал заявку на верификацию",
            'verification_request',
            [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'user_email' => $user->email,
            ],
            $user
        );
    }

    /**
     * Уведомление о проблемах в системе
     */
    public function notifySystemIssue(string $title, string $message, array $data = []): void
    {
        AdminNotification::createForAllAdmins(
            $title,
            $message,
            'error',
            $data
        );
    }

    /**
     * Уведомление об успешных операциях
     */
    public function notifySuccess(string $title, string $message, array $data = []): void
    {
        AdminNotification::createForAllAdmins(
            $title,
            $message,
            'success',
            $data
        );
    }

    /**
     * Предупреждающие уведомления
     */
    public function notifyWarning(string $title, string $message, array $data = []): void
    {
        AdminNotification::createForAllAdmins(
            $title,
            $message,
            'warning',
            $data
        );
    }

    /**
     * Информационные уведомления
     */
    public function notifyInfo(string $title, string $message, array $data = []): void
    {
        AdminNotification::createForAllAdmins(
            $title,
            $message,
            'info',
            $data
        );
    }

    /**
     * Получить количество непрочитанных уведомлений для администратора
     */
    public function getUnreadCount(int $adminId): int
    {
        return AdminNotification::where('admin_id', $adminId)
            ->whereNull('read_at')
            ->count();
    }

    /**
     * Получить последние уведомления для администратора
     */
    public function getRecentNotifications(int $adminId, int $limit = 10): \Illuminate\Database\Eloquent\Collection
    {
        return AdminNotification::where('admin_id', $adminId)
            ->latest()
            ->limit($limit)
            ->get();
    }
}
