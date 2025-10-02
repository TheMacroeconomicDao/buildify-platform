<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Notifications\Notifiable;
use Orchid\Filters\Filterable;
use Orchid\Filters\Types\Like;
use Orchid\Filters\Types\Where;
use Orchid\Filters\Types\WhereDateStartEnd;
use Orchid\Metrics\Chartable;
use Orchid\Screen\AsSource;

class Transaction extends Model
{
    use HasFactory, Notifiable, AsSource, Chartable, Filterable, HasFactory, Notifiable;

    protected $table = 'transaction';
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'id',
        'subscription_id',
        'amount',
        'user_discount',
        'user_id',
        'payment_id',
        'status',
        'created_at',
        'updated_at',
    ];

    /**
     * The attributes for which you can use filters in url.
     *
     * @var array
     */
    protected $allowedFilters = [
        'id' => Where::class,
        'name_en-US' => Like::class,
        'name_ru-RU' => Like::class,
        'name_uk_UA' => Like::class,
        'name_es_ES' => Like::class,
        'name_zh_CN' => Like::class,
        'status' => Where::class,
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
        'name_en-US',
        'name_ru-RU',
        'name_uk_UA',
        'name_es_ES',
        'name_zh_CN',
        'status',
        'updated_at',
        'created_at',
    ];

    public function training(): BelongsToMany
    {
        return $this->belongsToMany(Training::class, 'directory_training', 'training_id', 'directory_id');
    }
}
