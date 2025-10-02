<?php

declare(strict_types=1);

namespace App\Orchid\Layouts\Mediator;

use App\Models\User;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Actions\DropDown;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Components\Cells\DateTimeSplit;
use Orchid\Screen\Fields\Input;
use Orchid\Screen\Layouts\Table;
use Orchid\Screen\TD;

class MediatorListLayout extends Table
{
    /**
     * @var string
     */
    public $target = 'mediators';

    /**
     * @return TD[]
     */
    public function columns(): array
    {
        return [
            TD::make('id', 'ID')
                ->sort()
                ->cantHide()
                ->filter(Input::make()),

            TD::make('name', __('Name'))
                ->sort()
                ->cantHide()
                ->filter(Input::make())
                ->render(function (User $user) {
                    return Link::make($user->name)
                        ->route('platform.systems.mediators.edit', $user);
                }),

            TD::make('email', __('Email'))
                ->sort()
                ->cantHide()
                ->filter(Input::make()),

            TD::make('phone', __('Phone'))
                ->filter(Input::make()),

            TD::make('status', __('Status'))
                ->render(function (User $user) {
                    return $user->status === 0 
                        ? '<span class="badge bg-success">Active</span>' 
                        : '<span class="badge bg-danger">Inactive</span>';
                }),

            TD::make('mediator_margin', 'Margin')
                ->render(function (User $user) {
                    $margin = [];
                    if ($user->mediator_margin_percentage) {
                        $margin[] = $user->mediator_margin_percentage . '%';
                    }
                    if ($user->mediator_fixed_fee) {
                        $margin[] = $user->mediator_fixed_fee . ' AED';
                    }
                    if ($user->mediator_agreed_price) {
                        $margin[] = 'Contract: ' . $user->mediator_agreed_price . ' AED';
                    }
                    return !empty($margin) ? implode('<br>', $margin) : '<span class="text-muted">Not configured</span>';
                }),

            TD::make('created_at', __('Created'))
                ->usingComponent(DateTimeSplit::class)
                ->align(TD::ALIGN_RIGHT)
                ->defaultHidden()
                ->sort(),

            TD::make('updated_at', __('Last edit'))
                ->usingComponent(DateTimeSplit::class)
                ->align(TD::ALIGN_RIGHT)
                ->sort(),

            TD::make(__('Actions'))
                ->align(TD::ALIGN_CENTER)
                ->width('100px')
                ->render(fn (User $user) => DropDown::make()
                    ->icon('bs.three-dots-vertical')
                    ->list([
                        Link::make(__('Edit'))
                            ->route('platform.systems.mediators.edit', $user)
                            ->icon('bs.pencil'),

                        Button::make(__('Delete'))
                            ->icon('bs.trash3')
                            ->confirm(__('Once the mediator is deleted, all of its resources and data will be permanently deleted. Before deleting your mediator, please download any data or information that you wish to retain.'))
                            ->method('remove', [
                                'user' => $user->id,
                            ]),
                    ])),
        ];
    }
}
