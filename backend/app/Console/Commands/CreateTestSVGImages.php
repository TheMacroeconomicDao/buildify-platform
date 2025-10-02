<?php

namespace App\Console\Commands;

use App\Models\File;
use App\Models\Order;
use App\Models\OrderAttachment;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class CreateTestSVGImages extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'create:test-svg-images {orderId?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Создать тестовые SVG изображения для заказа';

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

        $this->info("🎨 Создаем тестовые SVG изображения для заказа #{$orderId}");

        // Создаем директорию для изображений
        $imagesDir = 'attachments/svg-images';
        Storage::disk('public')->makeDirectory($imagesDir);

        // Тестовые SVG изображения
        $svgImages = [
            [
                'name' => 'план_квартиры.svg',
                'content' => $this->createPlanSVG()
            ],
            [
                'name' => 'состояние_помещения.svg', 
                'content' => $this->createRoomSVG()
            ],
            [
                'name' => 'схема_электрики.svg',
                'content' => $this->createElectricalSVG()
            ]
        ];

        $createdFiles = [];

        foreach ($svgImages as $image) {
            try {
                // Сохраняем файл
                $filePath = $imagesDir . '/' . $image['name'];
                Storage::disk('public')->put($filePath, $image['content']);

                // Создаем запись в базе данных
                $file = File::create([
                    'user_id' => $customer->id,
                    'path' => $filePath,
                    'name' => $image['name'],
                    'size' => strlen($image['content'])
                ]);

                // Привязываем файл к заказу
                OrderAttachment::create([
                    'order_id' => $order->id,
                    'file_id' => $file->id
                ]);

                $createdFiles[] = $file;
                $this->info("✅ Создано: {$image['name']} (ID: {$file->id})");

            } catch (\Exception $e) {
                $this->error("❌ Ошибка при создании {$image['name']}: " . $e->getMessage());
            }
        }

        $this->info('');
        $this->info("✅ SVG изображения добавлены к заказу #{$orderId}:");
        $this->info("📁 Всего изображений: " . count($createdFiles));
        $this->info("📋 Название заказа: {$order->title}");
        $this->info("👤 Автор: {$customer->name}");
        $this->info('');
        $this->info('📱 Теперь в мобильном приложении будут видны тестовые изображения!');
        $this->info('🔗 Изображения доступны по ссылкам:');
        
        foreach ($createdFiles as $file) {
            $this->info("   - {$file->name}: " . Storage::disk('public')->url($file->path));
        }
    }

    private function createPlanSVG(): string
    {
        return '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="300" fill="#f0f0f0" stroke="#333" stroke-width="2"/>
            <rect x="20" y="20" width="150" height="120" fill="#e6f3ff" stroke="#0066cc" stroke-width="1"/>
            <text x="95" y="85" text-anchor="middle" font-family="Arial" font-size="12" fill="#0066cc">Гостиная</text>
            <rect x="190" y="20" width="120" height="80" fill="#ffe6e6" stroke="#cc0000" stroke-width="1"/>
            <text x="250" y="65" text-anchor="middle" font-family="Arial" font-size="12" fill="#cc0000">Кухня</text>
            <rect x="20" y="160" width="100" height="100" fill="#e6ffe6" stroke="#009900" stroke-width="1"/>
            <text x="70" y="215" text-anchor="middle" font-family="Arial" font-size="12" fill="#009900">Спальня</text>
            <rect x="140" y="160" width="80" height="60" fill="#fff2e6" stroke="#ff6600" stroke-width="1"/>
            <text x="180" y="195" text-anchor="middle" font-family="Arial" font-size="12" fill="#ff6600">Ванная</text>
            <text x="200" y="280" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold">План квартиры</text>
        </svg>';
    }

    private function createRoomSVG(): string
    {
        return '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="300" fill="#f8f8f8" stroke="#666" stroke-width="2"/>
            <rect x="50" y="50" width="300" height="200" fill="#fff" stroke="#333" stroke-width="1"/>
            
            <!-- Окно -->
            <rect x="80" y="50" width="80" height="10" fill="#87ceeb" stroke="#4682b4" stroke-width="1"/>
            <text x="120" y="45" text-anchor="middle" font-family="Arial" font-size="10" fill="#4682b4">Окно</text>
            
            <!-- Дверь -->
            <rect x="350" y="120" width="10" height="60" fill="#8b4513" stroke="#654321" stroke-width="1"/>
            <text x="380" y="155" font-family="Arial" font-size="10" fill="#654321">Дверь</text>
            
            <!-- Повреждения -->
            <circle cx="150" cy="120" r="15" fill="#ff6b6b" stroke="#e74c3c" stroke-width="2" opacity="0.7"/>
            <text x="150" y="165" text-anchor="middle" font-family="Arial" font-size="10" fill="#e74c3c">Трещина в стене</text>
            
            <circle cx="280" cy="180" r="20" fill="#ffa500" stroke="#ff8c00" stroke-width="2" opacity="0.7"/>
            <text x="280" y="220" text-anchor="middle" font-family="Arial" font-size="10" fill="#ff8c00">Пятно на полу</text>
            
            <text x="200" y="280" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold">Состояние помещения</text>
        </svg>';
    }

    private function createElectricalSVG(): string
    {
        return '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="300" fill="#f0f8ff" stroke="#1e90ff" stroke-width="2"/>
            
            <!-- Электрощит -->
            <rect x="50" y="50" width="40" height="60" fill="#ddd" stroke="#000" stroke-width="2"/>
            <text x="70" y="125" text-anchor="middle" font-family="Arial" font-size="10">Щит</text>
            
            <!-- Провода -->
            <line x1="90" y1="80" x2="150" y2="80" stroke="#ff0000" stroke-width="3"/>
            <line x1="150" y1="80" x2="150" y2="120" stroke="#ff0000" stroke-width="3"/>
            <line x1="150" y1="120" x2="200" y2="120" stroke="#ff0000" stroke-width="3"/>
            
            <line x1="90" y1="90" x2="250" y2="90" stroke="#0000ff" stroke-width="3"/>
            <line x1="250" y1="90" x2="250" y2="150" stroke="#0000ff" stroke-width="3"/>
            
            <!-- Розетки -->
            <circle cx="200" cy="120" r="8" fill="#ffff00" stroke="#000" stroke-width="1"/>
            <text x="200" y="140" text-anchor="middle" font-family="Arial" font-size="8">Розетка</text>
            
            <circle cx="250" cy="150" r="8" fill="#ffff00" stroke="#000" stroke-width="1"/>
            <text x="250" y="170" text-anchor="middle" font-family="Arial" font-size="8">Розетка</text>
            
            <!-- Выключатели -->
            <rect x="140" y="170" width="15" height="10" fill="#90ee90" stroke="#000" stroke-width="1"/>
            <text x="147" y="190" text-anchor="middle" font-family="Arial" font-size="8">Выкл.</text>
            
            <!-- Лампы -->
            <circle cx="300" cy="80" r="12" fill="#fffacd" stroke="#000" stroke-width="1"/>
            <text x="300" y="105" text-anchor="middle" font-family="Arial" font-size="8">Люстра</text>
            
            <text x="200" y="280" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold">Схема электропроводки</text>
        </svg>';
    }
}
