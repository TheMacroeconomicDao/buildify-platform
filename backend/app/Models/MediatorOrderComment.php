<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MediatorOrderComment extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'mediator_id',
        'step',
        'comment',
        'step_data',
    ];

    protected $casts = [
        'step_data' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Заказ, к которому относится комментарий
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Посредник, который оставил комментарий
     */
    public function mediator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mediator_id');
    }

    /**
     * Получить все комментарии для заказа в хронологическом порядке
     */
    public static function getOrderCommentsHistory(int $orderId): array
    {
        return self::with('mediator:id,name,avatar')
            ->where('order_id', $orderId)
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($comment) {
                return [
                    'id' => $comment->id,
                    'step' => $comment->step,
                    'comment' => $comment->comment,
                    'step_data' => $comment->step_data,
                    'mediator' => [
                        'id' => $comment->mediator->id,
                        'name' => $comment->mediator->name,
                        'avatar' => $comment->mediator->avatar,
                    ],
                    'created_at' => $comment->created_at,
                    'formatted_date' => $comment->created_at->format('d.m.Y H:i'),
                ];
            })
            ->toArray();
    }
}
