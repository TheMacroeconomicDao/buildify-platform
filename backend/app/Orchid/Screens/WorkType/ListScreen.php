<?php

namespace App\Orchid\Screens\WorkType;

use App\Models\WorkType;
use App\Orchid\Layouts\WorkTypeListLayout;
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
            'work_types' => WorkType::with('workDirection')
                ->orderBy('work_direction_id')
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
        return 'Work Types';
    }

    /**
     * The screen's action buttons.
     *
     * @return \Orchid\Screen\Action[]
     */
    public function commandBar(): iterable
    {
        return [
            Link::make('Create Work Type')
                ->icon('bs.plus-circle')
                ->route('platform.work-types.create'),
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
            WorkTypeListLayout::class
        ];
    }

    /**
     * @param WorkType $workType
     *
     * @return \Illuminate\Http\RedirectResponse
     * @throws \Exception
     */
    public function remove(WorkType $workType)
    {
        $workType->delete();

        Toast::info(__('Work type was removed'));

        return redirect()->route('platform.work-types');
    }
}