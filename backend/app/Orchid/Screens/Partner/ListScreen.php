<?php

namespace App\Orchid\Screens\Partner;

use App\Models\Partner;
use App\Orchid\Layouts\PartnerListLayout;
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
            'partners' => Partner::with(['manager', 'user'])
                ->orderBy('total_earnings', 'desc')
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
        return 'Partners Management';
    }

    /**
     * The screen's action buttons.
     *
     * @return \Orchid\Screen\Action[]
     */
    public function commandBar(): iterable
    {
        return [
            Link::make('Create Partner')
                ->icon('bs.plus-circle')
                ->route('platform.partners.create'),
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
            PartnerListLayout::class
        ];
    }

    /**
     * @param Partner $partner
     *
     * @return \Illuminate\Http\RedirectResponse
     * @throws \Exception
     */
    public function remove(Partner $partner)
    {
        $partner->delete();

        Toast::info(__('Partner was removed'));

        return redirect()->route('platform.partners');
    }

    /**
     * Активировать/деактивировать партнера
     */
    public function toggleStatus(Partner $partner)
    {
        $partner->update(['is_active' => !$partner->is_active]);

        $status = $partner->is_active ? 'activated' : 'deactivated';
        Toast::info(__("Partner was {$status}"));

        return redirect()->route('platform.partners');
    }
}
