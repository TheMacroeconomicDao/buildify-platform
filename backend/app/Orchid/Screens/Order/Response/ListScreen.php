<?php

namespace App\Orchid\Screens\Order\Response;

use App\Enums\Order\ResponseStatus;
use App\Enums\Order\Status;
use App\Models\OrderResponse;
use App\Orchid\Layouts\Order\Response\FilterLayout;
use App\Orchid\Layouts\Order\Response\ListLayout;
use Illuminate\Support\Facades\DB;
use Orchid\Screen\Action;
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
            'orderResponses' => OrderResponse::query()
                ->with(['order.author', 'executor', 'review'])
                ->filters(FilterLayout::class)
                ->where('status', '!=', ResponseStatus::Deleted->value)
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
        return 'Order Responses';
    }

    /**
     * Button commands.
     *
     * @return Action[]
     */
    public function commandBar(): iterable
    {
        return [];
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

    public function remove(OrderResponse $orderResponse): void
    {
        DB::transaction(function () use ($orderResponse) {
            if ($orderResponse->executor_id === $orderResponse->order->executor_id) {
                $orderResponse->order->update([
                    'status' => Status::SearchExecutor->value,
                    'executor_id' => null,
                ]);
            }
            $orderResponse->update([
                'status' => ResponseStatus::Deleted->value,
            ]);
        });

        Toast::info('Order response deleted successfully');
    }
}
