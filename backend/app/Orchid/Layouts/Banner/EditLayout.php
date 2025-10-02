<?php

namespace App\Orchid\Layouts\Banner;

use App\Enums\Banner\ForWhom;
use App\Enums\Banner\Status;
use Orchid\Screen\Fields\Attach;
use Orchid\Screen\Fields\Input;
use Orchid\Screen\Fields\Select;
use Orchid\Screen\Fields\TextArea;
use Orchid\Screen\Layouts\Rows;
use ReflectionException;

class EditLayout extends Rows
{
    /**
     * @return iterable
     * @throws ReflectionException
     */
    protected function fields(): iterable
    {
        return [
            Attach::make('image_id')
                ->title(__('Image'))
                ->accept('image/*')
                ->maxSize(2048),

            TextArea::make('banner.description')
                ->title(__('Description')),

            Input::make('banner.priority')
                ->type('number')
                ->title(__('Priority')),

            Select::make('banner.for_whom')
                ->title(__('For whom'))
                ->fromEnum(ForWhom::class),

            Select::make('banner.status')
                ->title(__('Status'))
                ->fromEnum(Status::class),
        ];
    }
}
