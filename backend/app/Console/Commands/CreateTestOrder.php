<?php

namespace App\Console\Commands;

use App\Enums\Order\Status;
use App\Enums\Users\Type;
use App\Models\Order;
use App\Models\User;
use Illuminate\Console\Command;

class CreateTestOrder extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'create:test-order';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Создать тестовый заказ от заказчика';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Находим тестового заказчика
        $customer = User::where('email', 'customer@test.com')
            ->where('type', Type::Customer->value)
            ->first();

        if (!$customer) {
            $this->error('❌ Тестовый заказчик не найден. Сначала выполните: php artisan create:test-users');
            return;
        }

        // Создаем тестовый заказ
        $order = Order::create([
            'title' => 'Ремонт под ключ',
            'work_direction' => 'repair',
            'work_type' => 'full_repair',
            'description' => 'Необходим полный ремонт квартиры под ключ. Включает демонтаж старых покрытий, выравнивание стен, укладку плитки, покраску, установку сантехники и электрики.',
            'city' => 'Дубай',
            'address' => 'Шариколподшипниковская улица, 17',
            'full_address' => 'Шариколподшипниковская улица, 17, Дубай, ОАЭ',
            'latitude' => 25.2048,
            'longitude' => 55.2708,
            'housing_type' => 'apartment',
            'housing_condition' => 'new',
            'housing_preparation_level' => 'without_walls',
            'bathroom_type' => 'separate',
            'ceiling_height' => 2.5,
            'total_area' => 450.5,
            'date_type' => 'period',
            'start_date' => '2024-08-18',
            'start_time' => '15:00',
            'end_date' => '2024-08-28',
            'end_time' => '12:00',
            'work_date' => '2024-08-18',
            'max_amount' => 1220000,
            'author_id' => $customer->id,
            'status' => Status::SearchExecutor->value,
        ]);

        $this->info('✅ Тестовый заказ создан:');
        $this->info('');
        $this->info('🏠 ЗАКАЗ #' . $order->id);
        $this->info('Название: ' . $order->title);
        $this->info('Стоимость: ~$' . number_format($order->max_amount, 0, '.', ' '));
        $this->info('Адрес: ' . $order->address);
        $this->info('Площадь: ' . $order->total_area . ' кв.м.');
        $this->info('Статус: Поиск исполнителя');
        $this->info('Автор: ' . $customer->name . ' (' . $customer->email . ')');
        $this->info('');
        $this->info('📱 Теперь можно:');
        $this->info('1. Войти в мобильное приложение как исполнитель (executor@test.com)');
        $this->info('2. Посмотреть заказ в разделе "Поиск заказов"');
        $this->info('3. Откликнуться на заказ');
        $this->info('4. Войти как заказчик (customer@test.com) и посмотреть отклики');
    }
}
