<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Orchid\Filters\Filterable;
use Orchid\Screen\AsSource;

class ManagerReward extends Model
{
    use HasFactory, AsSource, Filterable;

    protected $fillable = [
        'manager_id',
        'partner_id',
        'partner_reward_id',
        'partner_earnings',
        'commission_rate',
        'commission_amount',
        'activity_bonus_rate',
        'activity_bonus_amount',
        'total_amount',
        'active_partners_count',
        'total_partners_volume',
        'activity_percentage',
        'status',
        'approved_at',
        'paid_at',
        'payment_method',
        'payment_details',
        'period_start',
        'period_end',
        'calculation_details',
        'notes',
    ];

    protected $casts = [
        'calculation_details' => 'array',
        'approved_at' => 'datetime',
        'paid_at' => 'datetime',
        'period_start' => 'date',
        'period_end' => 'date',
        'partner_earnings' => 'decimal:2',
        'commission_rate' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'activity_bonus_rate' => 'decimal:2',
        'activity_bonus_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'total_partners_volume' => 'decimal:2',
        'activity_percentage' => 'decimal:2',
    ];

    protected $allowedFilters = [
        'manager_id',
        'partner_id',
        'status',
        'period_start',
        'period_end',
    ];

    protected $allowedSorts = [
        'id',
        'total_amount',
        'created_at',
        'period_start',
    ];

    // Константы статусов
    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_PAID = 'paid';
    public const STATUS_CANCELLED = 'cancelled';

    /**
     * Связь с менеджером
     */
    public function manager(): BelongsTo
    {
        return $this->belongsTo(Manager::class);
    }

    /**
     * Связь с партнером
     */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    /**
     * Связь с вознаграждением партнера
     */
    public function partnerReward(): BelongsTo
    {
        return $this->belongsTo(PartnerReward::class);
    }

    /**
     * Скоуп для одобренных вознаграждений
     */
    public function scopeApproved($query)
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    /**
     * Скоуп для выплаченных вознаграждений
     */
    public function scopePaid($query)
    {
        return $query->where('status', self::STATUS_PAID);
    }

    /**
     * Скоуп для ожидающих одобрения
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Скоуп для периода
     */
    public function scopeForPeriod($query, $startDate, $endDate)
    {
        return $query->whereBetween('period_start', [$startDate, $endDate]);
    }

    /**
     * Получить лейбл статуса
     */
    public function getStatusLabel(): string
    {
        return match($this->status) {
            self::STATUS_PENDING => 'Ожидает одобрения',
            self::STATUS_APPROVED => 'Одобрено',
            self::STATUS_PAID => 'Выплачено',
            self::STATUS_CANCELLED => 'Отменено',
            default => $this->status,
        };
    }
}
