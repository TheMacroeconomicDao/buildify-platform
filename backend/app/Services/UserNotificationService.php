<?php
namespace App\Services;


use App\Models\UserNotification;

class UserNotificationService
{
    /**
     * @param int $userId
     * @return mixed
     */
    public function getCountUnreadNotifications(int $userId): int
    {
        return UserNotification::where('user_id', $userId)->whereNull('read_at')->count();
    }

    /**
     * @param int $userId
     * @return mixed
     */
    public function getNotifications(int $userId): mixed
    {
        return UserNotification::where('user_id', $userId)->select('id', 'data', 'created_at', 'read_at')->get();
    }

    /**
     * @param int $userId
     * @param array|null $ids
     * @return mixed
     */
    public function readNotifications(int $userId, ?array $ids): mixed
    {
        if ($ids !== null) {
            return UserNotification::where('user_id', $userId)->whereIn('id', $ids)->update(['read_at' => date('Y-m-d H:i:s')]);
        } else {
            return UserNotification::where('user_id', $userId)->whereNull('read_at')->update(['read_at' => date('Y-m-d H:i:s')]);
        }
    }
}
