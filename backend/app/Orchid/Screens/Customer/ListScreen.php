<?php

namespace App\Orchid\Screens\Customer;

use App\Enums\Users\Status;
use App\Enums\Users\Type;
use App\Models\User;
use App\Orchid\Layouts\Customer\FilterLayout;
use App\Orchid\Layouts\Customer\ListLayout;
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
            'customers' => User::with('roles')
                ->filters(FilterLayout::class)
                ->where('type', Type::Customer->value)
                ->where('status', '!=', Status::Deleted->value)
                ->withCount(['customerOrders',])
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
        return __('Customers');
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
                ->route('platform.systems.customers.create'),
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

    public function remove(User $customer): void
    {
        $customer->update([
            'status' => Status::Deleted->value,
        ]);

        Toast::info(__('Deleted'));
    }
}
