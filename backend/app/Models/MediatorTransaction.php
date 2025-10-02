<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Orchid\Filters\Filterable;
use Orchid\Filters\Types\Like;
use Orchid\Filters\Types\Where;
use Orchid\Filters\Types\WhereDateStartEnd;
use Orchid\Screen\AsSource;

class MediatorTransaction extends Model
{
    use AsSource, Filterable;

    protected $fillable = [
        'mediator_id',
        'order_id',
        'commission_amount',
        'status',
        'type',
        'processed_at',
        'notes'
    ];

    protected $casts = [
        'commission_amount' => 'decimal:2',
        'processed_at' => 'datetime',
    ];

    protected $allowedFilters = [
        'status' => Where::class,
        'type' => Where::class,
        'mediator_id' => Where::class,
        'created_at' => WhereDateStartEnd::class,
        'processed_at' => WhereDateStartEnd::class,
    ];

    protected $allowedSorts = [
        'id',
        'commission_amount',
        'created_at',
        'processed_at',
        'status',
    ];

    /**
     * Посредник, которому принадлежит транзакция
     */
    public function mediator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mediator_id');
    }

    /**
     * Заказ, связанный с транзакцией
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Возможные статусы транзакций
     */
    public static function getStatuses(): array
    {
        return [
            'pending' => 'Ожидает',
            'completed' => 'Завершена',
            'cancelled' => 'Отменена',
            'failed' => 'Ошибка',
        ];
    }

    /**
     * Возможные типы транзакций
     */
    public static function getTypes(): array
    {
        return [
            'commission' => 'Комиссия',
            'bonus' => 'Бонус',
            'penalty' => 'Штраф',
            'withdrawal' => 'Вывод средств',
        ];
    }

    /**
     * Scope для получения завершенных транзакций
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope для получения ожидающих транзакций
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope для получения комиссий
     */
    public function scopeCommissions($query)
    {
        return $query->where('type', 'commission');
    }
}
