<?php

namespace App\Orchid\Layouts\Customer;

use Orchid\Screen\Fields\Input;
use Orchid\Screen\Layouts\Rows;

class EditLayout extends Rows
{
    /**
     * @return iterable
     */
    protected function fields(): iterable
    {
        return [
            Input::make('customer.name')
                ->title(__('Name')),

            Input::make('customer.phone')
                ->title(__('Phone')),

            Input::make('customer.email')
                ->title(__('Email')),

            Input::make('customer.telegram')
                ->title(__('Telegram')),

            Input::make('customer.whatsApp')
                ->title(__('WhatsApp')),

            Input::make('customer.facebook')
                ->title(__('Facebook')),

            Input::make('customer.viber')
                ->title(__('Viber')),
        ];
    }
}
