<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;

class TrainingLike extends Model
{
    use HasFactory, Notifiable;

    protected $table = 'training_like';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'training_id',
        'user_id',
        'created_at',
        'updated_at',
    ];
}
