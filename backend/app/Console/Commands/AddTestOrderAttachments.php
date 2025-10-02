<?php

namespace App\Console\Commands;

use App\Models\File;
use App\Models\Order;
use App\Models\OrderAttachment;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class AddTestOrderAttachments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'add:test-order-attachments {orderId?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Добавить тестовые файлы к заказу';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $orderId = $this->argument('orderId');
        
        // Если ID не указан, берем последний заказ
        if (!$orderId) {
            $order = Order::latest()->first();
            if (!$order) {
                $this->error('❌ Заказы не найдены. Сначала создайте заказ командой: php artisan create:test-order');
                return;
            }
            $orderId = $order->id;
        } else {
            $order = Order::find($orderId);
            if (!$order) {
                $this->error("❌ Заказ с ID {$orderId} не найден");
                return;
            }
        }

        // Находим автора заказа
        $customer = User::find($order->author_id);
        if (!$customer) {
            $this->error('❌ Автор заказа не найден');
            return;
        }

        $this->info("📎 Добавляем тестовые файлы к заказу #{$orderId}");

        // Создаем директорию для тестовых файлов
        $testFilesDir = 'attachments/test';
        Storage::disk('public')->makeDirectory($testFilesDir);

        // Тестовые файлы (создаем простые текстовые файлы с разными расширениями)
        $testFiles = [
            [
                'name' => 'план_ремонта.jpg',
                'content' => 'Это тестовое изображение плана ремонта',
                'type' => 'image'
            ],
            [
                'name' => 'смета_работ.pdf', 
                'content' => 'Это тестовый PDF файл со сметой работ',
                'type' => 'document'
            ],
            [
                'name' => 'схема_электрики.png',
                'content' => 'Это тестовое изображение схемы электрики',
                'type' => 'image'
            ],
            [
                'name' => 'техническое_задание.docx',
                'content' => 'Это тестовый документ с техническим заданием',
                'type' => 'document'
            ]
        ];

        $createdFiles = [];

        foreach ($testFiles as $testFile) {
            // Создаем файл на диске
            $filePath = $testFilesDir . '/' . $testFile['name'];
            Storage::disk('public')->put($filePath, $testFile['content']);

            // Создаем запись в базе данных
            $file = File::create([
                'user_id' => $customer->id,
                'path' => $filePath,
                'name' => $testFile['name'],
                'size' => strlen($testFile['content'])
            ]);

            // Привязываем файл к заказу
            OrderAttachment::create([
                'order_id' => $order->id,
                'file_id' => $file->id
            ]);

            $createdFiles[] = $file;
            $this->info("✅ Создан файл: {$testFile['name']} (ID: {$file->id})");
        }

        $this->info('');
        $this->info("✅ Тестовые файлы добавлены к заказу #{$orderId}:");
        $this->info("📁 Всего файлов: " . count($createdFiles));
        $this->info("📋 Название заказа: {$order->title}");
        $this->info("👤 Автор: {$customer->name}");
        $this->info('');
        $this->info('📱 Теперь в мобильном приложении будут видны прикрепленные файлы!');
        $this->info('🔗 Файлы доступны по ссылкам:');
        
        foreach ($createdFiles as $file) {
            $this->info("   - {$file->name}: " . Storage::disk('public')->url($file->path));
        }
    }
}
