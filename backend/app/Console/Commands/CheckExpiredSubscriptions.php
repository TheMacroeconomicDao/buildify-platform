<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Tariff;
use App\Models\AdminNotification;
use App\Enums\Users\Type;
use Illuminate\Console\Command;

class CheckExpiredSubscriptions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'subscriptions:check-expired';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Проверить истекшие подписки и отправить уведомления';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Проверка истекших подписок...');

        // Найти пользователей с истекшими подписками
        $expiredUsers = User::whereNotNull('subscription_ends_at')
            ->where('subscription_ends_at', '<=', now())
            ->whereNotNull('current_tariff_id')
            ->get();

        $this->info("Найдено пользователей с истекшими подписками: {$expiredUsers->count()}");

        $freeTariff = Tariff::where('name', 'Free')->first();
        if (!$freeTariff) {
            $this->error('Бесплатный тариф не найден!');
            return 1;
        }

        $processedCount = 0;

        foreach ($expiredUsers as $user) {
            $currentTariff = $user->currentTariff();
            
            // Сначала проверяем, есть ли следующая подписка для активации
            if ($user->checkAndActivateNextSubscription()) {
                $this->line("Пользователь {$user->email} переведен на следующую подписку");
                $processedCount++;
                continue;
            }
            
            // Если нет следующей подписки и текущая не бесплатная - переводим на Free
            if ($currentTariff && $currentTariff->name !== 'Free') {
                // Переводим пользователя на бесплатный тариф
                $user->activateSubscription($freeTariff);
                
                // Создаем уведомление для пользователя
                $this->createUserNotification($user, $currentTariff);
                
                // Создаем уведомление для администраторов
                $this->createAdminNotification($user, $currentTariff);
                
                $processedCount++;
                
                $this->line("Пользователь {$user->email} переведен на бесплатный тариф");
            }
        }

        // Проверить пользователей, у которых подписка истекает в ближайшие дни
        $this->checkUpcomingExpirations();

        $this->info("Обработано пользователей: {$processedCount}");
        return 0;
    }

    /**
     * Проверить подписки, которые истекают в ближайшие дни
     */
    private function checkUpcomingExpirations(): void
    {
        // Уведомления за 3 дня до истечения
        $upcomingUsers = User::whereNotNull('subscription_ends_at')
            ->whereBetween('subscription_ends_at', [
                now()->addDays(2)->startOfDay(),
                now()->addDays(3)->endOfDay()
            ])
            ->whereNotNull('current_tariff_id')
            ->get();

        foreach ($upcomingUsers as $user) {
            $currentTariff = $user->currentTariff();
            if ($currentTariff && $currentTariff->name !== 'Free') {
                $daysLeft = $user->getDaysUntilSubscriptionExpires();
                $this->createExpirationWarningNotification($user, $currentTariff, $daysLeft);
                $this->line("Отправлено предупреждение пользователю {$user->email} (осталось {$daysLeft} дней)");
            }
        }
    }

    /**
     * Создать уведомление для пользователя об истечении подписки
     */
    private function createUserNotification(User $user, Tariff $expiredTariff): void
    {
        // Здесь можно добавить логику отправки уведомлений пользователю
        // Например, через email, push-уведомления и т.д.
        
        $this->line("Уведомление отправлено пользователю {$user->email}");
    }

    /**
     * Создать уведомление для администраторов
     */
    private function createAdminNotification(User $user, Tariff $expiredTariff): void
    {
        $admins = User::where('type', Type::Admin->value)->get();

        foreach ($admins as $admin) {
            AdminNotification::create([
                'admin_id' => $admin->id,
                'title' => 'Истекла подписка пользователя',
                'message' => "У пользователя {$user->name} ({$user->email}) истекла подписка \"{$expiredTariff->name}\". Пользователь переведен на бесплатный тариф.",
                'type' => 'subscription_expired',
                'data' => json_encode([
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                    'user_email' => $user->email,
                    'expired_tariff' => $expiredTariff->name,
                    'expired_at' => $user->subscription_ends_at,
                ]),
                'created_at' => now(),
            ]);
        }
    }

    /**
     * Создать предупреждение об истечении подписки
     */
    private function createExpirationWarningNotification(User $user, Tariff $tariff, int $daysLeft): void
    {
        // Здесь можно добавить логику отправки предупреждений пользователю
        // Например, через email, push-уведомления и т.д.
        
        $admins = User::where('type', Type::Admin->value)->get();

        foreach ($admins as $admin) {
            AdminNotification::create([
                'admin_id' => $admin->id,
                'title' => 'Подписка скоро истечет',
                'message' => "У пользователя {$user->name} ({$user->email}) через {$daysLeft} дн. истечет подписка \"{$tariff->name}\".",
                'type' => 'subscription_expiring',
                'data' => json_encode([
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                    'user_email' => $user->email,
                    'tariff_name' => $tariff->name,
                    'days_left' => $daysLeft,
                    'expires_at' => $user->subscription_ends_at,
                ]),
                'created_at' => now(),
            ]);
        }
    }
}
