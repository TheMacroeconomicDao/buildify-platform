<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Orchid\Filters\Filterable;
use Orchid\Screen\AsSource;

class MediatorOrderStep extends Model
{
    use AsSource, Filterable;

    protected $fillable = [
        'order_id',
        'mediator_id',
        'step',
        'status',
        'notes',
        'data',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'data' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    // Статусы этапов
    const STATUS_ACTIVE = 'active';
    const STATUS_COMPLETED = 'completed';
    const STATUS_ARCHIVED = 'archived';
    const STATUS_RETURNED = 'returned';

    // Этапы работы
    const STEP_1_DETAILS = 1; // Уточнение деталей заказа
    const STEP_2_EXECUTOR = 2; // Поиск исполнителя
    const STEP_3_EXECUTION = 3; // Реализация проекта

    /**
     * Связь с заказом
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Связь с посредником
     */
    public function mediator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mediator_id');
    }

    /**
     * Получить название этапа
     */
    public function getStepNameAttribute(): string
    {
        return match ($this->step) {
            self::STEP_1_DETAILS => 'Уточнение деталей заказа',
            self::STEP_2_EXECUTOR => 'Поиск исполнителя',
            self::STEP_3_EXECUTION => 'Реализация проекта',
            default => 'Неизвестный этап',
        };
    }

    /**
     * Получить описание статуса
     */
    public function getStatusNameAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_ACTIVE => 'Активный',
            self::STATUS_COMPLETED => 'Завершен',
            self::STATUS_ARCHIVED => 'Архивирован',
            self::STATUS_RETURNED => 'Возвращен',
            default => 'Неизвестный статус',
        };
    }

    /**
     * Проверка, активен ли этап
     */
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    /**
     * Проверка, завершен ли этап
     */
    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * Завершить этап
     */
    public function complete(array $data = []): bool
    {
        return $this->update([
            'status' => self::STATUS_COMPLETED,
            'completed_at' => now(),
            'data' => array_merge($this->data ?? [], $data),
        ]);
    }

    /**
     * Архивировать этап
     */
    public function archive(string $reason = ''): bool
    {
        return $this->update([
            'status' => self::STATUS_ARCHIVED,
            'completed_at' => now(),
            'notes' => $this->notes . "\nАрхивирован: " . $reason,
        ]);
    }

    /**
     * Вернуть в приложение
     */
    public function returnToApp(string $reason = ''): bool
    {
        return $this->update([
            'status' => self::STATUS_RETURNED,
            'completed_at' => now(),
            'notes' => $this->notes . "\nВозвращен в приложение: " . $reason,
        ]);
    }
}
