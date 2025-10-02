<?php

namespace App\Orchid\Filters;

use App\Enums\Users\Status;
use Illuminate\Database\Eloquent\Builder;
use Orchid\Filters\Filter;
use Orchid\Screen\Fields\Select;

class UserStatusFilter extends Filter
{
    /**
     * The displayable name of the filter.
     */
    public function name(): string
    {
        return 'Status';
    }

    /**
     * The array of matched parameters.
     */
    public function parameters(): array
    {
        return ['status'];
    }

    /**
     * Apply to a given Eloquent query builder.
     */
    public function run(Builder $builder): Builder
    {
        return $builder->where('status', $this->request->get('status'));
    }

    /**
     * Get the display fields.
     */
    public function display(): iterable
    {
        return [
            Select::make('status')
                ->empty('All Statuses')
                ->options([
                    Status::Active->value => 'Active',
                    Status::Inactive->value => 'Inactive',
                ])
                ->value($this->request->get('status'))
                ->title('Status'),
        ];
    }
}
