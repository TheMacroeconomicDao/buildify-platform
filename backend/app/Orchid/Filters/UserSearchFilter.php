<?php

namespace App\Orchid\Filters;

use Illuminate\Database\Eloquent\Builder;
use Orchid\Filters\Filter;
use Orchid\Screen\Field;
use Orchid\Screen\Fields\Input;

class UserSearchFilter extends Filter
{
    /**
     * The displayable name of the filter.
     */
    public function name(): string
    {
        return 'Search';
    }

    /**
     * The array of matched parameters.
     */
    public function parameters(): array
    {
        return ['search'];
    }

    /**
     * Apply to a given Eloquent query builder.
     */
    public function run(Builder $builder): Builder
    {
        return $builder->where(function ($query) {
            $query->where('name', 'like', '%' . $this->request->get('search') . '%')
                  ->orWhere('email', 'like', '%' . $this->request->get('search') . '%');
        });
    }

    /**
     * Get the display fields.
     */
    public function display(): iterable
    {
        return [
            Input::make('search')
                ->type('text')
                ->value($this->request->get('search'))
                ->placeholder('Search by name or email')
                ->title('Search'),
        ];
    }
}
