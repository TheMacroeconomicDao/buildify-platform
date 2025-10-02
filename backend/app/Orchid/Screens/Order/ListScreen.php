<?php

namespace App\Orchid\Screens\Order;

use App\Enums\Order\Status;
use App\Models\Order;
use App\Orchid\Layouts\Order\FilterLayout;
use App\Orchid\Layouts\Order\ListLayout;
use Orchid\Screen\Action;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Layout;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Toast;

class ListScreen extends Screen
{
    /**
     * Fetch data to be displayed on the screen.
     *
     * @return array
     */
    public function query(): iterable
    {
        return [
            'orders' => Order::query()
                ->withCount(['attachments',])
                ->filters(FilterLayout::class)
                ->where('status', '!=', Status::Deleted->value)
                ->defaultSort('id', 'desc')
                ->paginate(),
        ];
    }

    /**
     * Display header name.
     *
     * @return string|null
     */
    public function name(): ?string
    {
        return __('Orders');
    }

    /**
     * Button commands.
     *
     * @return Action[]
     */
    public function commandBar(): iterable
    {
        return [
            Link::make(__('Create'))
                ->icon('plus')
                ->route('platform.systems.orders.create'),
        ];
    }

    /**
     * Views.
     *
     * @return Layout[]|string[]
     */
    public function layout(): iterable
    {
        return [
            FilterLayout::class,
            ListLayout::class,
        ];
    }

    public function remove(Order $order): void
    {
        $order->update([
            'status' => Status::Deleted->value,
        ]);

        Toast::info(__('Deleted'));
    }
}
