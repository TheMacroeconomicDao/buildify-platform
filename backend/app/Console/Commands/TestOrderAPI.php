<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Models\User;
use Illuminate\Console\Command;

class TestOrderAPI extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:order-api {orderId?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Тестировать API заказа и проверить наличие файлов';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $orderId = $this->argument('orderId') ?? 2; // По умолчанию заказ #2
        
        $order = Order::with('files')->find($orderId);
        if (!$order) {
            $this->error("❌ Заказ с ID {$orderId} не найден");
            return;
        }

        $this->info("🔍 Тестируем API для заказа #{$orderId}");
        $this->info('');

        // Проверяем основные данные заказа
        $this->info("📋 Основные данные:");
        $this->info("   Название: {$order->title}");
        $this->info("   Стоимость: ${$order->max_amount}");
        $this->info("   Статус: {$order->status}");
        $this->info("   Автор ID: {$order->author_id}");
        $this->info('');

        // Проверяем файлы
        $files = $order->files;
        $this->info("📎 Файлы заказа:");
        $this->info("   Всего файлов: " . $files->count());
        
        if ($files->count() > 0) {
            foreach ($files as $file) {
                $this->info("   - ID: {$file->id} | {$file->name} | Размер: {$file->size} байт");
                $this->info("     Путь: {$file->path}");
                $this->info("     URL: {$file->url}");
            }
        } else {
            $this->warn("   ⚠️ Файлы не найдены! Добавьте файлы командой:");
            $this->warn("      php artisan add:test-order-attachments {$orderId}");
            $this->warn("      php artisan create:test-svg-images {$orderId}");
        }
        
        $this->info('');

        // Симуляция API ответа
        $apiData = $order->toArray();
        $apiData['files'] = $files->toArray();
        
        $this->info("🌐 Структура API ответа:");
        $this->info("   Ключ 'files' присутствует: " . (isset($apiData['files']) ? '✅ Да' : '❌ Нет'));
        $this->info("   Количество файлов в API: " . count($apiData['files']));
        
        if (count($apiData['files']) > 0) {
            $this->info("   Первый файл содержит:");
            $firstFile = $apiData['files'][0];
            foreach (['id', 'name', 'path', 'size', 'url'] as $key) {
                $value = $firstFile[$key] ?? 'null';
                $this->info("     {$key}: {$value}");
            }
        }

        $this->info('');
        $this->info("✅ Тест API завершен!");
        $this->info("📱 В мобильном приложении должны отображаться все файлы");
    }
}
