<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Найдем заказ с ID 24 из скриншота
$order = App\Models\Order::with(['files', 'author'])->find(24);
if (!$order) {
    echo 'Order 24 not found' . PHP_EOL;
    exit(1);
}

echo 'Order 24 fields:' . PHP_EOL;
echo 'title: ' . $order->title . PHP_EOL;
echo 'description: ' . $order->description . PHP_EOL;
echo 'full_address: ' . ($order->full_address ?: 'null') . PHP_EOL;
echo 'work_date: ' . ($order->work_date ?: 'null') . PHP_EOL;
echo 'work_time: ' . ($order->work_time ?: 'null') . PHP_EOL;
echo 'start_date: ' . ($order->start_date ?: 'null') . PHP_EOL;
echo 'end_date: ' . ($order->end_date ?: 'null') . PHP_EOL;
echo 'housing_type: ' . ($order->housing_type ?: 'null') . PHP_EOL;
echo 'housing_condition: ' . ($order->housing_condition ?: 'null') . PHP_EOL;
echo 'housing_preparation_level: ' . ($order->housing_preparation_level ?: 'null') . PHP_EOL;
echo 'bathroom_type: ' . ($order->bathroom_type ?: 'null') . PHP_EOL;
echo 'ceiling_height: ' . ($order->ceiling_height ?: 'null') . PHP_EOL;
echo 'total_area: ' . ($order->total_area ?: 'null') . PHP_EOL;
echo 'files_count: ' . $order->files->count() . PHP_EOL;

if ($order->files->count() > 0) {
    echo 'Files:' . PHP_EOL;
    foreach ($order->files as $file) {
        echo '  - ' . $file->name . ' (URL: ' . $file->url . ')' . PHP_EOL;
    }
}
