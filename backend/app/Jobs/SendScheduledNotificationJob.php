<?php

namespace App\Jobs;

use App\Models\ScheduledNotification;
use App\Models\User;
use App\Services\PushNotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Exception;

class SendScheduledNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 300; // 5 минут
    public $tries = 2;

    protected ScheduledNotification $notification;

    /**
     * Create a new job instance.
     */
    public function __construct(ScheduledNotification $notification)
    {
        $this->notification = $notification;
    }

    /**
     * Execute the job.
     */
    public function handle(PushNotificationService $pushService): void
    {
        try {
            Log::info('Starting scheduled notification job', [
                'notification_id' => $this->notification->id,
                'title' => $this->notification->title,
                'target_type' => $this->notification->target_type
            ]);

            // Получаем целевых пользователей
            $users = $this->getTargetUsers();

            if (empty($users)) {
                $this->notification->markAsFailed('No target users found');
                return;
            }

            // Отправляем push-уведомления
            $results = $pushService->sendToUsers(
                $users,
                $this->notification->title,
                $this->notification->message,
                $this->notification->data ?? []
            );

            // Подсчитываем результаты
            $sentCount = 0;
            $failedCount = 0;

            foreach ($results as $result) {
                $sentCount += $result['success'] ?? 0;
                $failedCount += $result['failure'] ?? 0;
            }

            // Отмечаем как отправленное
            $this->notification->markAsSent($sentCount, $failedCount);

            // Если это повторяющееся уведомление, создаем следующее
            if ($this->notification->schedule_type !== ScheduledNotification::SCHEDULE_ONCE) {
                $this->scheduleNext();
            }

            Log::info('Scheduled notification sent successfully', [
                'notification_id' => $this->notification->id,
                'sent_count' => $sentCount,
                'failed_count' => $failedCount
            ]);

        } catch (Exception $e) {
            Log::error('Scheduled notification job failed', [
                'notification_id' => $this->notification->id,
                'error' => $e->getMessage()
            ]);

            $this->notification->markAsFailed($e->getMessage());
            throw $e;
        }
    }

    /**
     * Получить целевых пользователей для уведомления
     */
    private function getTargetUsers(): array
    {
        switch ($this->notification->target_type) {
            case ScheduledNotification::TARGET_ALL:
                return User::whereNotNull('push_token')->get()->toArray();

            case ScheduledNotification::TARGET_CUSTOMERS:
                return User::where('type', \App\Enums\Users\Type::Customer->value)
                    ->whereNotNull('push_token')
                    ->get()->toArray();

            case ScheduledNotification::TARGET_EXECUTORS:
                return User::where('type', \App\Enums\Users\Type::Executor->value)
                    ->whereNotNull('push_token')
                    ->get()->toArray();

            case ScheduledNotification::TARGET_SPECIFIC:
                if (!empty($this->notification->target_user_ids)) {
                    return User::whereIn('id', $this->notification->target_user_ids)
                        ->whereNotNull('push_token')
                        ->get()->toArray();
                }
                return [];

            default:
                return [];
        }
    }

    /**
     * Запланировать следующее уведомление для повторяющихся
     */
    private function scheduleNext(): void
    {
        $nextDate = $this->calculateNextDate();

        if ($nextDate) {
            ScheduledNotification::create([
                'title' => $this->notification->title,
                'message' => $this->notification->message,
                'data' => $this->notification->data,
                'target_type' => $this->notification->target_type,
                'target_user_ids' => $this->notification->target_user_ids,
                'schedule_type' => $this->notification->schedule_type,
                'scheduled_at' => $nextDate,
                'schedule_config' => $this->notification->schedule_config,
                'status' => ScheduledNotification::STATUS_PENDING,
                'created_by' => $this->notification->created_by,
            ]);

            Log::info('Next scheduled notification created', [
                'original_id' => $this->notification->id,
                'next_scheduled_at' => $nextDate->toISOString()
            ]);
        }
    }

    /**
     * Вычислить дату следующего уведомления
     */
    private function calculateNextDate(): ?\Carbon\Carbon
    {
        $config = $this->notification->schedule_config ?? [];

        switch ($this->notification->schedule_type) {
            case ScheduledNotification::SCHEDULE_DAILY:
                return $this->notification->scheduled_at->addDay();

            case ScheduledNotification::SCHEDULE_WEEKLY:
                return $this->notification->scheduled_at->addWeek();

            case ScheduledNotification::SCHEDULE_MONTHLY:
                return $this->notification->scheduled_at->addMonth();

            default:
                return null;
        }
    }
}