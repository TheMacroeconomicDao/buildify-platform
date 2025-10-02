<?php

namespace App\Observers;

use App\Enums\Users\Type;
use App\Enums\Users\VerificationStatus;
use App\Models\User;
use App\Models\AdminNotification;
use App\Models\Tariff;
use App\Services\UserRegistrationService;
use App\Events\UserNotificationEvent;
use App\Events\AdminNotificationEvent;
use Throwable;

class UserObserver
{
    /**
     * Handle the User "created" event.
     */
    public function created(User $user): void
    {
        // Назначаем бесплатный тариф новому пользователю, если у него нет тарифа
        if (!$user->current_tariff_id) {
            $freeTariff = Tariff::where('name', 'Free')->first();
            if ($freeTariff) {
                $user->update(['current_tariff_id' => $freeTariff->id]);
            }
        }
    }

    /**
     * Handle the User "updated" event.
     * @throws Throwable
     */
    public function updated(User $user): void
    {
        // Отправка кода верификации при изменении email
        if ($user->wasChanged('email') && $user->type === Type::Executor->value) {
            $user->update(['email_verified_at' => null]);
            app(UserRegistrationService::class)->sendNewVerificationCode($user->email);
        }

        // Уведомление о новой лицензии на верификацию
        if ($user->wasChanged('license_file_path') && 
            $user->type === Type::Executor->value && 
            $user->license_file_path !== null) {
            
            $this->createLicenseNotification($user);
            $this->sendLicenseUploadWebSocketNotification($user);
        }

        // Уведомления при изменении статуса верификации
        if ($user->wasChanged('verification_status') && 
            $user->type === Type::Executor->value) {
            
            \Log::info('UserObserver: Verification status changed', [
                'user_id' => $user->id,
                'old_status' => $user->getOriginal('verification_status'),
                'new_status' => $user->verification_status,
            ]);
            
            $this->handleVerificationStatusChange($user);
        }
    }

    /**
     * Обработать изменение статуса верификации
     */
    private function handleVerificationStatusChange(User $executor): void
    {
        $oldStatus = $executor->getOriginal('verification_status');
        $newStatus = $executor->verification_status;

        // Уведомления администраторам о результате верификации
        if ($newStatus === VerificationStatus::Approved->value) {
            $this->createVerificationResultNotification($executor, 'approved');
        } elseif ($newStatus === VerificationStatus::Rejected->value) {
            $this->createVerificationResultNotification($executor, 'rejected');
        }

        // Отправляем WebSocket уведомление исполнителю
        $this->sendVerificationStatusWebSocketNotification($executor, $oldStatus, $newStatus);
    }

    /**
     * Отправить WebSocket уведомление об изменении статуса верификации
     */
    private function sendVerificationStatusWebSocketNotification(User $executor, int $oldStatus, int $newStatus): void
    {
        \Log::info('UserObserver: Sending WebSocket notification', [
            'user_id' => $executor->id,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
        ]);

        $statusLabels = [
            VerificationStatus::Pending->value => 'Under Review',
            VerificationStatus::Approved->value => 'Approved',
            VerificationStatus::Rejected->value => 'Rejected',
            VerificationStatus::NotRequired->value => 'Not Required',
        ];

        $oldStatusLabel = $statusLabels[$oldStatus] ?? 'Unknown';
        $newStatusLabel = $statusLabels[$newStatus] ?? 'Unknown';

        // Определяем заголовок и сообщение в зависимости от нового статуса
        [$title, $message] = match($newStatus) {
            VerificationStatus::Approved->value => [
                'Verification Approved!',
                'Congratulations! Your verification has been successfully completed. You can now accept orders.'
            ],
            VerificationStatus::Rejected->value => [
                'Verification Rejected',
                'Unfortunately, your verification was rejected. ' . 
                ($executor->verification_comment ? 'Reason: ' . $executor->verification_comment : 'Please contact support for details.')
            ],
            VerificationStatus::Pending->value => [
                'Verification Under Review',
                'Your documents have been submitted for review. Please wait for the result.'
            ],
            default => [
                'Verification Status Changed',
                "Your verification status has been changed from \"{$oldStatusLabel}\" to \"{$newStatusLabel}\""
            ]
        };

        // Отправляем уведомление исполнителю
        broadcast(new UserNotificationEvent(
            'verification_status_changed',
            $title,
            $message,
            [
                'user_id' => $executor->id,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'old_status_label' => $oldStatusLabel,
                'new_status_label' => $newStatusLabel,
                'verification_comment' => $executor->verification_comment,
                'verified_at' => $executor->verified_at?->toISOString(),
            ],
            $executor->id
        ));

        // Также отправляем административное уведомление
        if ($newStatus === VerificationStatus::Approved->value || $newStatus === VerificationStatus::Rejected->value) {
            $adminMessage = $newStatus === VerificationStatus::Approved->value
                ? "Executor {$executor->name} successfully verified"
                : "Verification of executor {$executor->name} rejected";

            broadcast(new AdminNotificationEvent(
                'verification_completed',
                'Verification Completed',
                $adminMessage,
                [
                    'executor_id' => $executor->id,
                    'executor_name' => $executor->name,
                    'executor_email' => $executor->email,
                    'new_status' => $newStatus,
                    'new_status_label' => $newStatusLabel,
                    'verification_comment' => $executor->verification_comment,
                ]
            ));
        }
    }

