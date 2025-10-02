<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Orchid\Filters\Filterable;
use Orchid\Screen\AsSource;

class Partner extends Model
{
    use HasFactory, AsSource, Filterable;

    protected $fillable = [
        'partner_id',
        'name',
        'email',
        'phone',
        'description',
        'manager_id',
        'user_id',
        'reward_type',
        'reward_value',
        'min_payout',
        'custom_conditions',
        'total_referrals',
        'active_referrals',
        'total_earnings',
        'paid_earnings',
        'pending_earnings',
        'is_active',
        'auto_approve',
        'last_activity_at',
        'metadata',
        'source',
    ];

    protected $casts = [
        'custom_conditions' => 'array',
        'metadata' => 'array',
        'is_active' => 'boolean',
        'auto_approve' => 'boolean',
        'last_activity_at' => 'datetime',
        'total_earnings' => 'decimal:2',
        'paid_earnings' => 'decimal:2',
        'pending_earnings' => 'decimal:2',
        'reward_value' => 'decimal:2',
        'min_payout' => 'decimal:2',
    ];

    protected $allowedFilters = [
        'partner_id',
        'name',
        'email',
        'manager_id',
        'is_active',
        'reward_type',
    ];

    protected $allowedSorts = [
        'id',
        'name',
        'total_earnings',
        'total_referrals',
        'created_at',
        'last_activity_at',
    ];

    // Константы
    public const REWARD_TYPE_FIXED = 'fixed';
    public const REWARD_TYPE_PERCENTAGE = 'percentage';

    /**
     * Связь с менеджером
     */
    public function manager(): BelongsTo
    {
        return $this->belongsTo(Manager::class);
    }

    /**
     * Связь с пользователем (если партнер = исполнитель)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Привлеченные пользователи
     */
    public function referredUsers(): HasMany
    {
        return $this->hasMany(User::class, 'partner_id', 'partner_id');
    }

    /**
     * Активные привлеченные пользователи
     */
    public function activeReferredUsers(): HasMany
    {
        return $this->referredUsers()
            ->where('created_at', '>=', now()->subDays(30))
            ->whereHas('orders'); // Есть заказы
    }

    /**
     * Вознаграждения партнера
     */
    public function rewards(): HasMany
    {
        return $this->hasMany(PartnerReward::class);
    }

    /**
     * Одобренные вознаграждения
     */
    public function approvedRewards(): HasMany
    {
        return $this->rewards()->where('status', 'approved');
    }

    /**
     * Выплаченные вознаграждения
     */
    public function paidRewards(): HasMany
    {
        return $this->rewards()->where('status', 'paid');
    }

    /**
     * Генерация уникального partner_id
     */
    public static function generatePartnerId(): string
    {
        do {
            $partnerId = 'P' . strtoupper(Str::random(8));
        } while (self::where('partner_id', $partnerId)->exists());

        return $partnerId;
    }

    /**
     * Получить реферальную ссылку
     */
    public function getReferralLink(): string
    {
        return config('app.url') . '/ref/' . $this->partner_id;
    }

    /**
     * Получить ссылку для мобильного приложения
     */
    public function getMobileReferralLink(): string
    {
        return "https://buildify.ae/ref/{$this->partner_id}";
    }

    /**
     * Рассчитать вознаграждение
     */
    public function calculateReward(float $baseAmount): float
    {
        if ($this->reward_type === self::REWARD_TYPE_FIXED) {
            return $this->reward_value;
        }

        return $baseAmount * ($this->reward_value / 100);
    }

    /**
     * Обновить статистику
     */
    public function updateStats(): void
    {
        $this->update([
            'total_referrals' => $this->referredUsers()->count(),
            'active_referrals' => $this->activeReferredUsers()->count(),
            'total_earnings' => $this->rewards()->sum('reward_amount'),
            'paid_earnings' => $this->paidRewards()->sum('reward_amount'),
            'pending_earnings' => $this->approvedRewards()->sum('reward_amount'),
            'last_activity_at' => now(),
        ]);
    }

    /**
     * Проверить, можно ли вывести средства
     */
    public function canWithdraw(): bool
    {
        return $this->is_active && 
               $this->pending_earnings >= $this->min_payout;
    }

    /**
     * Скоуп для активных партнеров
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Скоуп для партнеров менеджера
     */
    public function scopeForManager($query, $managerId)
    {
        return $query->where('manager_id', $managerId);
    }
}
