<?php

namespace App\Orchid\Layouts\Banner;

use App\Models\Banner;
use Orchid\Screen\Layouts\Legend;
use Orchid\Screen\Sight;

class ShowLayout extends Legend
{
    protected $target = 'banner';

    /**
     * @return iterable
     */
    protected function columns(): iterable
    {
        return [
            Sight::make('id', 'ID'),

            Sight::make('image', __('Image'))->render(function (Banner $model) {
                return view('orchid.contents.only-image-card', ['image' => $model->image_url]);
            }),
        ];
    }
}
