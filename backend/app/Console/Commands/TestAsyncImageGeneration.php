<?php

namespace App\Console\Commands;

use App\Jobs\GenerateDesignImagesJob;
use App\Models\DesignImageGeneration;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class TestAsyncImageGeneration extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:async-images {--user-id=1}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Тестирование асинхронной генерации изображений дизайна';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $userId = $this->option('user-id');
        
        // Проверяем существование пользователя
        $user = User::find($userId);
        if (!$user) {
            $this->error("Пользователь с ID {$userId} не найден");
            return 1;
        }

        $this->info("Запуск тестовой генерации изображений для пользователя: {$user->email}");

        // Тестовые данные
        $designContent = "Современная гостиная в стиле минимализм. Светлые тона, натуральные материалы, функциональная мебель. Большие окна обеспечивают естественное освещение.";
        $description = "Тестовый запрос на генерацию дизайна современной гостиной";
        $roomType = ['living_room'];
        $style = ['modern', 'minimalist'];
        $imageCount = 2;
        
        $generationId = Str::uuid()->toString();

        // Создаем запись в БД
        $generation = DesignImageGeneration::create([
            'generation_id' => $generationId,
            'user_id' => $userId,
            'design_content' => $designContent,
            'description' => $description,
            'room_type' => $roomType,
            'style' => $style,
            'image_count' => $imageCount,
            'status' => DesignImageGeneration::STATUS_PENDING
        ]);

        $this->info("Создана запись генерации с ID: {$generationId}");

        // Отправляем задачу в очередь
        GenerateDesignImagesJob::dispatch(
            $designContent,
            $description,
            $roomType,
            $style,
            $imageCount,
            $generationId,
            $userId
        );

        $this->info("Задача отправлена в очередь!");
        $this->info("Для мониторинга используйте:");
        $this->line("  - php artisan queue:work --verbose");
        $this->line("  - curl http://your-domain/api/design/images/status/{$generationId}");
        
        $this->info("Generation ID для отслеживания: {$generationId}");

        return 0;
    }
}
