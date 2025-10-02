<?php

namespace App\Models;

use App\Enums\Users\Type;
use App\Observers\UserObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;
use Laravel\Cashier\Billable;
use Laravel\Sanctum\HasApiTokens;
use Orchid\Filters\Types\Like;
use Orchid\Filters\Types\Where;
use Orchid\Filters\Types\WhereDateStartEnd;
use Orchid\Platform\Models\User as Authenticatable;
use Orchid\Support\Facades\Dashboard;
use Throwable;

#[ObservedBy([UserObserver::class])]
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, Billable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar',
        'status',
        'phone',
        'telegram',
        'whatsApp',
        'facebook',
        'viber',
        'license_file_path',
        'verification_status',
        'verification_comment',
        'verified_at',
        'type',
        'about_me',
        'instagram_url',
        'birth_date',
        'work_experience',
        'average_rating',
        'reviews_count',
        'wallet_balance',
        'wallet_currency',
        'customer_orders_count',
        'customer_rating',
        'customer_reviews_count',
        'executor_orders_count',
        'executor_rating',
        'executor_reviews_count',
        'mediator_margin_percentage',
        'mediator_fixed_fee',
        'mediator_agreed_price',
        'next_tariff_id',
        'next_subscription_starts_at',
        'next_subscription_ends_at',
        'used_orders_count',
        'used_contacts_count',
        'mediator_notes',
        'current_tariff_id',
        'subscription_started_at',
        'subscription_ends_at',
        'referral_balance',
        'total_referrals_count',
        'active_referrals_count',
        'total_referral_earnings',
        'push_token',
        'push_settings',
        'push_token_updated_at',
        'partner_id',
        'referred_at',
        'referral_source',
        'referral_metadata',
    ];

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
        'password',
        'remember_token',
        'permissions',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'permissions' => 'array',
        'email_verified_at' => 'datetime',
        'verified_at' => 'datetime',
        'subscription_started_at' => 'datetime',
        'subscription_ends_at' => 'datetime',
        'next_subscription_starts_at' => 'datetime',
        'next_subscription_ends_at' => 'datetime',
        'push_settings' => 'array',
        'push_token_updated_at' => 'datetime',
        'referred_at' => 'datetime',
        'referral_metadata' => 'array',
    ];

    /**
     * The attributes for which you can use filters in url.
     *
     * @var array
     */
    protected $allowedFilters = [
        'id' => Where::class,
        'name' => Like::class,
        'email' => Like::class,
        'type' => Where::class,
        'status' => Where::class,
        'verification_status' => Where::class,
        'search' => Like::class,
        'updated_at' => WhereDateStartEnd::class,
        'created_at' => WhereDateStartEnd::class,
    ];

    /**
     * The attributes for which can use sort in url.
     *
     * @var array
     */
    protected $allowedSorts = [
        'id',
        'name',
        'email',
        'updated_at',
        'created_at',
    ];

    public function customerOrders(): HasMany
    {
        return $this->hasMany(Order::class, 'author_id', 'id');
    }

    public function executorPortfolios(): HasMany
    {
        return $this->hasMany(ExecutorPortfolio::class, 'user_id', 'id');
    }

    public function executorReviews(): HasMany
    {
        return $this->hasMany(ExecutorReview::class, 'executor_id', 'id');
    }

    public function executorOrders(): HasMany
    {
        return $this->hasMany(Order::class, 'executor_id', 'id');
    }

    public function executorResponses(): HasMany
    {
        return $this->hasMany(OrderResponse::class, 'executor_id', 'id');
    }

    public function works(): HasMany
    {
        return $this->hasMany(UserWork::class, 'user_id', 'id');
    }

    /**
     * Связь с текущим тарифом пользователя
     */
    public function currentTariffRelation()
    {
        return $this->belongsTo(Tariff::class, 'current_tariff_id');
    }

    /**
     * Жалобы, которые подал пользователь
     */
    public function sentComplaints(): HasMany
    {
        return $this->hasMany(Complaint::class, 'complainant_id', 'id');
    }

    /**
     * Жалобы, которые поданы на пользователя
     */
    public function receivedComplaints(): HasMany
    {
        return $this->hasMany(Complaint::class, 'reported_user_id', 'id');
    }

    /**
     * Отзывы о заказчике (отзывы, которые оставили о данном пользователе как о заказчике)
     */
    public function customerReviews(): HasMany
    {
        return $this->hasMany(CustomerReview::class, 'customer_id', 'id');
    }

    /**
     * Отзывы, которые оставил данный пользователь как исполнитель о заказчиках
     */
    public function writtenCustomerReviews(): HasMany
    {
        return $this->hasMany(CustomerReview::class, 'executor_id', 'id');
    }

    /**
     * Отзывы, которые оставил данный пользователь как заказчик об исполнителях
     */
    public function writtenExecutorReviews(): HasMany
    {
        return $this->hasMany(ExecutorReview::class, 'author_id', 'id');
    }

    /**
     * Пересчитать рейтинг исполнителя на основе всех отзывов
     */
    public function recalculateRating(): void
    {
        $reviews = $this->executorReviews();
        $reviewsCount = $reviews->count();
        $averageRating = $reviewsCount > 0 ? $reviews->avg('rating') : null;

        $this->updateQuietly([
            'average_rating' => $averageRating ? round($averageRating, 2) : null,
            'reviews_count' => $reviewsCount,
        ]);
    }

    /**
     * Пересчитать рейтинг заказчика на основе всех отзывов
     */
    public function recalculateCustomerRating(): void
    {
        $stats = $this->customerReviews()
            ->selectRaw('
                COUNT(*) as reviews_count,
                AVG(rating) as avg_rating,
                COUNT(DISTINCT order_id) as orders_count
            ')
            ->first();

        $this->update([
            'customer_orders_count' => $stats->orders_count ?? 0,
            'customer_rating' => round($stats->avg_rating ?? 0, 2),
            'customer_reviews_count' => $stats->reviews_count ?? 0,
        ]);
    }

    /**
     * Пересчитать общий рейтинг на основе рейтингов исполнителя и заказчика
     */
    public function recalculateOverallRating(): void
    {
        $executorRating = $this->executor_rating ?? 0;
        $customerRating = $this->customer_rating ?? 0;
        $executorReviews = $this->executor_reviews_count ?? 0;
        $customerReviews = $this->customer_reviews_count ?? 0;

        $totalReviews = $executorReviews + $customerReviews;
        
        if ($totalReviews > 0) {
            $weightedRating = (($executorRating * $executorReviews) + ($customerRating * $customerReviews)) / $totalReviews;
            $this->updateQuietly([
                'average_rating' => round($weightedRating, 2),
                'reviews_count' => $totalReviews,
            ]);
        } else {
            $this->updateQuietly([
                'average_rating' => null,
                'reviews_count' => 0,
            ]);
        }
    }

    public function getContactDataAttribute(): array
    {
        return [
            'email' => $this->email,
            'phone' => $this->phone,
            'telegram' => $this->telegram,
            'whatsApp' => $this->whatsApp,
            'facebook' => $this->facebook,
            'viber' => $this->viber,
        ];
    }

    /**
     * for orchid
     *
     * @return string
     */
    public function getSearchStringAttribute(): string
    {
        return $this->attributes['id'] . ' | ' . ($this->attributes['email'] ?? 'Email N/A') . ' | ' . ($this->attributes['phone'] ?? 'Phone N/A');
    }

    /**
     * Throw an exception if email already exists, create admin user.
     *
     * @throws Throwable
     */
    public static function createAdmin(string $name, string $email, string $password): void
    {
        throw_if(static::where('email', $email)->exists(), 'User exists');

        static::create([
            'name' => $name,
            'email' => $email,
            'type' => Type::Admin->value,
            'password' => Hash::make($password),
            'permissions' => Dashboard::getAllowAllPermission(),
        ]);
    }

    public function currentTariff(): ?Tariff
    {
        // Сначала проверяем, есть ли назначенный тариф и активна ли подписка
        if ($this->current_tariff_id) {
            $tariff = $this->currentTariffRelation;
            
            // Если это платный тариф, проверяем не истекла ли подписка
            if ($tariff && $tariff->price > 0) {
                if ($this->subscription_ends_at && $this->subscription_ends_at->isPast()) {
                    // Подписка истекла, переводим на Free тариф
                    $freeTariff = Tariff::where('name', 'Free')->first();
                    if ($freeTariff) {
                        $this->update(['current_tariff_id' => $freeTariff->id]);
                        return $freeTariff;
                    }
                }
            }
            
            return $tariff;
        }

        // Если есть активная Stripe подписка, возвращаем соответствующий тариф
        if ($this->subscribed()) {
            $subscription = $this->subscription();
            $tariff = Tariff::where('stripe_price_id', $subscription->stripe_price)->first();
            if ($tariff) {
                return $tariff;
            }
        }

        // По умолчанию возвращаем бесплатный тариф
        return Tariff::where('name', 'Free')->first();
    }

    /**
     * Проверяет, активна ли подписка пользователя
     */
    public function hasActiveSubscription(): bool
    {
        // Если подписка бесплатная (Free), она всегда активна
        $currentTariff = $this->currentTariff();
        if (!$currentTariff || $currentTariff->name === 'Free' || $currentTariff->price == 0) {
            return true;
        }

        // Для платных подписок проверяем дату окончания
        return $this->subscription_ends_at && $this->subscription_ends_at->isFuture();
    }

    /**
     * Проверяет, может ли пользователь выполнять платные действия (откликаться на заказы и т.д.)
     */
    public function hasActivePaidSubscription(): bool
    {
        $currentTariff = $this->currentTariff();
        
        // Free тариф не позволяет выполнять платные действия
        if (!$currentTariff || $currentTariff->name === 'Free') {
            return false;
        }
        
        // Специальные бесплатные тарифы (Trial Plus, промо-тарифы) разрешены
        $allowedFreeTariffs = ['Trial Plus', 'Black Friday', 'New Year Special'];
        $isTestTariff = stripos($currentTariff->name, 'test') !== false;
        $isAllowedFreeTariff = in_array($currentTariff->name, $allowedFreeTariffs);
        
        // Если это не тестовый тариф, не разрешенный бесплатный тариф и цена 0, то блокируем
        if (!$isTestTariff && !$isAllowedFreeTariff && $currentTariff->price == 0) {
            return false;
        }

        // Для платных, тестовых и разрешенных бесплатных подписок проверяем дату окончания
        return $this->subscription_ends_at && $this->subscription_ends_at->isFuture();
    }

    /**
     * Активирует подписку на указанный тариф
     */
    public function activateSubscription(Tariff $tariff): void
    {
        $now = now();

        // Проверяем есть ли активная платная подписка с датой окончания в будущем
        $hasActivePaidSubscription = $this->subscription_ends_at && 
                                     $this->subscription_ends_at->isFuture() && 
                                     $this->current_tariff_id;

        if ($hasActivePaidSubscription) {
            // Сохраняем новую подписку как "следующую"
            $nextStartsAt = $this->subscription_ends_at;
            $nextEndsAt = null;
            
            if ($tariff->name !== 'Free' && $tariff->duration_days > 0) {
                $nextEndsAt = $nextStartsAt->copy()->addDays($tariff->duration_days);
            }
            
            $this->update([
                'next_tariff_id' => $tariff->id,
                'next_subscription_starts_at' => $nextStartsAt,
                'next_subscription_ends_at' => $nextEndsAt,
            ]);
        } else {
            // Нет активной подписки - активируем сразу
            $endsAt = null;
            if ($tariff->name !== 'Free' && $tariff->duration_days > 0) {
                $endsAt = $now->copy()->addDays($tariff->duration_days);
            }

            $this->update([
                'current_tariff_id' => $tariff->id,
                'subscription_started_at' => $now,
                'subscription_ends_at' => $endsAt,
                // Очищаем поля следующей подписки
                'next_tariff_id' => null,
                'next_subscription_starts_at' => null,
                'next_subscription_ends_at' => null,
                // Сбрасываем счетчики использования
                'used_orders_count' => 0,
                'used_contacts_count' => 0,
            ]);
        }
    }

    /**
     * Получает количество дней до окончания подписки
     */
    public function getDaysUntilSubscriptionExpires(): ?int
    {
        if (!$this->subscription_ends_at) {
            return null; // Бесплатная или бессрочная подписка
        }

        $diff = now()->diffInDays($this->subscription_ends_at, false);
        return (int) round($diff);
    }

    /**
     * Проверяет и активирует следующую подписку если текущая истекла
     */
    public function checkAndActivateNextSubscription(): bool
    {
        // Проверяем, есть ли следующая подписка и истекла ли текущая
        if ($this->next_tariff_id && 
            $this->next_subscription_starts_at && 
            $this->next_subscription_starts_at->isPast()) {
            
            $nextTariff = Tariff::find($this->next_tariff_id);
            if ($nextTariff) {
                // Активируем следующую подписку
                $this->update([
                    'current_tariff_id' => $this->next_tariff_id,
                    'subscription_started_at' => $this->next_subscription_starts_at,
                    'subscription_ends_at' => $this->next_subscription_ends_at,
                    // Очищаем поля следующей подписки
                    'next_tariff_id' => null,
                    'next_subscription_starts_at' => null,
                    'next_subscription_ends_at' => null,
                    // Сбрасываем счетчики использования для нового периода
                    'used_orders_count' => 0,
                    'used_contacts_count' => 0,
                ]);
                
                return true;
            }
        }
        
        return false;
    }

    /**
     * Получить настроенную маржу посредника
     */
    public function getMediatorMarginInfo(): array
    {
        if ($this->type !== Type::Mediator->value) {
            return [];
        }

        $marginInfo = [];
        
        if ($this->mediator_margin_percentage) {
            $marginInfo['percentage'] = $this->mediator_margin_percentage;
        }
        
        if ($this->mediator_fixed_fee) {
            $marginInfo['fixed_fee'] = $this->mediator_fixed_fee;
        }
        
        if ($this->mediator_agreed_price) {
            $marginInfo['agreed_price'] = $this->mediator_agreed_price;
        }

        return $marginInfo;
    }

    /**
     * Рассчитать комиссию посредника для заказа
     */
    public function calculateMediatorCommission(float $orderAmount): float
    {
        if ($this->type !== Type::Mediator->value) {
            return 0;
        }

        // Приоритет: договорная цена > фиксированная комиссия > процент
        if ($this->mediator_agreed_price) {
            return (float) $this->mediator_agreed_price;
        }

        if ($this->mediator_fixed_fee) {
            return (float) $this->mediator_fixed_fee;
        }

        if ($this->mediator_margin_percentage) {
            return $orderAmount * ((float) $this->mediator_margin_percentage / 100);
        }

        return 0;
    }

    // ===== REFERRAL SYSTEM RELATIONS =====

    /**
     * Промокод пользователя
     */
    public function referralCode(): HasOne
    {
        return $this->hasOne(ReferralCode::class);
    }

    /**
     * Рефералы, которых пригласил этот пользователь
     */
    public function referrals(): HasMany
    {
        return $this->hasMany(Referral::class, 'referrer_id');
    }

    /**
     * Реферальная связь, если этот пользователь был приглашён
     */
    public function referredBy(): HasOne
    {
        return $this->hasOne(Referral::class, 'referred_id');
    }

    /**
     * Транзакции кэшбэка, полученные как реферрер
     */
    public function referralEarnings(): HasMany
    {
        return $this->hasMany(ReferralTransaction::class, 'referrer_id');
    }

    /**
     * Транзакции кэшбэка, созданные как реферал
     */
    public function referralContributions(): HasMany
    {
        return $this->hasMany(ReferralTransaction::class, 'referred_id');
    }

    // ===== REFERRAL SYSTEM METHODS =====

    /**
     * Получить или создать промокод пользователя
     */
    public function getOrCreateReferralCode(): ReferralCode
    {
        return $this->referralCode ?: ReferralCode::createForUser($this);
    }

    /**
     * Получить реферальный баланс в AED
     */
    public function getReferralBalanceAedAttribute(): float
    {
        return ($this->referral_balance ?? 0) / 100;
    }

    /**
     * Получить общий заработок по рефералам в AED
     */
    public function getTotalReferralEarningsAedAttribute(): float
    {
        return ($this->total_referral_earnings ?? 0) / 100;
    }

    /**
     * Проверить, достаточно ли реферального баланса
     */
    public function hasReferralBalance(int $amountCents): bool
    {
        return ($this->referral_balance ?? 0) >= $amountCents;
    }

    /**
     * Использовать реферальный баланс
     */
    public function useReferralBalance(int $amountCents): bool
    {
        if (!$this->hasReferralBalance($amountCents)) {
            return false;
        }

        $this->decrement('referral_balance', $amountCents);
        return true;
    }

    /**
     * Связь с партнером, который привлек пользователя
     */
    public function referringPartner()
    {
        return $this->belongsTo(Partner::class, 'partner_id', 'partner_id');
    }

    /**
     * Проверить, был ли пользователь привлечен через партнерскую программу
     */
    public function isReferred(): bool
    {
        return !empty($this->partner_id);
    }

    /**
     * Получить информацию о привлечении
     */
    public function getReferralInfo(): ?array
    {
        if (!$this->isReferred()) {
            return null;
        }

        return [
            'partner_id' => $this->partner_id,
            'referred_at' => $this->referred_at,
            'source' => $this->referral_source,
            'metadata' => $this->referral_metadata,
            'partner' => $this->referringPartner,
        ];
    }
}
