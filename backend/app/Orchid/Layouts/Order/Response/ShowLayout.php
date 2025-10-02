<?php

namespace App\Orchid\Layouts\Order\Response;

use App\Models\OrderResponse;
use Orchid\Screen\Layouts\Legend;
use Orchid\Screen\Sight;

class ShowLayout extends Legend
{
    protected $target = 'orderResponse';

    /**
     * @return iterable
     */
    protected function columns(): iterable
    {
        return [
            Sight::make('id', 'ID'),

            Sight::make('author', __('Executor'))
                ->render(function (OrderResponse $orderResponse) {
                    return $orderResponse->executor->id . '|' . $orderResponse->executor->name;
                }),

            Sight::make('author', __('Customer'))
                ->render(function (OrderResponse $orderResponse) {
                    return $orderResponse->order->author->id . '|' . $orderResponse->order->author->name;
                }),

            Sight::make('order_id', __('Order'))
                ->render(function (OrderResponse $orderResponse) {
                    return $orderResponse->order->id . '|' . $orderResponse->order->title;
                }),
        ];
    }
}
