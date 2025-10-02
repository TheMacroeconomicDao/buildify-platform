<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Orchid\Attachment\Attachable;
use Orchid\Filters\Filterable;
use Orchid\Screen\AsSource;

class WorkDirection extends Model
{
    use AsSource, Filterable, Attachable;

    protected $fillable = [
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
    ];

    protected $allowedFilters = [
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
     * Связь с типами работ
     */
    public function workTypes(): HasMany
    {
        return $this->hasMany(WorkType::class);
    }

    /**
     * Активные типы работ
     */
    public function activeWorkTypes(): HasMany
    {
        return $this->hasMany(WorkType::class)->where('is_active', true)->orderBy('sort_order');
    }

    /**
     * Получить локализованное название
     */
    public function getLocalizedName(string $locale = 'en'): string
    {
        return $this->name[$locale] ?? $this->name['en'] ?? $this->key;
    }

    /**
     * Скоуп для активных направлений
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
}