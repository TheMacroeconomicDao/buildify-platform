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

// Найдем тариф Free с max_leads = 3
$freeTariff = App\Models\Tariff::where('name', 'Free')->first();
if (!$freeTariff) {
    echo 'Free tariff not found' . PHP_EOL;
    exit(1);
}

echo 'Using tariff: ' . $freeTariff->name . ' (max_leads: ' . $freeTariff->max_leads . ')' . PHP_EOL;

// Назначим Free тариф пользователю
$executor->update([
    'current_tariff_id' => $freeTariff->id,
    'subscription_started_at' => now(),
    'subscription_ends_at' => now()->addDays(30),
]);

echo 'Assigned Free tariff to executor' . PHP_EOL;

// Теперь протестируем canUserRespondToOrder
$subscriptionService = new App\Services\SubscriptionService();
$result = $subscriptionService->canUserRespondToOrder($executor);

echo 'canUserRespondToOrder result:' . PHP_EOL;
echo 'can_respond: ' . ($result['can_respond'] ? 'true' : 'false') . PHP_EOL;
echo 'message: ' . $result['message'] . PHP_EOL;

// Проверим количество откликов
$currentLeads = App\Models\OrderResponse::where('executor_id', $executor->id)
    ->when($executor->subscription_started_at, function ($query) use ($executor) {
        $query->where('created_at', '>=', $executor->subscription_started_at);
    })
    ->count();

echo 'Current leads count: ' . $currentLeads . PHP_EOL;
echo 'Max leads allowed: ' . $freeTariff->max_leads . PHP_EOL;
