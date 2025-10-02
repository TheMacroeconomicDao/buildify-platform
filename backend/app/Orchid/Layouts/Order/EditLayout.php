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

class EditLayout extends Rows
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
                ->title('Title'),

            Select::make('order.work_direction')
                ->title('Work direction')
                ->options($directions),

            Select::make('order.work_type')
                ->title('Work type')
                ->options($workTypes),

            TextArea::make('order.description')
                ->title('Description'),

            Input::make('order.city')
                ->title('City'),

            Input::make('order.address')
                ->title('Address'),



            Input::make('order.max_amount')
                ->type('number')
                ->title('Max amount'),

            Select::make('order.executor_id')
                ->title('Executor')
                ->options(User::where('type', UserType::Executor->value)->pluck('name', 'id')->toArray())
                ->empty('No executor'),

            Select::make('order.status')
                ->title('Status')
                ->options([
                    Status::SearchExecutor->value => 'Search Executor',
                    Status::Cancelled->value => 'Cancelled',
                    Status::SelectingExecutor->value => 'Selecting Executor',
                    Status::ExecutorSelected->value => 'Executor Selected',
                    Status::InWork->value => 'In Work',
                    Status::AwaitingConfirmation->value => 'Awaiting Confirmation',
                    Status::Rejected->value => 'Rejected',
                    Status::Closed->value => 'Closed',
                    Status::Completed->value => 'Completed',
                    Status::Deleted->value => 'Deleted',
                ]),
        ];
    }
}
