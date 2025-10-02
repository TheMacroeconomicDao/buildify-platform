<?php

namespace App\Services;

use App\Models\Complaint;
use App\Models\UserNotification;
use App\Models\User;
use App\Enums\Users\Type;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ComplaintService
{
    private UserNotificationService $userNotificationService;

    public function __construct(UserNotificationService $userNotificationService)
    {
        $this->userNotificationService = $userNotificationService;
    }

    /**
     * Создать новую жалобу
     */
    public function createComplaint(array $data): Complaint
    {
        return DB::transaction(function () use ($data) {
            // Проверяем, не подавал ли пользователь уже жалобу на этого пользователя недавно
            $existingComplaint = Complaint::where('complainant_id', $data['complainant_id'])
                ->where('reported_user_id', $data['reported_user_id'])
                ->where('created_at', '>=', now()->subHours(24))
                ->first();

            if ($existingComplaint) {
                throw new \Exception('Вы уже подавали жалобу на этого пользователя в течение последних 24 часов');
            }

            // Создаем жалобу
            $complaint = Complaint::create($data);

            // Отправляем уведомление администраторам
            $this->notifyAdministrators($complaint);

            // Логируем создание жалобы
            Log::info('New complaint created', [
                'complaint_id' => $complaint->id,
                'complainant_id' => $complaint->complainant_id,
                'reported_user_id' => $complaint->reported_user_id,
                'reason' => $complaint->reason,
            ]);

            return $complaint;
        });
    }

    /**
     * Уведомить администраторов о новой жалобе
     */
    private function notifyAdministrators(Complaint $complaint): void
    {
        try {
            // Получаем всех администраторов
            $administrators = User::where('type', Type::Admin->value)->get();

            $notificationData = [
                'type' => 'new_complaint',
                'message' => 'Получена новая жалоба от пользователя',
                'complaint_id' => $complaint->id,
                'complainant_name' => $complaint->complainant->name ?? 'Неизвестный',
                'reported_user_name' => $complaint->reportedUser->name ?? 'Неизвестный',
                'reason' => $complaint->reason,
                'created_at' => $complaint->created_at->format('Y-m-d H:i:s'),
            ];

            foreach ($administrators as $admin) {
                UserNotification::create([
                    'user_id' => $admin->id,
                    'data' => json_encode($notificationData),
                ]);
            }

            Log::info('Administrators notified about new complaint', [
                'complaint_id' => $complaint->id,
                'administrators_count' => $administrators->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to notify administrators about new complaint', [
                'complaint_id' => $complaint->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Обновить статус жалобы (только для администраторов)
     */
    public function updateComplaintStatus(Complaint $complaint, string $status, ?string $adminComment = null): Complaint
    {
        $complaint->update([
            'status' => $status,
            'admin_comment' => $adminComment,
            'reviewed_at' => now(),
        ]);

        // Уведомляем подавшего жалобу о изменении статуса
        $this->notifyComplainantAboutStatusChange($complaint);

        Log::info('Complaint status updated', [
            'complaint_id' => $complaint->id,
            'new_status' => $status,
            'admin_comment' => $adminComment,
        ]);

        return $complaint;
    }

    /**
     * Уведомить подавшего жалобу об изменении статуса
     */
    private function notifyComplainantAboutStatusChange(Complaint $complaint): void
    {
        try {
            $notificationData = [
                'type' => 'complaint_status_updated',
                'message' => 'Статус вашей жалобы был обновлен',
                'complaint_id' => $complaint->id,
                'new_status' => $complaint->status,
                'admin_comment' => $complaint->admin_comment,
                'updated_at' => $complaint->reviewed_at->format('Y-m-d H:i:s'),
            ];

            UserNotification::create([
                'user_id' => $complaint->complainant_id,
                'data' => json_encode($notificationData),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to notify complainant about status change', [
                'complaint_id' => $complaint->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Получить статистику жалоб для пользователя
     */
    public function getUserComplaintStats(int $userId): array
    {
        $user = User::findOrFail($userId);

        return [
            'sent_complaints_count' => $user->sentComplaints()->count(),
            'received_complaints_count' => $user->receivedComplaints()->count(),
            'recent_received_complaints' => $user->receivedComplaints()
                ->where('created_at', '>=', now()->subDays(30))
                ->count(),
        ];
    }

    /**
     * Получить статистику жалоб для администрации
     */
    public function getAdminComplaintStats(): array
    {
        return [
            'total_complaints' => Complaint::count(),
            'pending_complaints' => Complaint::where('status', 'pending')->count(),
            'reviewing_complaints' => Complaint::where('status', 'reviewing')->count(),
            'resolved_complaints' => Complaint::where('status', 'resolved')->count(),
            'rejected_complaints' => Complaint::where('status', 'rejected')->count(),
            'recent_complaints' => Complaint::where('created_at', '>=', now()->subDays(7))->count(),
        ];
    }
}
