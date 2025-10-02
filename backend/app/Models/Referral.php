<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Referral extends Model
{
    protected $fillable = [
        'referrer_id',
        'referred_id',
        'referral_code_id',
        'status',
    ];

    /**
     * Пользователь-реферрер (тот, кто пригласил)
     */
    public function referrer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referrer_id');
    }

    /**
     * Приглашённый пользователь (реферал)
     */
    public function referred(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_id');
    }

    /**
     * Использованный промокод
     */
    public function referralCode(): BelongsTo
    {
        return $this->belongsTo(ReferralCode::class);
    }

    /**
     * Транзакции кэшбэка по этому рефералу
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(ReferralTransaction::class);
    }

    /**
     * Активировать реферальную связь
     */
    public function activate(): bool
    {
        if ($this->status !== 'pending') {
            return false;
        }

        $this->update(['status' => 'active']);
        
        // Увеличиваем счётчик активных рефералов у реферрера
        $this->referrer->increment('active_referrals_count');
        
        return true;
    }

    /**
     * Отменить реферальную связь
     */
    public function cancel(): bool
    {
        if ($this->status !== 'active') {
            return false;
        }

        $this->update(['status' => 'cancelled']);
        
        // Уменьшаем счётчик активных рефералов у реферрера
        $this->referrer->decrement('active_referrals_count');
        
        return true;
    }

    /**
     * Проверить, активна ли реферальная связь
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
