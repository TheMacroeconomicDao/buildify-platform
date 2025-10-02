<?php

namespace App\Orchid\Layouts\Order;

use App\Enums\Order\Status;
use App\Enums\Users\Type as UserType;
use App\Models\User;
use App\Models\WorkDirection;
use App\Models\WorkType;
use Orchid\Screen\Fields\Attach;
use Orchid\Screen\Fields\DateTimer;
use Orchid\Screen\Fields\Input;
use Orchid\Screen\Fields\Select;
use Orchid\Screen\Fields\TextArea;
use Orchid\Screen\Layouts\Rows;
use ReflectionException;

class CreateLayout extends Rows
{
    /**
     * @return iterable
     * @throws ReflectionException
     */
    protected function fields(): iterable
    {
        // Получаем направления и типы работ из БД
        $directions = WorkDirection::active()->ordered()->get()->mapWithKeys(function ($direction) {
            return [$direction->key => $direction->getLocalizedName('en')];
        })->toArray();
        
        $workTypes = WorkType::active()->ordered()->get()->mapWithKeys(function ($workType) {
            return [$workType->key => $workType->getLocalizedName('en')];
        })->toArray();

        return [
            Input::make('order.title')
                ->title(__('Title')),

            Select::make('order.work_direction')
                ->title(__('Work direction'))
                ->options($directions),

            Select::make('order.work_type')
                ->title(__('Work type'))
                ->options($workTypes),

            TextArea::make('order.description')
                ->title(__('Description')),

            Attach::make('attachments')
                ->title(__('Attachments'))
                ->multiple(),



            Input::make('order.city')
                ->title(__('City')),

            Input::make('order.address')
                ->title(__('Address')),

            Input::make('order.max_amount')
                ->type('number')
                ->title(__('Max amount')),

            Select::make('order.executor_id')
                ->title(__('Executor'))
                ->fromQuery(User::query()->where('type', UserType::Executor->value), 'searchString', 'id'),

            Select::make('order.author_id')
                ->title(__('Customer'))
                ->fromQuery(User::query()->where('type', UserType::Customer->value), 'searchString', 'id'),

            Select::make('order.status')
                ->title(__('Status'))
                ->fromEnum(Status::class),

//            ●	AI генерация да/нет @todo
        ];
    }
}
