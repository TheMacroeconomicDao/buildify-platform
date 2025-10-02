<?php

declare(strict_types=1);

namespace App\Orchid\Screens\Mediator;

use App\Enums\Users\Status;
use App\Enums\Users\Type;
use App\Models\User;
use App\Orchid\Layouts\Mediator\MediatorListLayout;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Toast;

class MediatorListScreen extends Screen
{
    /**
     * Fetch data to be displayed on the screen.
     *
     * @return array
     */
    public function query(): iterable
    {
        return [
            'mediators' => User::filters()
                ->where('type', Type::Mediator->value)
                ->where('status', '!=', Status::Deleted->value)
                ->defaultSort('id', 'desc')
                ->paginate()
        ];
    }

    /**
     * The name of the screen displayed in the header.
     */
    public function name(): ?string
    {
        return __('Mediators');
    }

    /**
     * Display header description.
     */
    public function description(): ?string
    {
        return __('Manage mediators who help connect customers with performers');
    }

    /**
     * The screen's action buttons.
     *
     * @return \Orchid\Screen\Action[]
     */
    public function commandBar(): iterable
    {
        return [
            Link::make(__('Add'))
                ->icon('bs.plus-circle')
                ->route('platform.systems.mediators.create')
        ];
    }

    /**
     * The screen's layout elements.
     *
     * @return \Orchid\Screen\Layout[]|string[]
     */
    public function layout(): iterable
    {
        return [
            MediatorListLayout::class
        ];
    }

    /**
     * Remove mediator
     */
    public function remove(User $user): void
    {
        $user->update([
            'status' => Status::Deleted->value,
        ]);

        Toast::info(__('Deleted'));
    }
}
