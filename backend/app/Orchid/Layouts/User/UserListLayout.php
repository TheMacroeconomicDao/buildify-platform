<?php

declare(strict_types=1);

namespace App\Orchid\Layouts\User;

use App\Models\User;
use App\Enums\Users\Type;
use App\Enums\Users\Status;
use App\Enums\Users\VerificationStatus;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Actions\DropDown;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Actions\ModalToggle;
use Orchid\Screen\Components\Cells\DateTimeSplit;
use Orchid\Screen\Fields\Input;
use Orchid\Screen\Fields\Select;
use Orchid\Screen\Layouts\Table;
use Orchid\Screen\TD;

class UserListLayout extends Table
{
    /**
     * @var string
     */
    public $target = 'users';

    /**
     * @return TD[]
     */
    public function columns(): array
    {
        return [
            TD::make('name', 'Name')
                ->sort()
                ->cantHide()
                ->filter(Input::make())
                ->render(fn (User $user) => $user->name ?: 'Not specified'),

            TD::make('email', 'Email')
                ->sort()
                ->cantHide()
                ->filter(Input::make())
                ->render(fn (User $user) => ModalToggle::make($user->email)
                    ->modal('editUserModal')
                    ->modalTitle($user->name ?: $user->email)
                    ->method('saveUser')
                    ->asyncParameters([
                        'user' => $user->id,
                    ])),

            TD::make('phone', 'Phone')
                ->render(fn (User $user) => $user->phone ?: '—'),

            TD::make('type', 'Type')
                ->sort()
                ->filter(Select::make()->options([
                    Type::Customer->value => 'Customer',
                    Type::Executor->value => 'Executor',
                    Type::Admin->value => 'Administrator',
                ]))
                ->render(function (User $user) {
                    return match($user->type) {
                        Type::Customer->value => '<span class="badge bg-primary">Customer</span>',
                        Type::Executor->value => '<span class="badge bg-success">Executor</span>',
                        Type::Admin->value => '<span class="badge bg-danger">Administrator</span>',
                        default => '<span class="badge bg-secondary">Unknown</span>'
                    };
                }),

            TD::make('status', 'Status')
                ->sort()
                ->filter(Select::make()->options([
                    Status::Active->value => 'Active',
                    Status::Inactive->value => 'Inactive',
                ]))
                ->render(function (User $user) {
                    return match($user->status) {
                        Status::Active->value => '<span class="badge bg-success">Active</span>',
                        Status::Inactive->value => '<span class="badge bg-danger">Inactive</span>',
                        Status::Deleted->value => '<span class="badge bg-secondary">Deleted</span>',
                        default => '<span class="badge bg-secondary">Unknown</span>'
                    };
                }),

            TD::make('verification_status', 'Verification')
                ->sort()
                ->render(function (User $user) {
                    return match($user->verification_status) {
                        VerificationStatus::Pending->value => '<span class="badge bg-warning">Pending</span>',
                        VerificationStatus::Approved->value => '<span class="badge bg-success">Approved</span>',
                        VerificationStatus::Rejected->value => '<span class="badge bg-danger">Rejected</span>',
                        VerificationStatus::NotRequired->value => '<span class="badge bg-info">Not Required</span>',
                        default => '<span class="badge bg-secondary">Unknown</span>'
                    };
                }),

            TD::make('orders_count', 'Orders')
                ->render(function (User $user) {
                    return $user->type === Type::Customer->value 
                        ? "C: {$user->customer_orders_count}" 
                        : "E: {$user->executor_orders_count}";
                }),

            TD::make('rating', 'Rating')
                ->render(function (User $user) {
                    if ($user->type === Type::Customer->value && $user->customer_rating) {
                        $rating = is_numeric($user->customer_rating) ? (float) $user->customer_rating : 0;
                        return "⭐ " . round($rating, 1);
                    } elseif ($user->type === Type::Executor->value && $user->executor_rating) {
                        $rating = is_numeric($user->executor_rating) ? (float) $user->executor_rating : 0;
                        return "⭐ " . round($rating, 1);
                    }
                    return '—';
                }),

            TD::make('wallet_balance', 'Wallet Balance')
                ->render(function (User $user) {
                    $balance = ($user->wallet_balance ?? 0) / 100; // Convert cents to AED
                    return $balance > 0 
                        ? '<span class="badge bg-success">' . number_format($balance, 2) . ' AED</span>'
                        : '<span class="badge bg-secondary">0.00 AED</span>';
                }),

            TD::make('created_at', 'Registration')
                ->usingComponent(DateTimeSplit::class)
                ->align(TD::ALIGN_RIGHT)
                ->defaultHidden()
                ->sort(),

            TD::make('updated_at', 'Updated')
                ->usingComponent(DateTimeSplit::class)
                ->align(TD::ALIGN_RIGHT)
                ->defaultHidden()
                ->sort(),

            TD::make('actions', 'Actions')
                ->align(TD::ALIGN_CENTER)
                ->width('150px')
                ->render(fn (User $user) => DropDown::make()
                    ->icon('bs.three-dots-vertical')
                    ->list([
                        Link::make('View')
                            ->route('platform.users.edit', $user->id)
                            ->icon('bs.eye'),

                        Link::make('Edit')
                            ->route('platform.users.edit', $user->id)
                            ->icon('bs.pencil'),

                        Button::make('Deactivate')
                            ->icon('bs.lock')
                            ->confirm('Are you sure?')
                            ->method('deactivate', [
                                'user' => $user->id,
                            ])
                            ->canSee($user->status === Status::Active->value),

                        Button::make('Activate')
                            ->icon('bs.unlock')
                            ->confirm('Are you sure?')
                            ->method('activate', [
                                'user' => $user->id,
                            ])
                            ->canSee($user->status === Status::Inactive->value),

                        Button::make('Delete')
                            ->icon('bs.trash')
                            ->confirm('After deleting the account, all its resources and data will be permanently deleted.')
                            ->method('remove', [
                                'user' => $user->id,
                            ]),
                    ])),
        ];
    }
}