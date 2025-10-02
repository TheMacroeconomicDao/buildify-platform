<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Orchid\Filters\Filterable;
use Orchid\Filters\Types\Like;
use Orchid\Filters\Types\Where;
use Orchid\Filters\Types\WhereDateStartEnd;
use Orchid\Screen\AsSource;

class Complaint extends Model
{
    use AsSource, Filterable;

    protected $fillable = [
        'complainant_id',
        'reported_user_id',
        'order_id',
        'reason',
        'comment',
        'status',
        'admin_comment',
        'reviewed_at',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
    ];

    protected $allowedFilters = [
        'status' => Where::class,
        'reason' => Where::class,
        'created_at' => WhereDateStartEnd::class,
    ];

    protected $allowedSorts = [
        'id',
        'created_at',
        'status',
    ];

    /**
     * Пользователь, который подал жалобу
     */
    public function complainant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'complainant_id');
    }

    /**
     * Пользователь, на которого подали жалобу
     */
    public function reportedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_user_id');
    }

    /**
     * Заказ, связанный с жалобой (если есть)
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Статические методы для получения возможных значений
     */
    public static function getStatuses(): array
    {
        return [
            'pending' => __('complaint.statuses.pending'),
            'reviewing' => __('complaint.statuses.reviewing'),
            'resolved' => __('complaint.statuses.resolved'),
            'rejected' => __('complaint.statuses.rejected'),
        ];
    }

    public static function getReasons(): array
    {
        return [
            'inappropriate_behavior' => __('complaint.reasons.inappropriate_behavior'),
            'poor_quality_work' => __('complaint.reasons.poor_quality_work'),
            'non_payment' => __('complaint.reasons.non_payment'),
            'fraud' => __('complaint.reasons.fraud'),
            'spam' => __('complaint.reasons.spam'),
            'fake_profile' => __('complaint.reasons.fake_profile'),
            'other' => __('complaint.reasons.other'),
        ];
    }
}
