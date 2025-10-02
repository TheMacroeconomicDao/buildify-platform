<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExecutorPortfolio extends Model
{
    protected $table = 'executor_portfolios';

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'type',
        'external_url',
        'file_id', // Основной файл (для обратной совместимости)
    ];

    /**
     * Типы портфолио
     */
    public const TYPE_MEDIA = 'media';
    public const TYPE_LINK = 'link';

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function file(): BelongsTo
    {
        return $this->belongsTo(File::class, 'file_id', 'id');
    }

    /**
     * Множественные файлы портфолио
     */
    public function portfolioFiles(): HasMany
    {
        return $this->hasMany(ExecutorPortfolioFile::class, 'portfolio_id', 'id')
            ->orderBy('sort_order');
    }

    /**
     * Все файлы портфолио (через связующую таблицу)
     */
    public function files(): HasMany
    {
        return $this->hasMany(ExecutorPortfolioFile::class, 'portfolio_id', 'id')
            ->with('file')
            ->orderBy('sort_order');
    }

    /**
     * Проверка, является ли портфолио медиа-типом
     */
    public function isMediaType(): bool
    {
        return $this->type === self::TYPE_MEDIA;
    }

    /**
     * Проверка, является ли портфолио ссылкой
     */
    public function isLinkType(): bool
    {
        return $this->type === self::TYPE_LINK;
    }
}
