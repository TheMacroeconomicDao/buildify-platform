<?php

namespace App\Orchid\Screens\Banner;

use App\Enums\Banner\Status;
use App\Models\Banner;
use App\Orchid\Layouts\Banner\FilterLayout;
use App\Orchid\Layouts\Banner\ListLayout;
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
            'banners' => Banner::query()
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
        return __('Banners');
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
                ->route('platform.systems.banners.create'),
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

    public function remove(Banner $banner): void
    {
        $banner->update([
            'status' => Status::Deleted->value,
        ]);

        Toast::info(__('Deleted'));
    }
}
