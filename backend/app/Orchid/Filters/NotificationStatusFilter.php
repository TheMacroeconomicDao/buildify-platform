<?php

declare(strict_types=1);

namespace App\Orchid\Filters;

use Illuminate\Database\Eloquent\Builder;
use Orchid\Filters\Filter;
use Orchid\Screen\Fields\Select;

class NotificationStatusFilter extends Filter
{
    /**
     * The displayable name of the filter.
     */
    public function name(): string
    {
        return 'Read Status';
    }

    /**
     * The array of matched parameters.
     */
    public function parameters(): array
    {
        return ['read_status'];
    }

    /**
     * Apply to a given Eloquent query builder.
     */
    public function run(Builder $builder): Builder
    {
        $status = $this->request->get('read_status');
        
        if ($status === 'read') {
            return $builder->whereNotNull('read_at');
        } elseif ($status === 'unread') {
            return $builder->whereNull('read_at');
        }
        
        return $builder;
    }

    /**
     * Get the display fields.
     */
    public function display(): iterable
    {
        return [
            Select::make('read_status')
                ->options([
                    'unread' => 'Unread',
                    'read' => 'Read',
                ])
                ->empty()
                ->value($this->request->get('read_status'))
                ->title($this->name()),
        ];
    }
}
