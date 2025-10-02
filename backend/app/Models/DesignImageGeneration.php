<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DesignImageGeneration extends Model
{
    protected $fillable = [
        'generation_id',
        'user_id',
        'design_content',
        'description',
        'room_type',
        'style',
        'image_count',
        'status',
        'images',
        'error_message',
        'started_at',
        'completed_at'
    ];

    protected $casts = [
        'room_type' => 'array',
        'style' => 'array',
        'images' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Статусы генерации изображений
     */
    public const STATUS_PENDING = 'pending';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';

    /**
     * Связь с пользователем
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Проверка статуса
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isProcessing(): bool
    {
        return $this->status === self::STATUS_PROCESSING;
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    public function isFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }

    /**
     * Получить изображения в виде массива
     */
    public function getImagesArray(): array
    {
        return $this->images ?? [];
    }
}
