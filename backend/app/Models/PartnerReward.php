<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Orchid\Filters\Filterable;
use Orchid\Screen\AsSource;

class PartnerReward extends Model
{
    use HasFactory, AsSource, Filterable;

    protected $fillable = [
        'partner_id',
        'user_id',
        'order_id',
        'transaction_id',
        'reward_type',
        'base_amount',
        'reward_rate',
        'reward_amount',
        'status',
        'approved_at',
        'paid_at',
        'payment_method',
        'payment_details',
        'metadata',
        'notes',
    ];

    protected $casts = [
        'metadata' => 'array',
        'approved_at' => 'datetime',
        'paid_at' => 'datetime',
        'base_amount' => 'decimal:2',
        'reward_rate' => 'decimal:2',
        'reward_amount' => 'decimal:2',
    ];

    protected $allowedFilters = [
        'partner_id',
        'user_id',
        'reward_type',
        'status',
    ];

    protected $allowedSorts = [
        'id',
        'reward_amount',
        'created_at',
        'approved_at',
        'paid_at',
    ];

    // Константы статусов
    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_PAID = 'paid';
    public const STATUS_CANCELLED = 'cancelled';

    // Константы типов вознаграждений
    public const TYPE_REGISTRATION = 'registration';
    public const TYPE_FIRST_ORDER = 'first_order';
    public const TYPE_COMMISSION = 'commission';
    public const TYPE_TOP_UP = 'top_up';

    /**
     * Связь с партнером
     */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    /**
     * Связь с пользователем
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Связь с заказом
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Связь с транзакцией
     */
    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
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
     * Получить лейбл типа вознаграждения
     */
    public function getTypeLabel(): string
    {
        return match($this->reward_type) {
            self::TYPE_REGISTRATION => 'Регистрация',
            self::TYPE_FIRST_ORDER => 'Первый заказ',
            self::TYPE_COMMISSION => 'Комиссия',
            self::TYPE_TOP_UP => 'Пополнение',
            default => $this->reward_type,
        };
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
