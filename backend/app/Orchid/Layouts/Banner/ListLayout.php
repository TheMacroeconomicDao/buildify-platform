<?php

namespace App\Orchid\Layouts\Banner;

use App\Enums\Banner\ForWhom;
use App\Enums\Banner\Status;
use App\Models\Banner;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Actions\DropDown;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Layouts\Table;
use Orchid\Screen\TD;

class ListLayout extends Table
{
    /**
     * @var string
     */
    public $target = 'banners';

    /**
     * @return TD[]
     */
    public function columns(): array
    {
        return [
            TD::make()
                ->align(TD::ALIGN_CENTER)
                ->width('100px')
                ->render(function (Banner $banner) {
                    return DropDown::make()
                        ->icon('options-vertical')
                        ->list([
                            Link::make(__('Edit'))
                                ->route('platform.systems.banners.edit', $banner->id)
                                ->icon('pencil'),

                            Button::make(__('Delete'))
                                ->icon('trash')
                                ->confirm(__('Are you sure?'))
                                ->method('remove', [
                                    'banner' => $banner->id,
                                ]),
                        ]);
                }),

            TD::make('id', __('ID'))->sort(),

            TD::make('image', __('Image'))->render(function (Banner $model) {
                return view('orchid.contents.only-image-card', ['image' => $model->image_url]);
            }),
            TD::make('description', __('Description')),
            TD::make('priority', __('Priority')),
            TD::make('for_whom', __('For Whom'))
                ->render(fn(Banner $banner) => ForWhom::tryFrom($banner->for_whom)->name),
            TD::make('status', __('Status'))
                ->render(fn(Banner $banner) => Status::tryFrom($banner->status)->name),
        ];
    }
}
