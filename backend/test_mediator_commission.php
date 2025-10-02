<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Найдем или создадим тестового посредника
$mediator = App\Models\User::where('type', 2)->first(); // Type::Mediator = 2
if (!$mediator) {
    echo 'Creating test mediator...' . PHP_EOL;
    $mediator = App\Models\User::create([
        'name' => 'Test Mediator',
        'email' => 'testmediator@example.com',
        'password' => bcrypt('password'),
        'type' => 2,
        'mediator_margin_percentage' => 10.0, // 10% комиссия
    ]);
}

echo 'Mediator ID: ' . $mediator->id . PHP_EOL;
echo 'Mediator margin percentage: ' . $mediator->mediator_margin_percentage . PHP_EOL;
echo 'Mediator fixed fee: ' . $mediator->mediator_fixed_fee . PHP_EOL;

// Проверим заказ 24
$order = App\Models\Order::find(24);
echo 'Order 24 max_amount: ' . $order->max_amount . PHP_EOL;

// Рассчитаем комиссию
$mediatorService = new App\Services\MediatorService();
$commission = $mediatorService->calculateCommission($order, $mediator);
echo 'Calculated commission: ' . $commission . PHP_EOL;

// Симулируем API запрос
auth()->login($mediator);
$controller = new App\Http\Controllers\OrderController();
$response = $controller->show(24);
$responseData = json_decode($response->getContent(), true);

echo 'API response keys: ' . implode(', ', array_keys($responseData['result'])) . PHP_EOL;

if (isset($responseData['result']['potential_commission'])) {
    echo 'API potential_commission: ' . $responseData['result']['potential_commission'] . PHP_EOL;
} else {
    echo 'potential_commission not found in API response' . PHP_EOL;
    echo 'User type in test: ' . auth()->user()->type . PHP_EOL;
}
