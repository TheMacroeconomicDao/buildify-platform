<?php

namespace App\Orchid\Screens\Banner;

use App\Models\Banner;
use App\Orchid\Layouts\Banner\EditLayout;
use App\Orchid\Layouts\Banner\ShowLayout;
use App\Services\FileService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Layout;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Toast;

class EditScreen extends Screen
{
    public function __construct(private readonly FileService $fileService)
    {
    }

    private ?Banner $banner = null;

    /**
     * Fetch data to be displayed on the screen.
     *
     * @return array
     */
    public function query(Banner $banner): iterable
    {
        $this->banner = $banner;

        return [
            'banner' => $banner,
        ];
    }

    /**
     * Display header name.
     *
     * @return string|null
     */
    public function name(): ?string
    {
        return __('Banner');
    }

    public function commandBar(): iterable
    {
        return [
            Button::make(__('Save'))
                ->icon('check')
                ->method('save'),
            Link::make(__('Reset changes'))
                ->icon('reload')
                ->route('platform.systems.banners.edit', ['banner' => $this->banner->id]),
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
            ShowLayout::class,
            EditLayout::class,
        ];
    }

    public function save(Banner $banner, Request $request): RedirectResponse
    {
        $banner = DB::transaction(function () use ($banner, $request) {
            $data = $request->validate([
                'image_id' => 'nullable|integer',
                'banner.description' => 'nullable|string',
                'banner.priority' => 'required|integer',
                'banner.for_whom' => 'required|integer',
                'banner.status' => 'required|integer',
            ])['banner'];

            if ($request->get('image_id') !== null && $request->get('image_id') != 0) {
                $data['image_id'] = $this->fileService->createFromAttachment($request->get('image_id'), $request->user()->id)->id;
            }

            $banner->update($data);

            return $banner->refresh();
        });

        Toast::info(__('Banner updated'));

        return redirect()->route('platform.systems.banners.edit', ['banner' => $banner->id,]);
    }
}
