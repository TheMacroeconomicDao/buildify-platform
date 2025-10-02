<?php

namespace App\Orchid\Screens\Wallet;

use App\Models\User;
use App\Models\WalletTransaction;
use App\Orchid\Layouts\Wallet\WalletTransactionsLayout;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Screen;

class WalletTransactionsScreen extends Screen
{
    /**
     * @var User
     */
    public $user;

    /**
     * Fetch data to be displayed on the screen.
     */
    public function query(User $user): iterable
    {
        return [
            'user' => $user,
            'transactions' => WalletTransaction::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->paginate(50),
            'total_transactions' => WalletTransaction::where('user_id', $user->id)->count(),
            'current_balance' => $user->wallet_balance ?? 0,
        ];
    }

    /**
     * The name of the screen displayed in the header.
     */
    public function name(): ?string
    {
        return 'Wallet Transactions: ' . $this->user->name;
    }

    /**
     * The screen's description.
     */
    public function description(): ?string
    {
        $balance = ($this->user->wallet_balance ?? 0) / 100;
        return "Current balance: {$balance} AED | Total transactions: " . $this->query($this->user)['total_transactions'];
    }

    /**
     * The screen's action buttons.
     */
    public function commandBar(): iterable
    {
        return [
            Link::make('Back to Wallets')
                ->icon('bs.arrow-left')
                ->route('platform.wallet.list'),

            Link::make('Edit User')
                ->icon('bs.pencil')
                ->route('platform.users.edit', $this->user->id),
        ];
    }

    /**
     * The screen's layout elements.
     */
    public function layout(): iterable
    {
        return [
            WalletTransactionsLayout::class,
        ];
    }
}
