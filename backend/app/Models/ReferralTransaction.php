<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReferralTransaction extends Model
{
    protected $fillable = [
        'referral_id',
        'referrer_id',
        'referred_id',
        'wallet_transaction_id',
        'cashback_amount',
        'cashback_percentage',
        'status',
        'processed_at',
    ];

    protected $casts = [
        'cashback_percentage' => 'decimal:2',
        'processed_at' => 'datetime',
    ];

    /**
     * Реферальная связь
     */
    public function referral(): BelongsTo
    {
        return $this->belongsTo(Referral::class);
    }

    /**
     * Пользователь-реферрер (получатель кэшбэка)
     */
    public function referrer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referrer_id');
    }

    /**
     * Приглашённый пользователь (источник пополнения)
     */
    public function referred(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_id');
    }

    /**
     * Транзакция пополнения кошелька
     */
    public function walletTransaction(): BelongsTo
    {
        return $this->belongsTo(WalletTransaction::class);
    }

    /**
     * Обработать кэшбэк-транзакцию
     */
    public function process(): bool
    {
        if ($this->status !== 'pending') {
            return false;
        }

        // Начисляем бонусы реферреру
        $this->referrer->increment('referral_balance', $this->cashback_amount);
        $this->referrer->increment('total_referral_earnings', $this->cashback_amount);

        // Обновляем статус транзакции
        $this->update([
            'status' => 'processed',
            'processed_at' => now(),
        ]);

        return true;
    }

    /**
     * Отменить кэшбэк-транзакцию
     */
    public function cancel(): bool
    {
        if ($this->status === 'cancelled') {
            return false;
        }

        // Если транзакция была обработана, возвращаем средства
        if ($this->status === 'processed') {
            $this->referrer->decrement('referral_balance', $this->cashback_amount);
            $this->referrer->decrement('total_referral_earnings', $this->cashback_amount);
        }

        $this->update(['status' => 'cancelled']);

        return true;
    }

    /**
     * Получить сумму кэшбэка в AED
     */
    public function getCashbackAmountAedAttribute(): float
    {
        return $this->cashback_amount / 100;
    }
}
