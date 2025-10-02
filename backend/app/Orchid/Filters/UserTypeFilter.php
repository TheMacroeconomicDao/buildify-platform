<?php

namespace App\Orchid\Filters;

use App\Enums\Users\Type;
use Illuminate\Database\Eloquent\Builder;
use Orchid\Filters\Filter;
use Orchid\Screen\Fields\Select;

class UserTypeFilter extends Filter
{
    /**
     * The displayable name of the filter.
     */
    public function name(): string
    {
        return 'User Type';
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
                ->empty('All Types')
                ->options([
                    Type::Customer->value => 'Customer',
                    Type::Executor->value => 'Executor',
                    Type::Mediator->value => 'Mediator',
                    Type::Admin->value => 'Administrator',
                ])
                ->value($this->request->get('type'))
                ->title('User Type'),
        ];
    }
}
