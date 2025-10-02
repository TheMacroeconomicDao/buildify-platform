<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Orchid\Filters\Filterable;
use Orchid\Screen\AsSource;

class Manager extends Model
{
    use HasFactory, AsSource, Filterable;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'description',
        'user_id',
        'base_commission',
        'tier2_threshold',
        'tier2_commission',
        'tier3_threshold',
        'tier3_commission',
        'activity_bonus',
        'activity_threshold',
        'total_partners',
        'active_partners',
        'total_partners_earnings',
        'total_commission_earned',
        'paid_commission',
        'pending_commission',
        'is_active',
        'last_activity_at',
        'settings',
    ];

    protected $casts = [
        'settings' => 'array',
        'is_active' => 'boolean',
        'last_activity_at' => 'datetime',
        'base_commission' => 'decimal:2',
        'tier2_threshold' => 'decimal:2',
        'tier2_commission' => 'decimal:2',
        'tier3_threshold' => 'decimal:2',
        'tier3_commission' => 'decimal:2',
        'activity_bonus' => 'decimal:2',
        'activity_threshold' => 'decimal:2',
        'total_partners_earnings' => 'decimal:2',
        'total_commission_earned' => 'decimal:2',
        'paid_commission' => 'decimal:2',
        'pending_commission' => 'decimal:2',
    ];

    protected $allowedFilters = [
        'name',
        'email',
        'is_active',
    ];

    protected $allowedSorts = [
        'id',
        'name',
        'total_commission_earned',
        'total_partners',
        'created_at',
    ];

    /**
     * Связь с пользователем системы
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Партнеры менеджера
     */
    public function partners(): HasMany
    {
        return $this->hasMany(Partner::class);
    }

    /**
     * Активные партнеры
     */
    public function activePartners(): HasMany
    {
        return $this->partners()->where('is_active', true);
    }

    /**
     * Вознаграждения менеджера
     */
    public function rewards(): HasMany
    {
        return $this->hasMany(ManagerReward::class);
    }

    /**
     * Рассчитать комиссию менеджера
     */
    public function calculateCommission(float $partnerEarnings): array
    {
        $totalVolume = $this->total_partners_earnings;
        
        // Определяем ставку по прогрессивной шкале
        $rate = $this->base_commission;
        
        if ($totalVolume >= $this->tier3_threshold) {
            $rate = $this->tier3_commission;
        } elseif ($totalVolume >= $this->tier2_threshold) {
            $rate = $this->tier2_commission;
        }
        
        // Рассчитываем базовую комиссию
        $baseCommission = $partnerEarnings * ($rate / 100);
        
        // Проверяем бонус за активность
        $activityRate = $this->getActivityRate();
        $activityBonus = 0;
        
        if ($activityRate >= $this->activity_threshold) {
            $activityBonus = $baseCommission * ($this->activity_bonus / 100);
        }
        
        return [
            'base_rate' => $rate,
            'base_commission' => $baseCommission,
            'activity_rate' => $activityRate,
            'activity_bonus_rate' => $activityRate >= $this->activity_threshold ? $this->activity_bonus : 0,
            'activity_bonus' => $activityBonus,
            'total_commission' => $baseCommission + $activityBonus,
        ];
    }

    /**
     * Получить процент активности партнеров
     */
    public function getActivityRate(): float
    {
        if ($this->total_partners === 0) {
            return 0;
        }

        return ($this->active_partners / $this->total_partners) * 100;
    }

    /**
     * Обновить статистику менеджера
     */
    public function updateStats(): void
    {
        $partners = $this->partners()->get();
        
        $this->update([
            'total_partners' => $partners->count(),
            'active_partners' => $partners->where('is_active', true)->count(),
            'total_partners_earnings' => $partners->sum('total_earnings'),
            'total_commission_earned' => $this->rewards()->sum('total_amount'),
            'paid_commission' => $this->rewards()->where('status', 'paid')->sum('total_amount'),
            'pending_commission' => $this->rewards()->where('status', 'approved')->sum('total_amount'),
            'last_activity_at' => now(),
        ]);
    }

    /**
     * Скоуп для активных менеджеров
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
