<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class File extends Model
{
    protected $table = 'files';

    protected $fillable = [
        'user_id',
        'path',
        'name',
        'size'
    ];
    protected $hidden = [
        'pivot',
    ];

    protected $appends = [
        'url',
    ];

    protected $casts = [
    ];

    public function getUrlAttribute(): string
    {
        return Storage::disk('public')->url($this->path);
    }
}
