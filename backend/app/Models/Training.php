<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Orchid\Filters\Filterable;
use Orchid\Filters\Types\Like;
use Orchid\Filters\Types\Where;
use Orchid\Filters\Types\WhereDateStartEnd;
use Orchid\Metrics\Chartable;
use Orchid\Screen\AsSource;

class Training extends Model
{
    use HasFactory, Notifiable, AsSource, Chartable, Filterable, HasFactory, Notifiable;

    protected $table = 'trainings';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name',
        'lang',
        'amount',
        'audio',
        'url_1080',
        'url_4k',
        'url_480',
        'status',
        'description',
        'image',
        'free',
        'duration',
        'duration_time',
        'level',
        'equipment',
    ];

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'equipment' => 'array',
    ];

    /**
     * The attributes for which you can use filters in url.
     *
     * @var array
     */
    protected $allowedFilters = [
        'id' => Where::class,
        'name' => Like::class,
        'lang' => Where::class,
        'amount' => Where::class,
        'url_1080' => Like::class,
        'url_4k' => Like::class,
        'url_480' => Like::class,
        'status' => Where::class,
        'description' => Like::class,
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
        'lang',
        'amount',
        'status',
        'updated_at',
        'created_at',
    ];

    public function directory(): BelongsToMany
    {
        return $this->belongsToMany(Direction::class, 'directory_training', 'training_id', 'directory_id');
    }

    /**
     * Получить комментарии
     */
    public function comments(): HasMany
    {
        return $this->hasMany(TrainingComment::class);
    }

    /**
     * Получить лайки
     */
    public function likes(): HasMany
    {
        return $this->hasMany(TrainingLike::class);
    }

    /**
     * Получить лайки
     */
    public function exercises(): HasMany
    {
        return $this->hasMany(Exercises::class);
    }
}
