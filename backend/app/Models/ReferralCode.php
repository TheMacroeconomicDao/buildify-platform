<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class ReferralCode extends Model
{
    protected $fillable = [
        'code',
        'user_id',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Пользователь-владелец промокода
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Рефералы, использовавшие этот промокод
     */
    public function referrals(): HasMany
    {
        return $this->hasMany(Referral::class);
    }

    /**
     * Генерация уникального промокода
     */
    public static function generateUniqueCode(): string
    {
        do {
            // Генерируем код из 8 символов (буквы и цифры)
            $code = strtoupper(Str::random(8));
            // Убираем похожие символы для избежания путаницы
            $code = str_replace(['0', 'O', '1', 'I'], ['9', 'P', '7', 'J'], $code);
        } while (self::where('code', $code)->exists());

        return $code;
    }

    /**
     * Создать промокод для пользователя
     */
    public static function createForUser(User $user): self
    {
        return self::firstOrCreate(
            ['user_id' => $user->id],
            [
                'code' => self::generateUniqueCode(),
                'is_active' => true
            ]
        );
    }

    /**
     * Найти активный промокод по коду
     */
    public static function findActiveByCode(string $code): ?self
    {
        return self::where('code', $code)
            ->where('is_active', true)
            ->first();
    }
}
