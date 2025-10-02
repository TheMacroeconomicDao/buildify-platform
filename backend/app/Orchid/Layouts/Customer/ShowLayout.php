<?php

namespace App\Orchid\Layouts\Customer;

use Orchid\Screen\Layouts\Legend;
use Orchid\Screen\Sight;

class ShowLayout extends Legend
{
    protected $target = 'customer';

    /**
     * @return iterable
     */
    protected function columns(): iterable
    {
        return [
            Sight::make('id', 'ID'),

            Sight::make('customer_orders_count', __('Orders count')),

            Sight::make('created_at', __('Registered at')),

//            ●	Дата последней активности @todo
        ];
    }
}
