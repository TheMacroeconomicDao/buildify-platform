<?php

namespace App\Console\Commands;

use App\Models\Order;
use Illuminate\Console\Command;

class TestFileUrls extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:file-urls {orderId?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Тестировать URL файлов для мобильного приложения';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $orderId = $this->argument('orderId') ?? 3;
        
        $order = Order::with('files')->find($orderId);
        if (!$order) {
            $this->error("❌ Заказ с ID {$orderId} не найден");
            return;
        }

        $this->info("🔍 Тестируем URL файлов для заказа #{$orderId}");
        $this->info('');

        $files = $order->files;
        
        if ($files->count() === 0) {
            $this->warn("⚠️ У заказа нет файлов");
            return;
        }

        $this->info("📎 Файлы и их URL:");
        
        foreach ($files as $file) {
            $this->info("📄 {$file->name}");
            $this->info("   path: {$file->path}");
            $this->info("   url: {$file->url}");
            
            // Моделируем логику мобильного приложения
            $baseUrl = 'http://10.0.2.2:8000'; // config.baseUrl без /api
            
            if ($file->url && str_starts_with($file->url, '/')) {
                $mobileUrl = $baseUrl . $file->url;
            } else {
                $mobileUrl = $baseUrl . '/storage/' . $file->path;
            }
            
            $this->info("   📱 mobile URL: {$mobileUrl}");
            $this->info('');
        }

        $this->info("✅ Проверьте, что все URL начинаются с http://10.0.2.2:8000");
    }
}
