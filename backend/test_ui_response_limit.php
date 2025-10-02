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

// Создадим тариф с max_orders = 0 для тестирования
$zeroOrdersTariff = App\Models\Tariff::updateOrCreate(
    ['name' => 'Test Zero Orders UI'],
    [
        'name' => 'Test Zero Orders UI',
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

// Симулируем HTTP ответ, который получит мобильное приложение
echo PHP_EOL . 'Simulated HTTP response for mobile app:' . PHP_EOL;
echo 'Status: 403' . PHP_EOL;
echo 'Body: ' . json_encode([
    'success' => false,
    'message' => $result['message']
], JSON_PRETTY_PRINT) . PHP_EOL;

echo PHP_EOL . 'Expected mobile app behavior:' . PHP_EOL;
echo '1. Show dialog with title: "Response Limit Reached"' . PHP_EOL;
echo '2. Show message: "You have reached your response limit for the current subscription period. Upgrade your plan to respond to more orders."' . PHP_EOL;
echo '3. Show "Upgrade Plan" button that navigates to Subscription screen' . PHP_EOL;
