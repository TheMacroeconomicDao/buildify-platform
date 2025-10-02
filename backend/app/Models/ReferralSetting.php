<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class ReferralSetting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'description',
    ];

    /**
     * Получить значение настройки
     */
    public static function get(string $key, $default = null)
    {
        return Cache::remember("referral_setting_{$key}", 3600, function () use ($key, $default) {
            $setting = self::where('key', $key)->first();
            return $setting ? $setting->value : $default;
        });
    }

    /**
     * Установить значение настройки
     */
    public static function set(string $key, $value, ?string $description = null): self
    {
        $setting = self::updateOrCreate(
            ['key' => $key],
            [
                'value' => $value,
                'description' => $description,
            ]
        );

        // Очищаем кеш
        Cache::forget("referral_setting_{$key}");

        return $setting;
    }

    /**
     * Получить все настройки как массив
     */
    public static function getAll(): array
    {
        return Cache::remember('referral_settings_all', 3600, function () {
            return self::all()->pluck('value', 'key')->toArray();
        });
    }

    /**
     * Получить процент кэшбэка
     */
    public static function getCashbackPercentage(): float
    {
        return (float) self::get('cashback_percentage', 10.0);
    }

    /**
     * Получить минимальную сумму для кэшбэка в центах
     */
    public static function getMinCashbackAmount(): int
    {
        return (int) self::get('min_cashback_amount', 100);
    }

    /**
     * Получить максимальный кэшбэк за транзакцию в центах
     */
    public static function getMaxCashbackPerTransaction(): int
    {
        return (int) self::get('max_cashback_per_transaction', 10000);
    }

    /**
     * Проверить, включена ли партнёрская программа
     */
    public static function isProgramEnabled(): bool
    {
        return self::get('program_enabled', 'true') === 'true';
    }

    /**
     * Получить количество дней действия реферальной связи
     */
    public static function getReferralActiveDays(): int
    {
        return (int) self::get('referral_active_days', 365);
    }

    /**
     * Очистить весь кеш настроек
     */
    public static function clearCache(): void
    {
        $settings = self::all();
        foreach ($settings as $setting) {
            Cache::forget("referral_setting_{$setting->key}");
        }
        Cache::forget('referral_settings_all');
    }
}
