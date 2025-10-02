<?php

namespace App\Orchid\Layouts\Customer;

use App\Models\User;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Actions\DropDown;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Layouts\Table;
use Orchid\Screen\TD;

class ListLayout extends Table
{
    /**
     * @var string
     */
    public $target = 'customers';

    /**
     * @return TD[]
     */
    public function columns(): array
    {
        return [
            TD::make()
                ->align(TD::ALIGN_CENTER)
                ->width('100px')
                ->render(function (User $customer) {
                    return DropDown::make()
                        ->icon('options-vertical')
                        ->list([
                            Link::make(__('Edit'))
                                ->route('platform.systems.customers.edit', $customer->id)
                                ->icon('pencil'),

                            Button::make(__('Delete'))
                                ->icon('trash')
                                ->confirm(__('Are you sure?'))
                                ->method('remove', [
                                    'customer' => $customer->id,
                                ]),
                        ]);
                }),

            TD::make('id', __('ID'))->sort(),
            TD::make('name', __('Name'))->sort(),
            TD::make('phone', __('Phone')),
            TD::make('email', __('Email'))->sort(),
            TD::make('telegram', __('Telegram')),
            TD::make('whatsApp', __('WhatsApp')),
            TD::make('facebook', __('Facebook')),
            TD::make('viber', __('Viber')),

            TD::make('customer_orders_count', __('Orders count')),

            TD::make('created_at', __('Registered at')),

//            ●	Last activity date @todo
        ];
    }
}
