<?php

namespace App\Orchid\Screens\WorkDirection;

use App\Models\WorkDirection;
use App\Orchid\Layouts\WorkDirectionListLayout;
use Orchid\Screen\Actions\Link;
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
            'work_directions' => WorkDirection::withCount('workTypes')
                ->orderBy('sort_order')
                ->orderBy('id')
                ->paginate()
        ];
    }

    /**
     * The name of the screen displayed in the header.
     *
     * @return string|null
     */
    public function name(): ?string
    {
        return 'Work Directions';
    }

    /**
     * The screen's action buttons.
     *
     * @return \Orchid\Screen\Action[]
     */
    public function commandBar(): iterable
    {
        return [
            Link::make('Create Work Direction')
                ->icon('bs.plus-circle')
                ->route('platform.work-directions.create'),
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
            WorkDirectionListLayout::class
        ];
    }

    /**
     * @param WorkDirection $workDirection
     *
     * @return \Illuminate\Http\RedirectResponse
     * @throws \Exception
     */
    public function remove(WorkDirection $workDirection)
    {
        $workDirection->delete();

        Toast::info(__('Work direction was removed'));

        return redirect()->route('platform.work-directions');
    }
}