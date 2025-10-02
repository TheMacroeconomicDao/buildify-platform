<?php

namespace App\Console\Commands;

use App\Jobs\SendScheduledNotificationJob;
use App\Models\ScheduledNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ProcessScheduledNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notifications:process-scheduled';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process scheduled push notifications';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Processing scheduled notifications...');

        // Получаем готовые к отправке уведомления
        $notifications = ScheduledNotification::readyToSend()->get();

        if ($notifications->isEmpty()) {
            $this->info('No notifications ready to send.');
            return 0;
        }

        $this->info("Found {$notifications->count()} notifications to process.");

        foreach ($notifications as $notification) {
            try {
                // Отправляем задачу в очередь
                SendScheduledNotificationJob::dispatch($notification);
                
                $this->line("✓ Queued notification: {$notification->title}");
                
                Log::info('Scheduled notification queued', [
                    'notification_id' => $notification->id,
                    'title' => $notification->title
                ]);
                
            } catch (\Exception $e) {
                $this->error("✗ Failed to queue notification {$notification->id}: {$e->getMessage()}");
                
                Log::error('Failed to queue scheduled notification', [
                    'notification_id' => $notification->id,
                    'error' => $e->getMessage()
                ]);
            }
        }

        $this->info('Scheduled notifications processing completed.');
        return 0;
    }
}
