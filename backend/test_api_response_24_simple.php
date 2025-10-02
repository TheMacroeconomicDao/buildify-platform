<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Проверим, какие поля возвращает API show метод
$order = App\Models\Order::with(['files', 'author'])->findOrFail(24);

// Симулируем структуру ответа как в OrderController::show
$result = [
    'id' => $order->id,
    'title' => $order->title,
    'work_direction' => $order->work_direction,
    'work_direction_label' => $order->work_direction, // Упрощенно
    'work_type' => $order->work_type,
    'work_type_label' => $order->work_type, // Упрощенно
    'description' => $order->description,
    'city' => $order->city,
    'address' => $order->address,
    
    // Новые поля даты и времени
    'date_type' => $order->date_type,
    'work_date' => $order->work_date ? $order->work_date->format('Y-m-d') : null,
    'work_time' => $order->work_time,
    'start_date' => $order->start_date ? $order->start_date->format('Y-m-d') : null,
    'start_time' => $order->start_time,
    'end_date' => $order->end_date ? $order->end_date->format('Y-m-d') : null,
    'end_time' => $order->end_time,
    
    // Дополнительные поля жилья
    'full_address' => $order->full_address,
    'latitude' => $order->latitude,
    'longitude' => $order->longitude,
    'housing_type' => $order->housing_type,
    'housing_condition' => $order->housing_condition,
    'housing_preparation_level' => $order->housing_preparation_level,
    'bathroom_type' => $order->bathroom_type,
    'ceiling_height' => $order->ceiling_height,
    'total_area' => $order->total_area,
    'max_amount' => $order->max_amount,
    'status' => $order->status,
    'files' => $order->files->map(function ($file) {
        return [
            'id' => $file->id,
            'name' => $file->name,
            'url' => $file->url,
            'path' => $file->path,
        ];
    }),
];

echo 'API Response structure:' . PHP_EOL;
foreach ($result as $key => $value) {
    if ($key === 'files' && is_array($value)) {
        echo "$key: " . count($value) . ' files' . PHP_EOL;
        foreach ($value as $file) {
            echo "  - {$file['name']}" . PHP_EOL;
        }
    } else {
        echo "$key: " . (is_null($value) ? 'null' : $value) . PHP_EOL;
    }
}
