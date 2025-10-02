<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExecutorReview extends Model
{
    protected $table = 'executor_reviews';

    protected $fillable = [
        'order_id',
        'author_id',
        'customer_id',
        'executor_id',
        'quality_rating',
        'speed_rating',
        'communication_rating',
        'overall_rating',
        'comment',
        'rating',
        'text',
    ];

    protected $casts = [
        'quality_rating' => 'integer',
        'speed_rating' => 'integer',
        'communication_rating' => 'integer',
        'overall_rating' => 'integer',
    ];

    public function executor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'executor_id', 'id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id', 'id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id', 'id');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id', 'id');
    }

    /**
     * Ответы на этот отзыв
     */
    public function replies(): HasMany
    {
        return $this->hasMany(ReviewReply::class, 'review_id')
            ->where('review_type', 'executor_review')
            ->orderBy('created_at', 'asc');
    }

    /**
     * Пересчитать рейтинг исполнителя после добавления отзыва
     */
    public static function recalculateExecutorRating($executorId): void
    {
        $stats = self::where('executor_id', $executorId)
            ->whereNotNull('rating')
            ->selectRaw('
                COUNT(*) as reviews_count,
                AVG(rating) as avg_rating,
                COUNT(DISTINCT order_id) as orders_count
            ')
            ->first();

        $user = User::find($executorId);
        if ($user) {
            $user->update([
                'executor_orders_count' => $stats->orders_count ?? 0,
                'executor_rating' => round($stats->avg_rating ?? 0, 2),
                'executor_reviews_count' => $stats->reviews_count ?? 0,
                // Также обновляем общий рейтинг
                'average_rating' => round($stats->avg_rating ?? 0, 2),
                'reviews_count' => $stats->reviews_count ?? 0,
            ]);
        }
    }
}
