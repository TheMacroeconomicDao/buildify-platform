<?php

namespace App\Console\Commands;

use App\Models\Tariff;
use Illuminate\Console\Command;

class CreateTestSubscription extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'subscription:create-test {--name=Test} {--price=0} {--days=30} {--orders=10} {--contacts=20}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a test subscription for $0 to test subscription functionality';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $name = $this->option('name');
        $price = (float) $this->option('price');
        $days = (int) $this->option('days');
        $orders = (int) $this->option('orders');
        $contacts = (int) $this->option('contacts');

        // Проверяем, существует ли уже тестовая подписка с таким именем
        $existingTariff = Tariff::where('name', $name)->first();
        
        if ($existingTariff) {
            $this->error("Тариф с именем '{$name}' уже существует!");
            return 1;
        }

        // Создаем тестовую подписку
        $tariff = Tariff::create([
            'name' => $name,
            'stripe_product_id' => null, // Для тестовой подписки не нужен Stripe
            'stripe_price_id' => null,   // Для тестовой подписки не нужен Stripe
            'duration_days' => $days,
            'max_orders' => $orders,
            'max_contacts' => $contacts,
            'price' => $price,
            'is_active' => true,
            'is_test' => true,
        ]);

        $this->info("✅ Тестовая подписка успешно создана:");
        $this->table(
            ['Поле', 'Значение'],
            [
                ['ID', $tariff->id],
                ['Название', $tariff->name],
                ['Цена', '$' . number_format($tariff->price, 2)],
                ['Длительность', $tariff->duration_days . ' дней'],
                ['Макс. заказов', $tariff->max_orders],
                ['Макс. контактов', $tariff->max_contacts],
                ['Тестовая', $tariff->is_test ? 'Да' : 'Нет'],
                ['Активна', $tariff->is_active ? 'Да' : 'Нет'],
            ]
        );

        $this->info("🎯 Теперь пользователи могут 'купить' эту подписку за \$0 для тестирования функционала!");
        
        return 0;
    }
}
