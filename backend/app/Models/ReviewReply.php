<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ReviewReply extends Model
{
    protected $fillable = [
        'review_type',
        'review_id', 
        'author_id',
        'reply_text',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Автор ответа
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /**
     * Получить отзыв исполнителя
     */
    public function executorReview(): BelongsTo
    {
        return $this->belongsTo(ExecutorReview::class, 'review_id');
    }

    /**
     * Получить отзыв заказчика
     */
    public function customerReview(): BelongsTo
    {
        return $this->belongsTo(CustomerReview::class, 'review_id');
    }

    /**
     * Получить связанный отзыв (полиморфная связь)
     */
    public function getReviewAttribute()
    {
        if ($this->review_type === 'executor_review') {
            return $this->executorReview;
        } elseif ($this->review_type === 'customer_review') {
            return $this->customerReview;
        }
        
        return null;
    }

    /**
     * Скоуп для ответов на отзывы исполнителей
     */
    public function scopeForExecutorReviews($query)
    {
        return $query->where('review_type', 'executor_review');
    }

    /**
     * Скоуп для ответов на отзывы заказчиков
     */
    public function scopeForCustomerReviews($query)
    {
        return $query->where('review_type', 'customer_review');
    }
}