<?php

namespace App\Console\Commands;

use App\Models\File;
use App\Models\Order;
use App\Models\OrderAttachment;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class AddRealTestImages extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'add:real-test-images {orderId?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Добавить реальные тестовые изображения к заказу';

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

        $this->info("🖼️ Скачиваем реальные тестовые изображения для заказа #{$orderId}");

        // Создаем директорию для изображений
        $imagesDir = 'attachments/images';
        Storage::disk('public')->makeDirectory($imagesDir);

        // URLs для тестовых изображений (placeholder изображения)
        $testImages = [
            [
                'url' => 'https://picsum.photos/800/600?random=1',
                'name' => 'план_квартиры.jpg'
            ],
            [
                'url' => 'https://picsum.photos/800/600?random=2', 
                'name' => 'состояние_помещения.jpg'
            ],
            [
                'url' => 'https://picsum.photos/800/600?random=3',
                'name' => 'схема_электропроводки.png'
            ],
            [
                'url' => 'https://picsum.photos/800/600?random=4',
                'name' => 'замеры_помещения.jpg'
            ]
        ];

        $createdFiles = [];

        foreach ($testImages as $image) {
            try {
                // Скачиваем изображение
                $imageContent = file_get_contents($image['url']);
                
                if ($imageContent === false) {
                    $this->warn("⚠️ Не удалось скачать изображение: {$image['name']}");
                    continue;
                }

                // Сохраняем файл
                $filePath = $imagesDir . '/' . $image['name'];
                Storage::disk('public')->put($filePath, $imageContent);

                // Создаем запись в базе данных
                $file = File::create([
                    'user_id' => $customer->id,
                    'path' => $filePath,
                    'name' => $image['name'],
                    'size' => strlen($imageContent)
                ]);

                // Привязываем файл к заказу
                OrderAttachment::create([
                    'order_id' => $order->id,
                    'file_id' => $file->id
                ]);

                $createdFiles[] = $file;
                $this->info("✅ Скачано и создано: {$image['name']} (ID: {$file->id})");

            } catch (\Exception $e) {
                $this->error("❌ Ошибка при обработке {$image['name']}: " . $e->getMessage());
            }
        }

        if (count($createdFiles) > 0) {
            $this->info('');
            $this->info("✅ Реальные изображения добавлены к заказу #{$orderId}:");
            $this->info("📁 Всего изображений: " . count($createdFiles));
            $this->info("📋 Название заказа: {$order->title}");
            $this->info("👤 Автор: {$customer->name}");
            $this->info('');
            $this->info('📱 Теперь в мобильном приложении будут видны реальные изображения!');
            $this->info('🔗 Изображения доступны по ссылкам:');
            
            foreach ($createdFiles as $file) {
                $this->info("   - {$file->name}: " . Storage::disk('public')->url($file->path));
            }
        } else {
            $this->error('❌ Не удалось создать ни одного изображения');
        }
    }
}
