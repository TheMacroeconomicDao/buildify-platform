<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExecutorPortfolioFile extends Model
{
    protected $table = 'executor_portfolio_files';

    protected $fillable = [
        'portfolio_id',
        'file_id',
        'sort_order',
    ];

    public function portfolio(): BelongsTo
    {
        return $this->belongsTo(ExecutorPortfolio::class, 'portfolio_id', 'id');
    }

    public function file(): BelongsTo
    {
        return $this->belongsTo(File::class, 'file_id', 'id');
    }
}
