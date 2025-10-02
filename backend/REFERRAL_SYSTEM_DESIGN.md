# Партнёрская программа - Техническое описание

## Обзор системы

Партнёрская программа позволяет исполнителям привлекать новых пользователей и получать кэшбэк с их пополнений кошелька. Система интегрируется с существующей архитектурой пользователей, кошелька и платежей.

## Архитектура

### 1. База данных

#### Таблица `referral_codes`
```sql
CREATE TABLE referral_codes (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(20) UNIQUE NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_code (code),
    INDEX idx_user_id (user_id)
);
```

#### Таблица `referrals`
```sql
CREATE TABLE referrals (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    referrer_id BIGINT UNSIGNED NOT NULL, -- кто пригласил
    referred_id BIGINT UNSIGNED NOT NULL, -- кого пригласили
    referral_code_id BIGINT UNSIGNED NOT NULL,
    status ENUM('pending', 'active', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (referral_code_id) REFERENCES referral_codes(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_referral (referrer_id, referred_id),
    INDEX idx_referrer (referrer_id),
    INDEX idx_referred (referred_id)
);
```

#### Таблица `referral_transactions`
```sql
CREATE TABLE referral_transactions (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    referral_id BIGINT UNSIGNED NOT NULL,
    referrer_id BIGINT UNSIGNED NOT NULL,
    referred_id BIGINT UNSIGNED NOT NULL,
    wallet_transaction_id BIGINT UNSIGNED NOT NULL, -- связь с пополнением
    cashback_amount BIGINT NOT NULL, -- сумма кэшбэка в центах
    cashback_percentage DECIMAL(5,2) NOT NULL, -- процент кэшбэка на момент операции
    status ENUM('pending', 'processed', 'cancelled') DEFAULT 'pending',
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE CASCADE,
    FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (wallet_transaction_id) REFERENCES wallet_transactions(id) ON DELETE CASCADE,
    
    INDEX idx_referrer (referrer_id),
    INDEX idx_referred (referred_id),
    INDEX idx_referral (referral_id)
);
```

#### Таблица `referral_settings`
```sql
CREATE TABLE referral_settings (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Начальные настройки
INSERT INTO referral_settings (key, value, description) VALUES
('cashback_percentage', '10.00', 'Процент кэшбэка с пополнений рефералов'),
('min_cashback_amount', '100', 'Минимальная сумма пополнения для кэшбэка (в центах)'),
('max_cashback_per_transaction', '10000', 'Максимальный кэшбэк за одну транзакцию (в центах)'),
('referral_active_days', '365', 'Количество дней, в течение которых действует реферальная связь');
```

#### Дополнительные поля в таблице `users`
```sql
ALTER TABLE users ADD COLUMN (
    referral_balance BIGINT DEFAULT 0 COMMENT 'Баланс реферальных бонусов в центах',
    total_referrals_count INT DEFAULT 0 COMMENT 'Общее количество рефералов',
    active_referrals_count INT DEFAULT 0 COMMENT 'Количество активных рефералов',
    total_referral_earnings BIGINT DEFAULT 0 COMMENT 'Общая сумма заработанных реферальных бонусов'
);
```

### 2. Модели Laravel

#### ReferralCode.php
```php
class ReferralCode extends Model
{
    protected $fillable = ['code', 'user_id', 'is_active'];
    
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    
    public function referrals(): HasMany
    {
        return $this->hasMany(Referral::class);
    }
    
    public static function generateUniqueCode(): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (self::where('code', $code)->exists());
        
        return $code;
    }
}
```

#### Referral.php
```php
class Referral extends Model
{
    protected $fillable = [
        'referrer_id', 'referred_id', 'referral_code_id', 'status'
    ];
    
    public function referrer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referrer_id');
    }
    
    public function referred(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_id');
    }
    
    public function referralCode(): BelongsTo
    {
        return $this->belongsTo(ReferralCode::class);
    }
    
    public function transactions(): HasMany
    {
        return $this->hasMany(ReferralTransaction::class);
    }
}
```

#### ReferralTransaction.php
```php
class ReferralTransaction extends Model
{
    protected $fillable = [
        'referral_id', 'referrer_id', 'referred_id', 'wallet_transaction_id',
        'cashback_amount', 'cashback_percentage', 'status', 'processed_at'
    ];
    
    protected $casts = [
        'processed_at' => 'datetime',
        'cashback_percentage' => 'decimal:2'
    ];
    
    public function referral(): BelongsTo
    {
        return $this->belongsTo(Referral::class);
    }
    
    public function walletTransaction(): BelongsTo
    {
        return $this->belongsTo(WalletTransaction::class);
    }
}
```

### 3. Сервисы

