<?php

namespace App\Console\Commands;

use App\Events\UserNotificationEvent;
use App\Events\AdminNotificationEvent;
use App\Events\DesignImagesGeneratedEvent;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class TestWebSocketConnection extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'websocket:test {--user-id=1} {--type=user}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test WebSocket connection by sending test events';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $userId = $this->option('user-id');
        $type = $this->option('type');

        $this->info('🧪 Testing WebSocket connection...');
        $this->info("User ID: {$userId}");
        $this->info("Test Type: {$type}");

        // Проверяем конфигурацию
        $broadcastDriver = config('broadcasting.default');
        $pusherKey = config('broadcasting.connections.pusher.key');
        
        $this->line("📡 Broadcast Driver: {$broadcastDriver}");
        $this->line("🔑 Pusher Key: " . ($pusherKey ? substr($pusherKey, 0, 10) . '...' : 'NOT SET'));

        if ($broadcastDriver === 'null') {
            $this->error('❌ Broadcasting driver is set to "null". Set BROADCAST_DRIVER=pusher in .env');
            return 1;
        }

        if (!$pusherKey) {
            $this->error('❌ Pusher key not configured. Set PUSHER_APP_KEY in .env');
            return 1;
        }

        // Найти пользователя
        $user = User::find($userId);
        if (!$user) {
            $this->error("❌ User with ID {$userId} not found");
            return 1;
        }

        $this->info("👤 Testing for user: {$user->name} ({$user->email})");

        try {
            switch ($type) {
                case 'user':
                    $this->testUserNotification($user);
                    break;
                    
                case 'admin':
                    $this->testAdminNotification($user);
                    break;
                    
                case 'design':
                    $this->testDesignNotification($user);
                    break;
                    
                case 'all':
                    $this->testUserNotification($user);
                    $this->testDesignNotification($user);
                    if ($user->type === \App\Enums\Users\Type::Admin->value) {
                        $this->testAdminNotification($user);
                    }
                    break;
                    
                default:
                    $this->error("❌ Unknown test type: {$type}");
                    return 1;
            }

            $this->info('✅ WebSocket test events sent successfully!');
            $this->line('');
            $this->line('📱 Check your mobile app for notifications');
            $this->line('🔍 Monitor logs: tail -f storage/logs/laravel.log | grep WebSocket');
            
            return 0;

        } catch (\Exception $e) {
            $this->error("❌ WebSocket test failed: {$e->getMessage()}");
            Log::error('WebSocket test failed', [
                'user_id' => $userId,
                'type' => $type,
                'error' => $e->getMessage()
            ]);
            return 1;
        }
    }

    /**
     * Тестирование пользовательского уведомления
     */
    private function testUserNotification(User $user)
    {
        $this->line('📤 Sending user notification...');
        
        event(new UserNotificationEvent(
            'test_notification',
            'Тестовое уведомление',
            'Это тестовое WebSocket уведомление для проверки соединения',
            [
                'test' => true,
                'timestamp' => now()->toISOString(),
                'user_id' => $user->id,
            ],
            $user->id
        ));

        $this->line("✅ User notification sent to channel: private-user.{$user->id}");
    }

    /**
     * Тестирование административного уведомления
     */
    private function testAdminNotification(User $user)
    {
        $this->line('📤 Sending admin notification...');
        
        event(new AdminNotificationEvent(
            'test_admin_notification',
            'Тестовое админ-уведомление',
            'Это тестовое WebSocket уведомление для администраторов',
            [
                'test' => true,
                'timestamp' => now()->toISOString(),
                'admin_id' => $user->id,
            ]
        ));

        $this->line("✅ Admin notification sent to channel: private-admin");
    }

    /**
     * Тестирование уведомления о дизайне
     */
    private function testDesignNotification(User $user)
    {
        $this->line('📤 Sending design notification...');
        
        event(new DesignImagesGeneratedEvent(
            $user->id,
            'test-generation-id-' . time(),
            [
                [
                    'url' => 'https://example.com/test-image-1.jpg',
                    'prompt' => 'Test design prompt 1',
                    'index' => 1
                ],
                [
                    'url' => 'https://example.com/test-image-2.jpg',
                    'prompt' => 'Test design prompt 2',
                    'index' => 2
                ]
            ]
        ));

        $this->line("✅ Design notification sent to channel: private-user.{$user->id}");
    }
}