    /**
     * Создать уведомление о новой лицензии для администраторов
     */
    private function createLicenseNotification(User $executor): void
    {
        // Получаем всех администраторов
        $admins = User::where('type', Type::Admin->value)->get();

        foreach ($admins as $admin) {
            AdminNotification::create([
                'admin_id' => $admin->id,
                'title' => 'New License for Verification',
                'message' => "Executor {$executor->name} uploaded a license for verification",
                'type' => 'license_verification',
                'data' => json_encode([
                    'executor_id' => $executor->id,
                    'executor_name' => $executor->name,
                    'executor_email' => $executor->email,
                ]),
                'created_at' => now(),
            ]);
        }
    }

    /**
     * Отправить WebSocket уведомление о загрузке лицензии
     */
    private function sendLicenseUploadWebSocketNotification(User $executor): void
    {
        $oldStatus = $executor->getOriginal('verification_status');
        $newStatus = $executor->verification_status;
        
        // Уведомляем исполнителя о том, что лицензия загружена и отправлена на проверку
        broadcast(new UserNotificationEvent(
            'license_uploaded',
            'License Uploaded',
            'Your license has been successfully uploaded and sent for review. Please wait for the verification result.',
            [
                'user_id' => $executor->id,
                'license_file_path' => $executor->license_file_path,
                'verification_status' => $newStatus,
                'old_status' => $oldStatus,
                'uploaded_at' => now()->toISOString(),
            ],
            $executor->id
        ));

        // Уведомляем администраторов о новой лицензии для проверки
        broadcast(new AdminNotificationEvent(
            'new_license_verification',
            'New License for Verification',
            "Executor {$executor->name} uploaded a license for verification",
            [
                'executor_id' => $executor->id,
                'executor_name' => $executor->name,
                'executor_email' => $executor->email,
                'license_file_path' => $executor->license_file_path,
                'uploaded_at' => now()->toISOString(),
            ]
        ));
    }

    /**
     * Создать уведомление о результате верификации
     */
    private function createVerificationResultNotification(User $executor, string $result): void
    {
        $admins = User::where('type', Type::Admin->value)->get();

                $title = $result === 'approved' ? 'License Approved' : 'License Rejected';
        $message = $result === 'approved'
            ? "License of executor {$executor->name} was approved"
            : "License of executor {$executor->name} was rejected";

        foreach ($admins as $admin) {
            AdminNotification::create([
                'admin_id' => $admin->id,
                'title' => $title,
                'message' => $message,
                'type' => 'license_' . $result,
                'data' => json_encode([
                    'executor_id' => $executor->id,
                    'executor_name' => $executor->name,
                    'executor_email' => $executor->email,
                    'verification_comment' => $executor->verification_comment,
                    'verified_at' => $executor->verified_at?->toISOString(),
                ]),
                'created_at' => now(),
            ]);
        }
    }
}
