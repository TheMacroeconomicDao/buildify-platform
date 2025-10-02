<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Models\User;
use Illuminate\Console\Command;

class ShowTestAccounts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'show:test-accounts';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Показать все тестовые аккаунты и данные';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🧪 ТЕСТОВЫЕ АККАУНТЫ BUILDLIFY');
        $this->info('=' . str_repeat('=', 50));
        $this->info('');

        // Админ
        $admin = User::where('email', 'admin@test.com')->first();
        if ($admin) {
            $this->info('👨‍💼 АДМИНИСТРАТОР:');
            $this->info('📧 Email: admin@test.com');
            $this->info('🔑 Password: Admin123!');
            $this->info('🔗 Админка: /admin');
            $this->info('');
        }

        // Заказчик
        $customer = User::where('email', 'customer@test.com')->first();
        if ($customer) {
            $this->info('📧 ЗАКАЗЧИК:');
            $this->info('📧 Email: customer@test.com');
            $this->info('🔑 Password: Test123!');
            $this->info('👤 Имя: ' . $customer->name);
            $this->info('📱 Телефон: ' . $customer->phone);
            $this->info('');
        }

        // Исполнитель
        $executor = User::where('email', 'executor@test.com')->first();
        if ($executor) {
            $this->info('🔨 ИСПОЛНИТЕЛЬ:');
            $this->info('📧 Email: executor@test.com');
            $this->info('🔑 Password: Test123!');
            $this->info('👤 Имя: ' . $executor->name);
            $this->info('📱 Телефон: ' . $executor->phone);
            $this->info('✅ Статус: Верифицирован');
            $this->info('⭐ Рейтинг: ' . $executor->average_rating . ' (' . $executor->reviews_count . ' отзывов)');
            $this->info('🛠️ Опыт: ' . $executor->work_experience . ' лет');
            $this->info('');
        }

        // Заказы
        $orders = Order::with('author')->get();
        if ($orders->count() > 0) {
            $this->info('🏠 ТЕСТОВЫЕ ЗАКАЗЫ:');
            foreach ($orders as $order) {
                $this->info('ID: ' . $order->id . ' | ' . $order->title);
                $this->info('💰 Стоимость: ~$' . number_format($order->max_amount, 0, '.', ' '));
                $this->info('📍 Адрес: ' . $order->address);
                $this->info('👤 Автор: ' . $order->author->name);
                $this->info('📊 Статус: ' . $this->getStatusName($order->status));
                $this->info('');
            }
        }

        $this->info('📱 ИНСТРУКЦИЯ ПО ТЕСТИРОВАНИЮ:');
        $this->info('1. Запустите мобильное приложение');
        $this->info('2. Войдите как исполнитель (executor@test.com)');
        $this->info('3. Найдите заказ в разделе "Поиск заказов"');
        $this->info('4. Откликнитесь на заказ');
        $this->info('5. Войдите как заказчик (customer@test.com)');
        $this->info('6. Посмотрите отклики и выберите исполнителя');
        $this->info('7. Протестируйте весь флоу до завершения заказа');
        $this->info('');
        $this->info('🔗 Админка: http://your-domain/admin (admin@test.com / Admin123!)');
    }

    private function getStatusName($status)
    {
        return match($status) {
            0 => 'Поиск исполнителя',
            1 => 'Выбор исполнителя',
            2 => 'Исполнитель выбран',
            3 => 'В работе',
            4 => 'Ожидает подтверждения',
            5 => 'Завершен',
            6 => 'Отменен',
            7 => 'Отклонен',
            default => 'Неизвестный статус'
        };
    }
}
