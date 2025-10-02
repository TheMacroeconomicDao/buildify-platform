<?php

namespace App\Orchid\Layouts\Order\Response;

use App\Enums\Order\ResponseStatus;
use Orchid\Screen\Fields\Input;
use Orchid\Screen\Fields\Select;
use Orchid\Screen\Fields\TextArea;
use Orchid\Screen\Layouts\Rows;
use ReflectionException;

class EditLayout extends Rows
{
    /**
     * @return iterable
     * @throws ReflectionException
     */
    protected function fields(): iterable
    {
        return [
            Input::make('review.rating')
                ->type('number')
                ->max(5)
                ->min(1)
                ->title(__('Review rating')),

            TextArea::make('review.text')
                ->title(__('Review text')),

            Select::make('orderResponse.status')
                ->title(__('Status'))
                ->fromEnum(ResponseStatus::class),
        ];
    }
}
