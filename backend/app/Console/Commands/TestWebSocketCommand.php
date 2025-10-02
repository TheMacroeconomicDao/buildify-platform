<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Events\UserNotificationEvent;
use App\Events\AdminNotificationEvent;
use App\Enums\Users\Type;
use App\Enums\Users\VerificationStatus;
use App\Services\UserService;

class TestWebSocketCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'websocket:test {action} {--user-id=}';

    /**
     * The console command description.
     */
    protected $description = 'Test WebSocket notifications';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $action = $this->argument('action');
        
        switch ($action) {
            case 'user-notification':
                $this->testUserNotification();
                break;
                
            case 'admin-notification':
                $this->testAdminNotification();
                break;
                
            case 'verification-approved':
                $this->testVerificationApproved();
                break;
                
            case 'verification-rejected':
                $this->testVerificationRejected();
                break;
                
            case 'license-uploaded':
                $this->testLicenseUploaded();
                break;
                
            case 'simulate-license-upload':
                $this->simulateLicenseUpload();
                break;
                
            case 'test-work-settings':
                $this->testWorkSettings();
                break;
                
            default:
                $this->error('Unknown action. Available actions: user-notification, admin-notification, verification-approved, verification-rejected, license-uploaded, simulate-license-upload, test-work-settings');
        }
    }

    private function testUserNotification()
    {
        $userId = $this->option('user-id') ?: 1;
        
        $this->info("Sending test user notification to user ID: {$userId}");
        
        broadcast(new UserNotificationEvent(
            'test_notification',
            'Тестовое уведомление',
            'Это тестовое уведомление для проверки WebSocket соединения',
            [
                'test_data' => 'test_value',
                'timestamp' => now()->toISOString(),
            ],
            $userId
        ));
        
        $this->info('User notification sent!');
    }

    private function testAdminNotification()
    {
        $this->info("Sending test admin notification");
        
        broadcast(new AdminNotificationEvent(
            'test_admin_notification',
            'Тестовое административное уведомление',
            'Это тестовое уведомление для администраторов',
            [
                'test_data' => 'admin_test_value',
                'timestamp' => now()->toISOString(),
            ]
        ));
        
        $this->info('Admin notification sent!');
    }

    private function testVerificationApproved()
    {
        $userId = $this->option('user-id');
        if (!$userId) {
            $this->error('Please specify --user-id for verification test');
            return;
        }
        
        $user = User::find($userId);
        if (!$user) {
            $this->error("User with ID {$userId} not found");
            return;
        }
        
        $this->info("Sending verification approved notification to user: {$user->name}");
        
        broadcast(new UserNotificationEvent(
            'verification_status_changed',
            'Верификация одобрена!',
            'Поздравляем! Ваша верификация успешно пройдена. Теперь вы можете принимать заказы.',
            [
                'user_id' => $user->id,
                'old_status' => 0,
                'new_status' => 1,
                'old_status_label' => 'На рассмотрении',
                'new_status_label' => 'Одобрена',
                'verification_comment' => null,
                'verified_at' => now()->toISOString(),
            ],
            $user->id
        ));
        
        $this->info('Verification approved notification sent!');
    }

    private function testVerificationRejected()
    {
        $userId = $this->option('user-id');
        if (!$userId) {
            $this->error('Please specify --user-id for verification test');
            return;
        }
        
        $user = User::find($userId);
        if (!$user) {
            $this->error("User with ID {$userId} not found");
            return;
        }
        
        $this->info("Sending verification rejected notification to user: {$user->name}");
        
        broadcast(new UserNotificationEvent(
            'verification_status_changed',
            'Верификация отклонена',
            'К сожалению, ваша верификация была отклонена. Причина: Документ нечитаемый, загрузите более качественное фото',
            [
                'user_id' => $user->id,
                'old_status' => 0,
                'new_status' => 2,
                'old_status_label' => 'На рассмотрении',
                'new_status_label' => 'Отклонена',
                'verification_comment' => 'Документ нечитаемый, загрузите более качественное фото',
                'verified_at' => now()->toISOString(),
            ],
            $user->id
        ));
        
        $this->info('Verification rejected notification sent!');
    }

    private function testLicenseUploaded()
    {
        $userId = $this->option('user-id');
        if (!$userId) {
            $this->error('Please specify --user-id for license test');
            return;
        }
        
        $user = User::find($userId);
        if (!$user) {
            $this->error("User with ID {$userId} not found");
            return;
        }
        
        $this->info("Sending license uploaded notification to user: {$user->name}");
        
        broadcast(new UserNotificationEvent(
            'license_uploaded',
            'Лицензия загружена',
            'Ваша лицензия успешно загружена и отправлена на проверку. Ожидайте результат верификации.',
            [
                'user_id' => $user->id,
                'license_file_path' => '/storage/licenses/test_license.pdf',
                'verification_status' => 0,
                'uploaded_at' => now()->toISOString(),
            ],
            $user->id
        ));
        
        $this->info('License uploaded notification sent!');
    }

    private function simulateLicenseUpload()
    {
        $userId = $this->option('user-id');
        if (!$userId) {
            $this->error('Please specify --user-id for license upload simulation');
            return;
        }
        
        $user = User::find($userId);
        if (!$user) {
            $this->error("User with ID {$userId} not found");
            return;
        }
        
        $this->info("Simulating license upload for user: {$user->name}");
        $this->info("Current verification status: {$user->verification_status}");
        
        // Симулируем загрузку лицензии - обновляем license_file_path и сбрасываем статус
        $user->update([
            'license_file_path' => 'licenses/test_license_' . time() . '.pdf',
            'verification_status' => VerificationStatus::Pending->value,
            'verification_comment' => null,
            'verified_at' => null,
        ]);
        
        $this->info('License upload simulated! WebSocket notifications should be sent.');
        $this->info("New verification status: {$user->verification_status}");
    }

    private function testWorkSettings()
    {
        $userId = $this->option('user-id');
        if (!$userId) {
            $this->error('Please specify --user-id for work settings test');
            return;
        }
        
        $user = User::find($userId);
        if (!$user) {
            $this->error("User with ID {$userId} not found");
            return;
        }
        
        if ($user->type !== Type::Executor->value) {
            $this->error("User must be an executor (type 0)");
            return;
        }
        
        $this->info("Testing work settings change for user: {$user->name}");
        $this->info("Current verification status: {$user->verification_status}");
        
        // Получаем текущие work settings
        $currentWorks = $user->works()->get();
        $this->info("Current work settings count: " . $currentWorks->count());
        
        // Добавляем новый work type для тестирования
        $testWorkSettings = [
            [
                'direction' => 'repair_and_construction',
                'types' => ['plumbing_works', 'electrical_works']
            ],
            [
                'direction' => 'interior_design',
                'types' => ['interior_design']
            ]
        ];
        
        // Используем UserService для изменения настроек
        app(UserService::class)->setWorkSettings($user, $testWorkSettings);
        
        // Обновляем данные пользователя
        $user->refresh();
        
        $this->info('Work settings updated!');
        $this->info("New verification status: {$user->verification_status}");
        $this->info("New work settings count: " . $user->works()->count());
        
        // Показываем новые настройки
        $newWorks = $user->works()->get();
        foreach ($newWorks as $work) {
            $this->info("- {$work->direction}.{$work->type}");
        }
    }
}
