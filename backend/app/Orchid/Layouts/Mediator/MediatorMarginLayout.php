<?php

declare(strict_types=1);

namespace App\Orchid\Layouts\Mediator;

use Orchid\Screen\Field;
use Orchid\Screen\Fields\Input;
use Orchid\Screen\Fields\TextArea;
use Orchid\Screen\Layouts\Rows;

class MediatorMarginLayout extends Rows
{
    /**
     * The screen's layout elements.
     *
     * @return Field[]
     */
    public function fields(): array
    {
        return [
            Input::make('mediator.mediator_margin_percentage')
                ->type('number')
                ->min(0)
                ->max(100)
                ->step(0.01)
                ->title('Margin in percentage (%)')
                ->placeholder('10.5')
                ->help('Percentage of order cost that mediator receives'),

            Input::make('mediator.mediator_fixed_fee')
                ->type('number')
                ->min(0)
                ->step(0.01)
                ->title('Fixed commission (AED)')
                ->placeholder('500.00')
                ->help('Fixed amount for order handling'),

            Input::make('mediator.mediator_agreed_price')
                ->type('number')
                ->min(0)
                ->step(0.01)
                ->title('Contract price (AED)')
                ->placeholder('1000.00')
                ->help('Individually agreed price for mediator services'),

            TextArea::make('mediator.mediator_notes')
                ->title('Agreement notes')
                ->rows(4)
                ->placeholder('Special work conditions, agreements, comments...')
                ->help('Internal notes for administrators about working conditions with mediator'),
        ];
    }
}
