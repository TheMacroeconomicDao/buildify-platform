<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Partner Program Configuration
    |--------------------------------------------------------------------------
    |
    | Настройки партнерской программы Buildify
    |
    */

    // Вознаграждения партнеров
    'default_reward_rate' => env('PARTNER_DEFAULT_REWARD_RATE', 5.00), // 5%
    'registration_bonus' => env('PARTNER_REGISTRATION_BONUS', 50.00), // 50 AED за регистрацию
    'min_payout' => env('PARTNER_MIN_PAYOUT', 100.00), // Минимальная сумма для вывода
    'executor_balance_bonus' => env('PARTNER_EXECUTOR_BONUS', 10.00), // +10% при выводе на баланс исполнителя

    // Комиссия платформы (для расчета вознаграждений)
    'platform_commission_rate' => env('PLATFORM_COMMISSION_RATE', 10.00), // 10% комиссия платформы

    // Менеджеры партнерских программ
    'manager_base_rate' => env('MANAGER_BASE_RATE', 10.00), // 10%
    'manager_tier2_threshold' => env('MANAGER_TIER2_THRESHOLD', 40000.00), // 40k AED
    'manager_tier2_rate' => env('MANAGER_TIER2_RATE', 15.00), // 15%
    'manager_tier3_threshold' => env('MANAGER_TIER3_THRESHOLD', 120000.00), // 120k AED  
    'manager_tier3_rate' => env('MANAGER_TIER3_RATE', 20.00), // 20%
    'manager_activity_bonus' => env('MANAGER_ACTIVITY_BONUS', 5.00), // +5% бонус
    'manager_activity_threshold' => env('MANAGER_ACTIVITY_THRESHOLD', 70.00), // Порог активности 70%

    // Ссылки
    'app_store_url' => env('IOS_APP_STORE_URL', 'https://apps.apple.com/app/buildlify'),
    'google_play_url' => env('ANDROID_PLAY_STORE_URL', 'https://play.google.com/store/apps/details?id=com.buildlify'),
    'deep_link_scheme' => env('DEEP_LINK_SCHEME', 'buildlify'),

    // Защита от накрутки
    'fraud_detection_enabled' => env('PARTNER_FRAUD_DETECTION', true),
    'max_registrations_per_ip' => env('PARTNER_MAX_REGISTRATIONS_PER_IP', 5), // Максимум регистраций с одного IP
    'suspicious_activity_threshold' => env('PARTNER_SUSPICIOUS_THRESHOLD', 10), // Порог подозрительной активности

    // Аналитика
    'analytics_retention_days' => env('PARTNER_ANALYTICS_RETENTION', 365), // Хранить аналитику 1 год
];
