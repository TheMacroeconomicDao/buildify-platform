<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Orchid\Screen\AsSource;
use Orchid\Filters\Filterable;

class HousingOption extends Model
{
    use AsSource, Filterable;

    protected $fillable = [
        'type',
        'key',
        'label_en',
        'label_ar',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    // Scope для получения опций по типу
    public function scopeByType($query, $type)
    {
        return $query->where('type', $type)->where('is_active', true)->orderBy('sort_order');
    }

    // Получить локализованный лейбл
    public function getLocalizedLabel($locale = 'en')
    {
        return $locale === 'ar' ? $this->label_ar : $this->label_en;
    }
}
