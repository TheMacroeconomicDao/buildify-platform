<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Найдем заказ в статусе AwaitingConfirmation с исполнителем
$order = App\Models\Order::where('status', 5)
    ->whereNotNull('executor_id')
    ->whereNotNull('author_id')
    ->first();

if (!$order) {
    echo 'No suitable order found' . PHP_EOL;
    exit(1);
}

echo 'Testing with order ID: ' . $order->id . PHP_EOL;
echo 'Customer ID: ' . $order->author_id . PHP_EOL;
echo 'Executor ID: ' . $order->executor_id . PHP_EOL;
echo 'Current status: ' . $order->status . PHP_EOL;

// Проверяем существующие отзывы
$executorReview = App\Models\ExecutorReview::where('order_id', $order->id)
    ->where('customer_id', $order->author_id)
    ->where('executor_id', $order->executor_id)
    ->first();

$customerReview = App\Models\CustomerReview::where('order_id', $order->id)
    ->where('executor_id', $order->executor_id)
    ->where('customer_id', $order->author_id)
    ->first();

echo 'Executor review exists: ' . ($executorReview ? 'Yes (ID: ' . $executorReview->id . ')' : 'No') . PHP_EOL;
echo 'Customer review exists: ' . ($customerReview ? 'Yes (ID: ' . $customerReview->id . ')' : 'No') . PHP_EOL;

// Создадим недостающие отзывы для тестирования
if (!$executorReview) {
    echo 'Creating executor review...' . PHP_EOL;
    $executorReview = App\Models\ExecutorReview::create([
        'order_id' => $order->id,
        'author_id' => $order->author_id,
        'customer_id' => $order->author_id,
        'executor_id' => $order->executor_id,
        'rating' => 5,
        'quality_rating' => 5,
        'speed_rating' => 5,
        'communication_rating' => 5,
        'text' => 'Test review',
        'comment' => 'Test comment',
    ]);
    echo 'Executor review created with ID: ' . $executorReview->id . PHP_EOL;
}

if (!$customerReview) {
    echo 'Creating customer review...' . PHP_EOL;
    $customerReview = App\Models\CustomerReview::create([
        'order_id' => $order->id,
        'customer_id' => $order->author_id,
        'executor_id' => $order->executor_id,
        'rating' => 5,
        'comment' => 'Test customer review',
    ]);
    echo 'Customer review created with ID: ' . $customerReview->id . PHP_EOL;
}

// Перезагружаем заказ и проверяем статус
$order->refresh();
echo 'Order status after reviews: ' . $order->status . PHP_EOL;
echo 'completed_by_executor: ' . ($order->completed_by_executor ? 'true' : 'false') . PHP_EOL;
echo 'completed_by_customer: ' . ($order->completed_by_customer ? 'true' : 'false') . PHP_EOL;

// Вручную вызываем логику проверки
echo 'Manually calling completion check...' . PHP_EOL;
$controller = new App\Http\Controllers\ExecutorReviewController();
$reflection = new ReflectionClass($controller);
$method = $reflection->getMethod('checkAndCompleteOrderIfBothReviewsExist');
$method->setAccessible(true);
$method->invoke($controller, $order->id);

// Проверяем результат
$order->refresh();
echo 'Final order status: ' . $order->status . PHP_EOL;
echo 'Final completed_by_executor: ' . ($order->completed_by_executor ? 'true' : 'false') . PHP_EOL;
echo 'Final completed_by_customer: ' . ($order->completed_by_customer ? 'true' : 'false') . PHP_EOL;
