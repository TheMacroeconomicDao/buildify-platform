<?php

namespace App\Orchid\Layouts\Order\Response;

use App\Enums\Order\ResponseStatus;
use App\Models\OrderResponse;
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
    public $target = 'orderResponses';

    /**
     * @return TD[]
     */
    public function columns(): array
    {
        return [
            TD::make()
                ->align(TD::ALIGN_CENTER)
                ->width('100px')
                ->render(function (OrderResponse $orderResponse) {
                    return DropDown::make()
                        ->icon('options-vertical')
                        ->list([
                            Link::make('Edit')
                                ->route('platform.systems.orders.responses.edit', $orderResponse->id)
                                ->icon('pencil'),

                            Button::make('Delete')
                                ->icon('trash')
                                ->confirm('Are you sure?')
                                ->method('remove', [
                                    'orderResponse' => $orderResponse->id,
                                ]),
                        ]);
                }),

            TD::make('id', 'ID')->sort(),
            
            TD::make('order.title', 'Order')
                ->render(fn(OrderResponse $orderResponse) => $orderResponse->order->title ?? 'N/A'),
            
            TD::make('customer', 'Customer')
                ->render(fn(OrderResponse $orderResponse) => $orderResponse->order->author->name ?? 'N/A'),
            
            TD::make('executor', 'Executor')
                ->render(fn(OrderResponse $orderResponse) => $orderResponse->executor->name ?? 'N/A'),
            
            TD::make('price', 'Price')
                ->render(fn(OrderResponse $orderResponse) => $orderResponse->price ? number_format($orderResponse->price, 2) . ' AED' : 'N/A'),

            TD::make('status', 'Status')
                ->render(function (OrderResponse $orderResponse) {
                    $status = ResponseStatus::tryFrom($orderResponse->status);
                    $badgeClass = match($orderResponse->status) {
                        ResponseStatus::Sent->value => 'bg-primary',
                        ResponseStatus::Rejected->value => 'bg-danger',
                        ResponseStatus::ContactReceived->value => 'bg-info',
                        ResponseStatus::ContactOpenedByExecutor->value => 'bg-warning',
                        ResponseStatus::OrderReceived->value => 'bg-success',
                        ResponseStatus::TakenIntoWork->value => 'bg-success',
                        ResponseStatus::Deleted->value => 'bg-secondary',
                        default => 'bg-secondary'
                    };
                    
                    $statusText = match($orderResponse->status) {
                        ResponseStatus::Sent->value => 'Sent',
                        ResponseStatus::Rejected->value => 'Rejected',
                        ResponseStatus::ContactReceived->value => 'Contact Received',
                        ResponseStatus::ContactOpenedByExecutor->value => 'Contact Opened',
                        ResponseStatus::OrderReceived->value => 'Order Received',
                        ResponseStatus::TakenIntoWork->value => 'In Work',
                        ResponseStatus::Deleted->value => 'Deleted',
                        default => 'Unknown'
                    };
                    
                    return "<span class=\"badge {$badgeClass}\">{$statusText}</span>";
                }),
            
            TD::make('created_at', 'Created')
                ->render(fn(OrderResponse $orderResponse) => $orderResponse->created_at->format('M d, Y H:i')),
            
            TD::make('review.rating', 'Review Rating')
                ->render(function (OrderResponse $orderResponse) {
                    $rating = optional($orderResponse->review)->rating;
                    return $rating ? str_repeat('⭐', $rating) . " ({$rating}/5)" : 'No rating';
                }),
        ];
    }
}
