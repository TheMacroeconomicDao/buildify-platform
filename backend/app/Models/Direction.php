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

class Direction extends Model
{
    use HasFactory, Notifiable, AsSource, Chartable, Filterable, HasFactory, Notifiable;

    protected $table = 'directions';
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'id',
        'name_en-US',
        'name_ru-RU',
        'name_uk-UA',
        'name_es-ES',
        'name_zh-CN',
        'image_home',
        'image_page_training',
        'image_page_meditation',
        'image_list_training',
        'image_list_meditation',
        'description_en-US',
        'description_ru-RU',
        'description_uk-UA',
        'description_es-ES',
        'description_zh-CN',
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
        'name_uk-UA' => Like::class,
        'name_es-ES' => Like::class,
        'name_zh-CN' => Like::class,
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
        'name_uk-UA',
        'name_es-ES',
        'name_zh-CN',
        'status',
        'updated_at',
        'created_at',
    ];

    public function training(): BelongsToMany
    {
        return $this->belongsToMany(Training::class, 'directory_training', 'training_id', 'directory_id');
    }
}
