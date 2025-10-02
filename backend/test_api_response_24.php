<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Симулируем API запрос для заказа 24
$order = App\Models\Order::with(['files', 'author'])->findOrFail(24);

// Создаем тестового пользователя-посредника
$mediator = App\Models\User::where('type', 3)->first(); // Type::Mediator = 3
if (!$mediator) {
    echo 'No mediator found' . PHP_EOL;
    exit(1);
}

// Симулируем аутентификацию
auth()->login($mediator);

// Вызываем метод show как в контроллере
$controller = new App\Http\Controllers\OrderController();
$response = $controller->show(24);
$responseData = json_decode($response->getContent(), true);

echo 'API Response for order 24:' . PHP_EOL;
echo 'Success: ' . ($responseData['success'] ? 'true' : 'false') . PHP_EOL;

if (isset($responseData['result'])) {
    $result = $responseData['result'];
    echo 'Fields in API response:' . PHP_EOL;
    
    $fieldsToCheck = [
        'title', 'description', 'full_address', 'work_date', 'work_time', 
        'start_date', 'end_date', 'housing_type', 'housing_condition',
        'housing_preparation_level', 'bathroom_type', 'ceiling_height', 
        'total_area', 'files'
    ];
    
    foreach ($fieldsToCheck as $field) {
        $value = isset($result[$field]) ? $result[$field] : 'NOT_PRESENT';
        if ($field === 'files' && is_array($value)) {
            echo "  $field: " . count($value) . ' files' . PHP_EOL;
        } else {
            echo "  $field: " . (is_null($value) ? 'null' : $value) . PHP_EOL;
        }
    }
}
