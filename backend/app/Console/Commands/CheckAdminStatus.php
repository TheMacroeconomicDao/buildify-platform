<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class CheckAdminStatus extends Command
{
    protected $signature = 'admin:status';
    protected $description = 'Проверить статус всех разделов админки';

    public function handle()
    {
        $this->info('🔍 ПРОВЕРКА СТАТУСА АДМИНКИ');
        $this->info('');

        $baseUrl = 'http://localhost:8000';
        
        // Получаем cookie авторизации
        $loginResponse = Http::get($baseUrl . '/admin-quick-login');
        $cookies = [];
        
        foreach ($loginResponse->cookies() as $cookie) {
            $cookies[$cookie->getName()] = $cookie->getValue();
        }

        $sections = [
            'Главная' => '/admin',
            'Исполнители' => '/admin/executors',
            'Заказчики' => '/admin/customers',
            'Посредники' => '/admin/mediators',
            'Заказы' => '/admin/orders',
            'Баннеры' => '/admin/banners',
            'Подписки' => '/admin/subscriptions',
            'Платежи' => '/admin/payments',
            'Жалобы' => '/admin/complaints',
            'Аналитика' => '/admin/analytics',
            'Уведомления' => '/admin/notifications',
            'Отчеты' => '/admin/reports',
            'Пользователи' => '/admin/users',
        ];

        foreach ($sections as $name => $path) {
            $response = Http::withCookies($cookies, 'localhost')->get($baseUrl . $path);
            $status = $response->status();
            
            if ($status === 200) {
                $this->info("✅ {$name}: OK ({$status})");
            } elseif ($status === 302) {
                $this->warn("🔄 {$name}: Redirect ({$status})");
            } else {
                $this->error("❌ {$name}: Error ({$status})");
            }
        }

        $this->info('');
        $this->info('🌐 Для входа в админку:');
        $this->info('• Форма входа: http://localhost:8000/admin/login');
        $this->info('• Быстрый вход: http://localhost:8000/admin-quick-login');
        $this->info('• Email: admin@test.com');
        $this->info('• Password: Admin123!');
    }
}
