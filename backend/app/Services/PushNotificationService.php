<?php

namespace App\Services;

use App\Models\User;
use App\Models\Order;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Exception;

class PushNotificationService
{
    private string $fcmServerKey;
    private string $fcmUrl = 'https://fcm.googleapis.com/fcm/send';

    public function __construct()
    {
        $this->fcmServerKey = config('services.fcm.server_key');
    }

    /**
     * Отправить push-уведомление пользователю
     */
    public function sendToUser(User $user, string $title, string $message, array $data = []): bool
    {
        if (!$user->push_token) {
            Log::info('User has no push token', ['user_id' => $user->id]);
            return false;
        }

        return $this->sendPushNotification($user->push_token, $title, $message, $data);
    }

    /**
     * Отправить push-уведомление группе пользователей
     */
    public function sendToUsers(array $users, string $title, string $message, array $data = []): array
    {
        $results = [];
        $tokens = [];

        foreach ($users as $user) {
            if ($user->push_token) {
                $tokens[] = $user->push_token;
            }
        }

        if (empty($tokens)) {
            Log::info('No users with push tokens found', ['users_count' => count($users)]);
            return [];
        }

        return $this->sendMulticastPushNotification($tokens, $title, $message, $data);
    }

    /**
     * Отправить push всем заказчикам
     */
    public function sendToAllCustomers(string $title, string $message, array $data = []): array
    {
        $customers = User::where('type', \App\Enums\Users\Type::Customer->value)
            ->whereNotNull('push_token')
            ->get();

        return $this->sendToUsers($customers->toArray(), $title, $message, $data);
    }

    /**
     * Отправить push всем исполнителям
     */
    public function sendToAllExecutors(string $title, string $message, array $data = []): array
    {
        $executors = User::where('type', \App\Enums\Users\Type::Executor->value)
            ->whereNotNull('push_token')
            ->get();

        return $this->sendToUsers($executors->toArray(), $title, $message, $data);
    }

    /**
     * Отправить push-уведомление о новом отклике на заказ
     */
    public function sendOrderResponseNotification(Order $order, User $executor): bool
    {
        if (!$order->author) {
            return false;
        }

        $title = 'Новый отклик на ваш заказ!';
        $message = "Исполнитель {$executor->name} откликнулся на заказ \"{$order->title}\"";
        $data = [
            'type' => 'order_response',
            'order_id' => $order->id,
            'executor_id' => $executor->id,
            'order_title' => $order->title,
            'executor_name' => $executor->name,
        ];

        return $this->sendToUser($order->author, $title, $message, $data);
    }

    /**
     * Отправить push-уведомление исполнителю о выборе для заказа
     */
    public function sendExecutorSelectedNotification(Order $order, User $executor): bool
    {
        $title = 'Вас выбрали для выполнения заказа!';
        $message = "Вы назначены исполнителем заказа \"{$order->title}\"";
        $data = [
            'type' => 'executor_selected',
            'order_id' => $order->id,
            'order_title' => $order->title,
            'customer_name' => $order->author->name ?? 'Заказчик',
        ];

        return $this->sendToUser($executor, $title, $message, $data);
    }

    /**
     * Базовый метод отправки push-уведомления
     */
    private function sendPushNotification(string $token, string $title, string $message, array $data = []): bool
    {
        try {
            $payload = [
                'to' => $token,
                'notification' => [
                    'title' => $title,
                    'body' => $message,
                    'sound' => 'default',
                    'badge' => 1,
                ],
                'data' => array_merge($data, [
                    'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                    'timestamp' => now()->toISOString(),
                ])
            ];

            $response = Http::withHeaders([
                'Authorization' => 'key=' . $this->fcmServerKey,
                'Content-Type' => 'application/json',
            ])->post($this->fcmUrl, $payload);

            if ($response->successful()) {
                $result = $response->json();
                Log::info('Push notification sent successfully', [
                    'token' => substr($token, 0, 20) . '...',
                    'title' => $title,
                    'success' => $result['success'] ?? 0,
                    'failure' => $result['failure'] ?? 0,
                ]);
                return true;
            } else {
                Log::error('Push notification failed', [
                    'token' => substr($token, 0, 20) . '...',
                    'status' => $response->status(),
                    'response' => $response->body()
                ]);
                return false;
            }

        } catch (Exception $e) {
            Log::error('Push notification exception', [
                'token' => substr($token, 0, 20) . '...',
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Отправка push-уведомлений нескольким пользователям
     */
    private function sendMulticastPushNotification(array $tokens, string $title, string $message, array $data = []): array
    {
        $results = [];
        $batchSize = 100; // FCM поддерживает до 1000, но используем 100 для надежности

        $batches = array_chunk($tokens, $batchSize);

        foreach ($batches as $batchIndex => $batch) {
            try {
                $payload = [
                    'registration_ids' => $batch,
                    'notification' => [
                        'title' => $title,
                        'body' => $message,
                        'sound' => 'default',
                        'badge' => 1,
                    ],
                    'data' => array_merge($data, [
                        'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                        'timestamp' => now()->toISOString(),
                    ])
                ];

                $response = Http::withHeaders([
                    'Authorization' => 'key=' . $this->fcmServerKey,
                    'Content-Type' => 'application/json',
                ])->post($this->fcmUrl, $payload);

                if ($response->successful()) {
                    $result = $response->json();
                    $results[] = [
                        'batch' => $batchIndex + 1,
                        'tokens_count' => count($batch),
                        'success' => $result['success'] ?? 0,
                        'failure' => $result['failure'] ?? 0,
                    ];

                    Log::info('Batch push notification sent', [
                        'batch' => $batchIndex + 1,
                        'tokens_count' => count($batch),
                        'success' => $result['success'] ?? 0,
                        'failure' => $result['failure'] ?? 0,
                    ]);
                } else {
                    Log::error('Batch push notification failed', [
                        'batch' => $batchIndex + 1,
                        'status' => $response->status(),
                        'response' => $response->body()
                    ]);
                }

            } catch (Exception $e) {
                Log::error('Batch push notification exception', [
                    'batch' => $batchIndex + 1,
                    'error' => $e->getMessage()
                ]);
            }
        }

        return $results;
    }

    /**
     * Обновить push токен пользователя
     */
    public function updateUserPushToken(User $user, string $token): bool
    {
        try {
            $user->update([
                'push_token' => $token,
                'push_token_updated_at' => now(),
            ]);

            Log::info('Push token updated', [
                'user_id' => $user->id,
                'token' => substr($token, 0, 20) . '...'
            ]);

            return true;
        } catch (Exception $e) {
            Log::error('Failed to update push token', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Обновить настройки push-уведомлений пользователя
     */
    public function updateUserPushSettings(User $user, array $settings): bool
    {
        try {
            $defaultSettings = [
                'order_responses' => true,
                'order_status_changes' => true,
                'executor_selected' => true,
                'payment_notifications' => true,
                'promotional' => false,
                'scheduled' => true,
            ];

            $mergedSettings = array_merge($defaultSettings, $settings);

            $user->update([
                'push_settings' => $mergedSettings,
            ]);

            Log::info('Push settings updated', [
                'user_id' => $user->id,
                'settings' => $mergedSettings
            ]);

            return true;
        } catch (Exception $e) {
            Log::error('Failed to update push settings', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Проверить, разрешены ли push-уведомления для пользователя
     */
    public function isPushEnabledForUser(User $user, string $notificationType): bool
    {
        if (!$user->push_token) {
            return false;
        }

        $settings = $user->push_settings ?? [];
        return $settings[$notificationType] ?? true; // По умолчанию включено
    }
}
