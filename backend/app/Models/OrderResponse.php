<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Orchid\Attachment\Attachable;
use Orchid\Filters\Filterable;
use Orchid\Screen\AsSource;

class OrderResponse extends Model
{
    use AsSource, Filterable, Attachable;

    protected $table = 'order_responses';

    protected $fillable = [
        'order_id',
        'executor_id',
        'status',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id', 'id');
    }

    public function executor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'executor_id', 'id');
    }

    public function review(): BelongsTo
    {
        return $this->belongsTo(ExecutorReview::class, 'executor_id', 'executor_id')
            ->where('executor_reviews.order_id', $this->order_id);
    }
}
