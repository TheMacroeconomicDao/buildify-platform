<?php

namespace App\Orchid\Layouts\Order;

use App\Enums\Order\Status;
use App\Models\Order;
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
    public $target = 'orders';

    /**
     * @return TD[]
     */
    public function columns(): array
    {
        return [
            TD::make()
                ->align(TD::ALIGN_CENTER)
                ->width('100px')
                ->render(function (Order $order) {
                    return DropDown::make()
                        ->icon('options-vertical')
                        ->list([
                            Link::make(__('Edit'))
                                ->route('platform.systems.orders.edit', $order->id)
                                ->icon('pencil'),

                            Button::make(__('Delete'))
                                ->icon('trash')
                                ->confirm(__('Are you sure?'))
                                ->method('remove', [
                                    'order' => $order->id,
                                ]),
                        ]);
                }),

            TD::make('id', __('ID'))->sort(),
            TD::make('title', __('Title')), //-- @todo Категория??
            TD::make('description', __('Description')),
            TD::make('attachments_count', __('Attachment count')),

            TD::make('city', __('City')),
            TD::make('address', __('Address')),
            TD::make('max_amount', __('Max amount')),
            TD::make('author_id', __('Customer id')),
            TD::make('executor_id', __('Executor id'))
                ->render(fn(Order $order) => $order->executor_id ?? 'N\A'),

            TD::make('status', __('Status'))
                ->render(fn(Order $order) => Status::tryFrom($order->status)->name),

//            ●	AI генерация да/нет @todo
        ];
    }
}
