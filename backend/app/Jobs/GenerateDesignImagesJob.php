<?php

namespace App\Jobs;

use App\Services\ChatGPTDesignService;
use App\Models\DesignImageGeneration;
use App\Events\DesignImagesGeneratedEvent;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Exception;

class GenerateDesignImagesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 240; // 4 минуты на генерацию (оптимизировано)
    public $tries = 2; // Попытки повтора при ошибке

    protected string $designContent;
    protected string $description;
    protected array $roomType;
    protected array $style;
    protected int $imageCount;
    protected string $generationId;
    protected ?int $userId;

    /**
     * Create a new job instance.
     */
    public function __construct(
        string $designContent,
        string $description,
        array $roomType,
        array $style,
        int $imageCount,
        string $generationId,
        ?int $userId = null
    ) {
        $this->designContent = $designContent;
        $this->description = $description;
        $this->roomType = $roomType;
        $this->style = $style;
        $this->imageCount = $imageCount;
        $this->generationId = $generationId;
        $this->userId = $userId;
    }

    /**
     * Execute the job.
     */
    public function handle(ChatGPTDesignService $designService): void
    {
        try {
            Log::info('Starting design images generation job', [
                'generation_id' => $this->generationId,
                'user_id' => $this->userId,
                'image_count' => $this->imageCount
            ]);

            // Обновляем статус на "в процессе"
            DesignImageGeneration::where('generation_id', $this->generationId)
                ->update([
                    'status' => 'processing',
                    'started_at' => now()
                ]);

            // Генерируем изображения
            $images = $designService->generateDesignImages(
                $this->designContent,
                $this->description,
                $this->roomType,
                $this->style,
                $this->imageCount
            );

            // Обновляем статус на "завершено" и сохраняем результат
            DesignImageGeneration::where('generation_id', $this->generationId)
                ->update([
                    'status' => 'completed',
                    'images' => json_encode($images),
                    'completed_at' => now()
                ]);

            Log::info('Design images generation completed', [
                'generation_id' => $this->generationId,
                'images_generated' => count($images)
            ]);

            // Отправляем WebSocket уведомление о готовности изображений
            if ($this->userId) {
                event(new DesignImagesGeneratedEvent(
                    $this->userId,
                    $this->generationId,
                    $images
                ));
            }

        } catch (Exception $e) {
            Log::error('Design images generation failed', [
                'generation_id' => $this->generationId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Обновляем статус на "ошибка"
            DesignImageGeneration::where('generation_id', $this->generationId)
                ->update([
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                    'completed_at' => now()
                ]);

            // Перебрасываем исключение для повторной попытки
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(Exception $exception): void
    {
        Log::error('Design images generation job failed permanently', [
            'generation_id' => $this->generationId,
            'error' => $exception->getMessage()
        ]);

        // Обновляем статус на "ошибка" окончательно
        DesignImageGeneration::where('generation_id', $this->generationId)
            ->update([
                'status' => 'failed',
                'error_message' => $exception->getMessage(),
                'completed_at' => now()
            ]);

        // Отправляем WebSocket уведомление об ошибке
        if ($this->userId) {
            event(new DesignImagesGeneratedEvent(
                $this->userId,
                $this->generationId,
                [],
                'Ошибка при генерации изображений: ' . $exception->getMessage()
            ));
        }
    }
}
