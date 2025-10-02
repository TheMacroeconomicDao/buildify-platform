<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CustomerReview extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'customer_id',
        'executor_id',
        'rating',
        'comment',
    ];

    protected $casts = [
        'rating' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Заказ, по которому оставлен отзыв
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Заказчик, о котором оставлен отзыв
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    /**
     * Исполнитель, который оставил отзыв
     */
    public function executor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'executor_id');
    }

    /**
     * Ответы на этот отзыв
     */
    public function replies(): HasMany
    {
        return $this->hasMany(ReviewReply::class, 'review_id')
            ->where('review_type', 'customer_review')
            ->orderBy('created_at', 'asc');
    }

    /**
     * Проверка валидности рейтинга
     */
    public function setRatingAttribute($value)
    {
        if ($value < 1 || $value > 5) {
            throw new \InvalidArgumentException('Rating must be between 1 and 5');
        }
        $this->attributes['rating'] = $value;
    }

    /**
     * Пересчитать рейтинг заказчика после добавления отзыва
     */
    public static function recalculateCustomerRating($customerId): void
    {
        $stats = self::where('customer_id', $customerId)
            ->whereNotNull('rating')
            ->selectRaw('
                COUNT(*) as reviews_count,
                AVG(rating) as avg_rating,
                COUNT(DISTINCT order_id) as orders_count
            ')
            ->first();

        $user = User::find($customerId);
        if ($user) {
            $user->update([
                'customer_orders_count' => $stats->orders_count ?? 0,
                'customer_rating' => round($stats->avg_rating ?? 0, 2),
                'customer_reviews_count' => $stats->reviews_count ?? 0,
            ]);

            // Также обновляем общий рейтинг, учитывая и рейтинг исполнителя
            $user->recalculateOverallRating();
        }
    }
}