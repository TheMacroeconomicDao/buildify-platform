<?php

declare(strict_types=1);

namespace App\Orchid\Layouts\Subscription;

use App\Models\Tariff;
use Orchid\Platform\Models\User;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Actions\DropDown;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Actions\ModalToggle;
use Orchid\Screen\Components\Cells\DateTimeSplit;
use Orchid\Screen\Fields\Input;
use Orchid\Screen\Layouts\Persona;
use Orchid\Screen\Layouts\Table;
use Orchid\Screen\TD;

class SubscriptionListLayout extends Table
{
    /**
     * @var string
     */
    public $target = 'subscription';

    /**
     * @return TD[]
     */
    public function columns(): array
    {
        return [
            TD::make('id', __('Id'))
                ->sort()
                ->cantHide()
                ->filter(Input::make()),

            TD::make('name', __('Name'))
                ->sort()
                ->cantHide()
                ->filter(Input::make()),

            TD::make('amount', __('Amount'))
                ->sort()
                ->cantHide()
                ->filter(Input::make())
                ->render(function ($subscription) {
                    return $subscription->amount / 100;
                }),

            TD::make('month', __('Period'))
                ->sort()
                ->cantHide()
                ->filter(Input::make()),

            TD::make('created_at', __('Created'))
                ->usingComponent(DateTimeSplit::class)
                ->align(TD::ALIGN_RIGHT)
                ->sort(),

            TD::make('updated_at', __('Last edit'))
                ->usingComponent(DateTimeSplit::class)
                ->align(TD::ALIGN_RIGHT)
                ->sort(),

            TD::make(__('Actions'))
                ->align(TD::ALIGN_CENTER)
                ->width('100px')
                ->render(fn (Tariff $subscription) => DropDown::make()
                    ->icon('bs.three-dots-vertical')
                    ->list([

                        Link::make(__('Edit'))
                            ->route('platform.systems.subscription.edit', $subscription->id)
                            ->icon('bs.pencil'),

                        Button::make(__('Delete'))
                            ->icon('bs.trash3')
                            ->confirm(__('Are you sure you want to delete the training?'))
                            ->method('remove', [
                                'id' => $subscription->id,
                            ]),
                    ])),
        ];
    }
}
