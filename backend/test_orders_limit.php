<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Найдем тестового пользователя-исполнителя
$executor = App\Models\User::where('type', 2)->first(); // Type::Executor = 2
if (!$executor) {
    echo 'No executor found for testing' . PHP_EOL;
    exit(1);
}

echo 'Testing with executor: ' . $executor->email . ' (ID: ' . $executor->id . ')' . PHP_EOL;

// Найдем тариф с max_orders = 1 (Free)
$freeTariff = App\Models\Tariff::where('name', 'Free')->first();
if (!$freeTariff) {
    echo 'Free tariff not found' . PHP_EOL;
    exit(1);
}

echo 'Using tariff: ' . $freeTariff->name . ' (max_orders: ' . $freeTariff->max_orders . ')' . PHP_EOL;

// Создадим тариф с max_orders = 0 для тестирования
$zeroOrdersTariff = App\Models\Tariff::updateOrCreate(
    ['name' => 'Test Zero Orders'],
    [
        'name' => 'Test Zero Orders',
        'stripe_product_id' => null,
        'stripe_price_id' => null,
        'duration_days' => 30,
        'max_orders' => 0,
        'max_contacts' => 0,
        'price' => 1.00,
        'is_active' => true,
        'is_test' => true
    ]
);

echo 'Created test tariff: ' . $zeroOrdersTariff->name . ' (max_orders: ' . $zeroOrdersTariff->max_orders . ')' . PHP_EOL;

// Назначим этот тариф пользователю
$executor->update([
    'current_tariff_id' => $zeroOrdersTariff->id,
    'subscription_started_at' => now(),
    'subscription_ends_at' => now()->addDays(30),
]);

echo 'Assigned zero orders tariff to executor' . PHP_EOL;

// Теперь протестируем canUserRespondToOrder
$subscriptionService = new App\Services\SubscriptionService();
$result = $subscriptionService->canUserRespondToOrder($executor);

echo 'canUserRespondToOrder result:' . PHP_EOL;
echo 'can_respond: ' . ($result['can_respond'] ? 'true' : 'false') . PHP_EOL;
echo 'message: ' . $result['message'] . PHP_EOL;

// Проверим количество откликов
$currentResponses = App\Models\OrderResponse::where('executor_id', $executor->id)
    ->when($executor->subscription_started_at, function ($query) use ($executor) {
        $query->where('created_at', '>=', $executor->subscription_started_at);
    })
    ->count();

echo 'Current responses count: ' . $currentResponses . PHP_EOL;
echo 'Max orders allowed: ' . $zeroOrdersTariff->max_orders . PHP_EOL;
