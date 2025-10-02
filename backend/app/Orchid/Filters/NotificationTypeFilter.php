<?php

declare(strict_types=1);

namespace App\Orchid\Filters;

use Illuminate\Database\Eloquent\Builder;
use Orchid\Filters\Filter;
use Orchid\Screen\Fields\Select;

class NotificationTypeFilter extends Filter
{
    /**
     * The displayable name of the filter.
     */
    public function name(): string
    {
        return 'Notification Type';
    }

    /**
     * The array of matched parameters.
     */
    public function parameters(): array
    {
        return ['type'];
    }

    /**
     * Apply to a given Eloquent query builder.
     */
    public function run(Builder $builder): Builder
    {
        return $builder->where('type', $this->request->get('type'));
    }

    /**
     * Get the display fields.
     */
    public function display(): iterable
    {
        return [
            Select::make('type')
                ->fromModel(\App\Models\AdminNotification::class, 'type')
                ->empty()
                ->value($this->request->get('type'))
                ->title($this->name()),
        ];
    }
}
