<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Orchid\Filters\Filterable;
use Orchid\Screen\AsSource;

class ScheduledNotification extends Model
{
    use HasFactory, AsSource, Filterable;

    protected $fillable = [
        'title',
        'message',
        'data',
        'target_type',
        'target_user_ids',
        'schedule_type',
        'scheduled_at',
        'schedule_config',
        'status',
        'sent_at',
        'sent_count',
        'failed_count',
        'error_message',
        'created_by',
    ];

    protected $casts = [
        'data' => 'array',
        'target_user_ids' => 'array',
        'schedule_config' => 'array',
        'scheduled_at' => 'datetime',
        'sent_at' => 'datetime',
    ];

    protected $allowedFilters = [
        'status',
        'target_type',
        'schedule_type',
        'created_by',
    ];

    protected $allowedSorts = [
        'id',
        'scheduled_at',
        'sent_at',
        'created_at',
    ];

    // Константы статусов
    public const STATUS_PENDING = 'pending';
    public const STATUS_SENT = 'sent';
    public const STATUS_FAILED = 'failed';
    public const STATUS_CANCELLED = 'cancelled';

    // Константы типов целевой аудитории
    public const TARGET_ALL = 'all';
    public const TARGET_CUSTOMERS = 'customers';
    public const TARGET_EXECUTORS = 'executors';
    public const TARGET_SPECIFIC = 'specific_users';

    // Константы типов расписания
    public const SCHEDULE_ONCE = 'once';
    public const SCHEDULE_DAILY = 'daily';
    public const SCHEDULE_WEEKLY = 'weekly';
    public const SCHEDULE_MONTHLY = 'monthly';

    /**
     * Связь с создателем уведомления
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Скоуп для готовых к отправке уведомлений
     */
    public function scopeReadyToSend($query)
    {
        return $query->where('status', self::STATUS_PENDING)
            ->where('scheduled_at', '<=', now());
    }

    /**
     * Скоуп для повторяющихся уведомлений
     */
    public function scopeRecurring($query)
    {
        return $query->whereIn('schedule_type', [
            self::SCHEDULE_DAILY,
            self::SCHEDULE_WEEKLY,
            self::SCHEDULE_MONTHLY
        ]);
    }

    /**
     * Проверить, готово ли уведомление к отправке
     */
    public function isReadyToSend(): bool
    {
        return $this->status === self::STATUS_PENDING && 
               $this->scheduled_at <= now();
    }

    /**
     * Отметить как отправленное
     */
    public function markAsSent(int $sentCount, int $failedCount = 0): void
    {
        $this->update([
            'status' => self::STATUS_SENT,
            'sent_at' => now(),
            'sent_count' => $sentCount,
            'failed_count' => $failedCount,
        ]);
    }

    /**
     * Отметить как неудачное
     */
    public function markAsFailed(string $errorMessage): void
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'error_message' => $errorMessage,
        ]);
    }
}
