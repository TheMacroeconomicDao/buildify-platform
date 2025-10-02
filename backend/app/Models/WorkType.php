<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Orchid\Attachment\Attachable;
use Orchid\Filters\Filterable;
use Orchid\Screen\AsSource;

class WorkType extends Model
{
    use AsSource, Filterable, Attachable;

    protected $fillable = [
        'work_direction_id',
        'key',
        'name',
        'description',
        'icon',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'name' => 'array',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
        'work_direction_id' => 'integer',
    ];

    protected $allowedFilters = [
        'work_direction_id',
        'key',
        'is_active',
    ];

    protected $allowedSorts = [
        'id',
        'key',
        'sort_order',
        'created_at',
    ];

    /**
     * Связь с направлением работ
     */
    public function workDirection(): BelongsTo
    {
        return $this->belongsTo(WorkDirection::class);
    }

    /**
     * Получить локализованное название
     */
    public function getLocalizedName(string $locale = 'en'): string
    {
        return $this->name[$locale] ?? $this->name['en'] ?? $this->key;
    }

    /**
     * Скоуп для активных типов
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Скоуп для сортировки
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('id');
    }

    /**
     * Скоуп для конкретного направления
     */
    public function scopeForDirection($query, $directionId)
    {
        return $query->where('work_direction_id', $directionId);
    }
}