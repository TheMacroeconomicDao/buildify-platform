<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Найдем заказ в статусе AwaitingConfirmation
$order = App\Models\Order::where('status', 5)->first(); // AwaitingConfirmation = 5
if (!$order) {
    echo 'No order in AwaitingConfirmation status found' . PHP_EOL;
    exit(1);
}

echo 'Testing with order: ' . $order->id . ' (status: ' . $order->status . ')' . PHP_EOL;
echo 'Customer ID: ' . $order->author_id . PHP_EOL;
echo 'Executor ID: ' . $order->executor_id . PHP_EOL;

// Проверяем наличие отзывов
$executorReview = App\Models\ExecutorReview::where('order_id', $order->id)
    ->where('customer_id', $order->author_id)
    ->where('executor_id', $order->executor_id)
    ->first();

$customerReview = App\Models\CustomerReview::where('order_id', $order->id)
    ->where('executor_id', $order->executor_id)
    ->where('customer_id', $order->author_id)
    ->first();

echo 'Executor review exists: ' . ($executorReview ? 'Yes' : 'No') . PHP_EOL;
echo 'Customer review exists: ' . ($customerReview ? 'Yes' : 'No') . PHP_EOL;

if ($executorReview && $customerReview) {
    echo 'Both reviews exist - order should be Completed' . PHP_EOL;
} else {
    echo 'Missing reviews - order should stay in AwaitingConfirmation' . PHP_EOL;
}

// Проверим флаги завершения
echo 'completed_by_executor: ' . ($order->completed_by_executor ? 'true' : 'false') . PHP_EOL;
echo 'completed_by_customer: ' . ($order->completed_by_customer ? 'true' : 'false') . PHP_EOL;
