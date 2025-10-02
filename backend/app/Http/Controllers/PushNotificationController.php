<?php

namespace App\Http\Controllers;

use App\Models\ScheduledNotification;
use App\Models\User;
use App\Services\PushNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class PushNotificationController extends Controller
{
    private PushNotificationService $pushService;

    public function __construct(PushNotificationService $pushService)
    {
        $this->pushService = $pushService;
    }

    /**
     * Обновить push токен пользователя
     */
    public function updateToken(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'push_token' => 'required|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        $success = $this->pushService->updateUserPushToken($user, $request->push_token);

        return response()->json([
            'success' => $success,
            'message' => $success ? 'Push token updated successfully' : 'Failed to update push token'
        ]);
    }

    /**
     * Обновить настройки push-уведомлений пользователя
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'order_responses' => 'boolean',
            'order_status_changes' => 'boolean',
            'executor_selected' => 'boolean',
            'payment_notifications' => 'boolean',
            'promotional' => 'boolean',
            'scheduled' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        $settings = $request->only([
            'order_responses',
            'order_status_changes', 
            'executor_selected',
            'payment_notifications',
            'promotional',
            'scheduled'
        ]);

        $success = $this->pushService->updateUserPushSettings($user, $settings);

        return response()->json([
            'success' => $success,
            'message' => $success ? 'Push settings updated successfully' : 'Failed to update push settings',
            'settings' => $user->fresh()->push_settings
        ]);
    }

    /**
     * Получить настройки push-уведомлений пользователя
     */
    public function getSettings(): JsonResponse
    {
        $user = Auth::user();
        
        return response()->json([
            'success' => true,
            'settings' => $user->push_settings ?? [
                'order_responses' => true,
                'order_status_changes' => true,
                'executor_selected' => true,
                'payment_notifications' => true,
                'promotional' => false,
                'scheduled' => true,
            ],
            'has_token' => !empty($user->push_token)
        ]);
    }

    /**
     * Отправить тестовое push-уведомление
     */
    public function sendTest(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user->push_token) {
            return response()->json([
                'success' => false,
                'message' => 'No push token found for user'
            ], 400);
        }

        $title = $request->input('title', 'Тестовое уведомление');
        $message = $request->input('message', 'Это тестовое push-уведомление от Buildlify');

        $success = $this->pushService->sendToUser($user, $title, $message, [
            'type' => 'test',
            'timestamp' => now()->toISOString()
        ]);

        return response()->json([
            'success' => $success,
            'message' => $success ? 'Test notification sent successfully' : 'Failed to send test notification'
        ]);
    }

    /**
     * Создать запланированное уведомление (только для админов)
     */
    public function createScheduled(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        // Проверяем права администратора
        if ($user->type !== \App\Enums\Users\Type::Admin->value) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'message' => 'required|string|max:1000',
            'target_type' => 'required|in:all,customers,executors,specific_users',
            'target_user_ids' => 'required_if:target_type,specific_users|array',
            'target_user_ids.*' => 'integer|exists:users,id',
            'schedule_type' => 'required|in:once,daily,weekly,monthly',
            'scheduled_at' => 'required|date|after:now',
            'data' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $notification = ScheduledNotification::create([
            'title' => $request->title,
            'message' => $request->message,
            'data' => $request->data,
            'target_type' => $request->target_type,
            'target_user_ids' => $request->target_user_ids,
            'schedule_type' => $request->schedule_type,
            'scheduled_at' => $request->scheduled_at,
            'schedule_config' => $request->schedule_config,
            'created_by' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Scheduled notification created successfully',
            'notification' => [
                'id' => $notification->id,
                'title' => $notification->title,
                'scheduled_at' => $notification->scheduled_at->toISOString(),
                'target_type' => $notification->target_type,
                'schedule_type' => $notification->schedule_type,
            ]
        ]);
    }

    /**
     * Получить список запланированных уведомлений (только для админов)
     */
    public function getScheduled(): JsonResponse
    {
        $user = Auth::user();
        
        if ($user->type !== \App\Enums\Users\Type::Admin->value) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied'
            ], 403);
        }

        $notifications = ScheduledNotification::with('creator')
            ->orderBy('scheduled_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'notifications' => $notifications->items(),
            'pagination' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'total' => $notifications->total(),
            ]
        ]);
    }

    /**
     * Отменить запланированное уведомление (только для админов)
     */
    public function cancelScheduled(int $id): JsonResponse
    {
        $user = Auth::user();
        
        if ($user->type !== \App\Enums\Users\Type::Admin->value) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied'
            ], 403);
        }

        $notification = ScheduledNotification::findOrFail($id);
        
        if ($notification->status !== ScheduledNotification::STATUS_PENDING) {
            return response()->json([
                'success' => false,
                'message' => 'Can only cancel pending notifications'
            ], 400);
        }

        $notification->update(['status' => ScheduledNotification::STATUS_CANCELLED]);

        return response()->json([
            'success' => true,
            'message' => 'Notification cancelled successfully'
        ]);
    }
}