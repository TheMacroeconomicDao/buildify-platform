<?php

namespace App\Orchid\Screens\Order;

use App\Models\Order;
use App\Orchid\Layouts\Order\ShowLayout;
use App\Orchid\Layouts\Order\EditLayout;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Fields\Input;
use Orchid\Screen\Layouts\Rows;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Toast;

class TestEditScreen extends Screen
{
    public function name(): ?string
    {
        return 'Edit Order';
    }

    public function query(Order $order): iterable
    {
        return [
            'order' => $order,
        ];
    }

    public function layout(): iterable
    {
        return [
            ShowLayout::class,
            EditLayout::class,
        ];
    }

    public function commandBar(): iterable
    {
        return [
            Button::make('Save')
                ->icon('check')
                ->method('save'),

            Button::make('Delete')
                ->icon('trash')
                ->method('delete')
                ->confirm('Are you sure you want to delete this order?'),
        ];
    }

    public function save(Order $order, \Illuminate\Http\Request $request)
    {
        $data = $request->validate([
            'order.title' => 'required|string',
            'order.work_direction' => 'required|string',
            'order.work_type' => 'required|string',
            'order.description' => 'nullable|string',
            'order.city' => 'required|string',
            'order.address' => 'required|string',

            'order.max_amount' => 'required|numeric',
            'order.executor_id' => 'nullable|integer|exists:users,id',
            'order.status' => 'required|integer',
        ])['order'];

        $order->update($data);

        Toast::info('Order updated successfully');

        return redirect()->route('platform.systems.orders.edit', $order);
    }

    public function delete(Order $order)
    {
        $order->delete();

        Toast::info('Order deleted successfully');

        return redirect()->route('platform.systems.orders');
    }
}
