<?php

namespace App\Orchid\Layouts\Wallet;

use App\Models\User;
use App\Enums\Users\Type;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Actions\DropDown;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Actions\ModalToggle;
use Orchid\Screen\Layouts\Table;
use Orchid\Screen\TD;

class WalletListLayout extends Table
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
            TD::make('name', 'User Name')
                ->sort()
                ->cantHide()
                ->render(fn (User $user) => $user->name ?: 'Not specified'),

            TD::make('email', 'Email')
                ->sort()
                ->cantHide()
                ->render(fn (User $user) => $user->email),

            TD::make('type', 'Type')
                ->sort()
                ->render(function (User $user) {
                    return match($user->type) {
                        Type::Customer->value => '<span class="badge bg-primary">Customer</span>',
                        Type::Executor->value => '<span class="badge bg-success">Executor</span>',
                        Type::Mediator->value => '<span class="badge bg-info">Mediator</span>',
                        Type::Admin->value => '<span class="badge bg-danger">Administrator</span>',
                        default => '<span class="badge bg-secondary">Unknown</span>'
                    };
                }),

            TD::make('wallet_balance', 'Balance (AED)')
                ->sort()
                ->render(function (User $user) {
                    $balance = ($user->wallet_balance ?? 0) / 100;
                    $color = $balance > 0 ? 'success' : 'secondary';
                    return '<span class="badge bg-' . $color . '">' . number_format($balance, 2) . ' AED</span>';
                }),

            TD::make('wallet_currency', 'Currency')
                ->render(fn (User $user) => strtoupper($user->wallet_currency ?? 'aed')),

            TD::make('actions', 'Actions')
                ->align(TD::ALIGN_CENTER)
                ->width('200px')
                ->render(fn (User $user) => DropDown::make()
                    ->icon('bs.three-dots-vertical')
                    ->list([
                        Link::make('View Transactions')
                            ->route('platform.wallet.transactions', $user->id)
                            ->icon('bs.list'),

                        ModalToggle::make('Adjust Balance')
                            ->icon('bs.wallet2')
                            ->modal('adjustBalanceModal')
                            ->modalTitle('Adjust Balance: ' . $user->name)
                            ->method('adjustUserBalance')
                            ->asyncParameters([
                                'user' => $user->id,
                            ]),

                        Link::make('Edit User')
                            ->route('platform.users.edit', $user->id)
                            ->icon('bs.pencil'),
                    ])),
        ];
    }
}