#### ReferralService.php
```php
class ReferralService
{
    public function createReferralCode(User $user): ReferralCode
    {
        return ReferralCode::firstOrCreate(
            ['user_id' => $user->id],
            ['code' => ReferralCode::generateUniqueCode()]
        );
    }
    
    public function processReferralRegistration(User $newUser, string $referralCode): ?Referral
    {
        $referralCodeModel = ReferralCode::where('code', $referralCode)
            ->where('is_active', true)
            ->first();
            
        if (!$referralCodeModel || $referralCodeModel->user_id === $newUser->id) {
            return null;
        }
        
        return Referral::create([
            'referrer_id' => $referralCodeModel->user_id,
            'referred_id' => $newUser->id,
            'referral_code_id' => $referralCodeModel->id,
            'status' => 'active'
        ]);
    }
    
    public function processCashback(WalletTransaction $walletTransaction): ?ReferralTransaction
    {
        if ($walletTransaction->type !== 'deposit') {
            return null;
        }
        
        $referral = Referral::where('referred_id', $walletTransaction->user_id)
            ->where('status', 'active')
            ->first();
            
        if (!$referral) {
            return null;
        }
        
        $settings = $this->getSettings();
        $cashbackAmount = $this->calculateCashback(
            $walletTransaction->amount, 
            $settings['cashback_percentage']
        );
        
        if ($cashbackAmount < $settings['min_cashback_amount']) {
            return null;
        }
        
        return DB::transaction(function () use ($referral, $walletTransaction, $cashbackAmount, $settings) {
            // Создаем транзакцию кэшбэка
            $referralTransaction = ReferralTransaction::create([
                'referral_id' => $referral->id,
                'referrer_id' => $referral->referrer_id,
                'referred_id' => $referral->referred_id,
                'wallet_transaction_id' => $walletTransaction->id,
                'cashback_amount' => $cashbackAmount,
                'cashback_percentage' => $settings['cashback_percentage'],
                'status' => 'processed',
                'processed_at' => now()
            ]);
            
            // Начисляем бонусы реферреру
            $referrer = $referral->referrer;
            $referrer->increment('referral_balance', $cashbackAmount);
            $referrer->increment('total_referral_earnings', $cashbackAmount);
            
            return $referralTransaction;
        });
    }
    
    private function calculateCashback(int $amount, float $percentage): int
    {
        $cashback = (int) ($amount * $percentage / 100);
        $maxCashback = (int) $this->getSettings()['max_cashback_per_transaction'];
        
        return min($cashback, $maxCashback);
    }
    
    public function getReferralStats(User $user): array
    {
        return [
            'referral_code' => $user->referralCode?->code,
            'total_referrals' => $user->total_referrals_count,
            'active_referrals' => $user->active_referrals_count,
            'referral_balance' => $user->referral_balance,
            'total_earnings' => $user->total_referral_earnings,
            'cashback_percentage' => $this->getSettings()['cashback_percentage']
        ];
    }
    
    public function useReferralBalance(User $user, int $amount): bool
    {
        if ($user->referral_balance < $amount) {
            return false;
        }
        
        $user->decrement('referral_balance', $amount);
        return true;
    }
}
```

### 4. API Endpoints

#### ReferralController.php
```php
// GET /api/referrals/my-stats - статистика рефералов
// GET /api/referrals/my-referrals - список рефералов
// POST /api/referrals/use-balance - использование реферального баланса
```

### 5. Интеграция с регистрацией

Модификация `RegistrationStartRequest`:
```php
$rules = [
    // ... existing rules
    'referral_code' => ['nullable', 'string', 'exists:referral_codes,code'],
];
```

Модификация `UserRegistrationService::end()`:
```php
// После создания пользователя
$user = User::updateOrCreate(/* ... */);

// Создаем реферальный код для нового пользователя
app(ReferralService::class)->createReferralCode($user);

// Обрабатываем реферальную регистрацию
if ($request->referral_code) {
    app(ReferralService::class)->processReferralRegistration($user, $request->referral_code);
}
```

### 6. Интеграция с кошельком

Модификация `WalletService::deposit()`:
```php
public function deposit(/* parameters */): WalletTransaction
{
    $transaction = DB::transaction(function () use (/* parameters */) {
        // ... existing logic
        
        $walletTransaction = WalletTransaction::create(/* ... */);
        $user->update(/* ... */);
        
        // Обрабатываем реферальный кэшбэк
        app(ReferralService::class)->processCashback($walletTransaction);
        
        return $walletTransaction;
    });
    
    return $transaction;
}
```

### 7. Админка

#### ReferralSettingsScreen.php
```php
class ReferralSettingsScreen extends Screen
{
    public function query(): iterable
    {
        return [
            'settings' => ReferralSetting::all()->pluck('value', 'key')
        ];
    }
    
    public function layout(): iterable
    {
        return [
            Layout::rows([
                Input::make('settings.cashback_percentage')
                    ->title('Процент кэшбэка (%)')
                    ->type('number')
                    ->step(0.01),
                    
                Input::make('settings.min_cashback_amount')
                    ->title('Минимальная сумма для кэшбэка (AED)')
                    ->type('number'),
                    
                // ... другие настройки
            ])
        ];
    }
}
```

#### ReferralListScreen.php - управление рефералами

### 8. Мобильное приложение

#### Экран Referrals
```javascript
// src/screens/Referrals.js
export default function Referrals({navigation}) {
    const [stats, setStats] = useState(null);
    const [referrals, setReferrals] = useState([]);
    
    // Отображение:
    // - Промокод пользователя
    // - Процент кэшбэка
    // - Статистика рефералов
    // - Баланс бонусов
    // - Список рефералов
}
```

#### Интеграция в регистрацию
```javascript
// Добавить поле referral_code в форму регистрации
// src/screens/Registration.js
```

#### Интеграция в кошелек
```javascript
// Добавить возможность использования реферального баланса
// src/screens/Wallet.js
```

## Этапы реализации

1. **База данных** - создание миграций и моделей
2. **Сервисы** - ReferralService и интеграция
3. **API** - контроллеры и маршруты
4. **Админка** - управление настройками и статистикой
5. **Мобильное приложение** - UI для рефералов
6. **Тестирование** - полный цикл партнёрской программы

## Безопасность

- Валидация промокодов
- Предотвращение самореферальства
- Лимиты на кэшбэк
- Аудит всех операций
- Защита от накрутки

## Метрики и аналитика

- Конверсия по промокодам
- Средний LTV рефералов
- Эффективность партнёрской программы
- Топ реферреры
