<?php

namespace App\Orchid\Screens\Banner;

use App\Models\Banner;
use App\Orchid\Layouts\Banner\CreateLayout;
use App\Services\FileService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Layout;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Toast;

class CreateScreen extends Screen
{
    public function __construct(private readonly FileService $fileService)
    {
    }

    public function query(): iterable
    {
        return ['banner' => null];
    }

    /**
     * Display header name.
     *
     * @return string|null
     */
    public function name(): ?string
    {
        return __('Create banner');
    }

    public function commandBar(): iterable
    {
        return [
            Button::make(__('Save'))
                ->icon('check')
                ->method('save'),
            Link::make(__('Reset changes'))
                ->icon('reload')
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
            CreateLayout::class,
        ];
    }

    public function save(Request $request): RedirectResponse
    {
        $banner = DB::transaction(function () use ($request) {
            $data = $request->validate([
                'image_id' => 'required|integer',
                'banner.description' => 'nullable|string',
                'banner.priority' => 'required|integer',
                'banner.for_whom' => 'required|integer',
                'banner.status' => 'required|integer',
            ])['banner'];

            $data['image_id'] = $this->fileService->createFromAttachment($request->get('image_id'), $request->user()->id)->id;
            $banner = Banner::create($data);

            return $banner->refresh();
        });

        Toast::info(__('Banner created'));

        return redirect()->route('platform.systems.banners.edit', ['banner' => $banner->id,]);
    }
}
