<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Orchid\Attachment\Attachable;
use Orchid\Filters\Filterable;
use Orchid\Screen\AsSource;

class Banner extends Model
{
    use AsSource, Filterable, Attachable;

    protected $table = 'banners';

    protected $fillable = [
        'name',
        'description',
        'image_id',
        'status',
        'priority',
        'for_whom',
    ];

    public function image(): BelongsTo
    {
        return $this->belongsTo(File::class, 'image_id', 'id');
    }

    public function getImageUrlAttribute(): string
    {
        return $this->image->url;
    }
}
