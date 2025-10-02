<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Orchid\Attachment\Attachable;
use Orchid\Filters\Filterable;
use Orchid\Screen\AsSource;

class Order extends Model
{
    use AsSource, Filterable, Attachable;

    protected $fillable = [
        'title',
        'work_direction',
        'work_type',
        'description',
        'city',
        'address',
        'full_address',
        'latitude',
        'longitude',
        'housing_type',
        'housing_condition',
        'housing_preparation_level',
        'bathroom_type',
        'ceiling_height',
        'total_area',
        'date_type',
        'work_date',
        'completed_by_executor',
        'completed_by_customer',
        'executor_completed_at',
        'customer_completed_at',
        'work_time',
        'start_date',
        'start_time',
        'end_date',
        'end_time',

        'max_amount',
        'author_id',
        'status',
        'executor_id',
        'mediator_id',
        'mediator_commission',
        'escrow_status',
        'payment_held',
        'executor_contact_name',
        'executor_contact_phone',
        'executor_cost',
        'mediator_margin',
        'project_deadline',
        'mediator_notes',
        'mediator_step',
        'executor_archived',
        'customer_archived',
    ];

    protected function casts(): array
    {
        return [
            'completed_by_executor' => 'boolean',
            'completed_by_customer' => 'boolean',
            'executor_completed_at' => 'datetime',
            'customer_completed_at' => 'datetime',
            'executor_archived' => 'boolean',
            'customer_archived' => 'boolean',

            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
            'work_date' => 'date',
            'start_date' => 'date',
            'end_date' => 'date',
            'work_time' => 'string',
            'start_time' => 'string',
            'end_time' => 'string',
            'mediator_commission' => 'decimal:2',
            'payment_held' => 'decimal:2',
            'executor_cost' => 'decimal:2',
            'mediator_margin' => 'decimal:2',
            'project_deadline' => 'date',
        ];
    }

    /**
     * The attributes for which can use sort in url.
     *
     * @var array
     */
    protected array $allowedSorts = [
        'id',
    ];

    // Связь с вложениями
    public function attachments(): HasMany
    {
        return $this->hasMany(OrderAttachment::class, 'order_id', 'id');
    }

    public function files(): BelongsToMany
    {
        return $this->belongsToMany(
            File::class,
            OrderAttachment::class,
            'order_id',
            'file_id',
            'id',
            'id'
        );
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id', 'id');
    }

    public function executor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'executor_id', 'id');
    }

    public function mediator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mediator_id', 'id');
    }

    public function mediatorTransactions(): HasMany
    {
        return $this->hasMany(MediatorTransaction::class, 'order_id', 'id');
    }

    public function orderResponses(): HasMany
    {
        return $this->hasMany(OrderResponse::class, 'order_id', 'id');
    }

    public function mediatorSteps(): HasMany
    {
        return $this->hasMany(MediatorOrderStep::class, 'order_id', 'id');
    }

    public function currentMediatorStep(): HasMany
    {
        return $this->mediatorSteps()->where('status', MediatorOrderStep::STATUS_ACTIVE);
    }

    public function executorReviews(): HasMany
    {
        return $this->hasMany(ExecutorReview::class, 'order_id', 'id');
    }

    public function customerReviews(): HasMany
    {
        return $this->hasMany(CustomerReview::class, 'order_id', 'id');
    }
}
