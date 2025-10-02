<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Найдем заказ в статусе AwaitingConfirmation без отзывов
$order = App\Models\Order::where('status', 5)
    ->whereNotNull('executor_id')
    ->whereNotNull('author_id')
    ->whereDoesntHave('executorReviews')
    ->whereDoesntHave('customerReviews')
    ->first();

if (!$order) {
    echo 'No suitable order without reviews found, creating test scenario...' . PHP_EOL;
    
    // Найдем любой заказ и очистим его отзывы
    $order = App\Models\Order::where('status', 5)
        ->whereNotNull('executor_id')
        ->whereNotNull('author_id')
        ->first();
        
    if (!$order) {
        echo 'No suitable order found at all' . PHP_EOL;
        exit(1);
    }
    
    // Удаляем существующие отзывы для теста
    App\Models\ExecutorReview::where('order_id', $order->id)->delete();
    App\Models\CustomerReview::where('order_id', $order->id)->delete();
    echo 'Cleared existing reviews for order ' . $order->id . PHP_EOL;
}

echo 'Testing with order ID: ' . $order->id . PHP_EOL;
echo 'Customer ID: ' . $order->author_id . PHP_EOL;
echo 'Executor ID: ' . $order->executor_id . PHP_EOL;
echo 'Initial status: ' . $order->status . PHP_EOL;

// Создаем первый отзыв (заказчик об исполнителе)
echo PHP_EOL . 'Step 1: Creating executor review (customer about executor)...' . PHP_EOL;
$executorReview = App\Models\ExecutorReview::create([
    'order_id' => $order->id,
    'author_id' => $order->author_id,
    'customer_id' => $order->author_id,
    'executor_id' => $order->executor_id,
    'rating' => 5,
    'quality_rating' => 5,
    'speed_rating' => 5,
    'communication_rating' => 5,
    'text' => 'Test executor review',
    'comment' => 'Test comment',
]);

// Вызываем логику проверки как в контроллере
$controller = new App\Http\Controllers\ExecutorReviewController();
$reflection = new ReflectionClass($controller);
$method = $reflection->getMethod('checkAndCompleteOrderIfBothReviewsExist');
$method->setAccessible(true);
$method->invoke($controller, $order->id);

$order->refresh();
echo 'Status after executor review: ' . $order->status . PHP_EOL;

// Создаем второй отзыв (исполнитель о заказчике)
echo PHP_EOL . 'Step 2: Creating customer review (executor about customer)...' . PHP_EOL;
$customerReview = App\Models\CustomerReview::create([
    'order_id' => $order->id,
    'customer_id' => $order->author_id,
    'executor_id' => $order->executor_id,
    'rating' => 5,
    'comment' => 'Test customer review',
]);

// Вызываем логику проверки как в контроллере
$customerController = new App\Http\Controllers\CustomerReviewController();
$customerReflection = new ReflectionClass($customerController);
$customerMethod = $customerReflection->getMethod('checkAndCompleteOrderIfBothReviewsExist');
$customerMethod->setAccessible(true);
$customerMethod->invoke($customerController, $order->id);

$order->refresh();
echo 'Final status after both reviews: ' . $order->status . PHP_EOL;
echo 'Final completed_by_executor: ' . ($order->completed_by_executor ? 'true' : 'false') . PHP_EOL;
echo 'Final completed_by_customer: ' . ($order->completed_by_customer ? 'true' : 'false') . PHP_EOL;

if ($order->status == 8) { // Completed = 8
    echo PHP_EOL . '✅ SUCCESS: Order automatically completed after both reviews!' . PHP_EOL;
} else {
    echo PHP_EOL . '❌ FAILED: Order did not complete automatically' . PHP_EOL;
}
