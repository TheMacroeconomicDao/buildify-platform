<?php

namespace App\Orchid\Screens\Wallet;

use App\Models\User;
use App\Models\WalletTransaction;
use App\Services\WalletService;
use App\Orchid\Layouts\Wallet\WalletListLayout;
use Illuminate\Http\Request;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Actions\ModalToggle;
use Orchid\Screen\Fields\Input;
use Orchid\Screen\Fields\Select;
use Orchid\Screen\Layouts\Modal;
use Orchid\Screen\Layouts\Rows;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Layout;
use Orchid\Support\Facades\Toast;

class WalletListScreen extends Screen
{
    /**
     * Fetch data to be displayed on the screen.
     */
    public function query(): iterable
    {
        // Calculate statistics
        $totalBalance = User::sum('wallet_balance') ?? 0;
        $usersWithBalance = User::where('wallet_balance', '>', 0)->count();
        
        return [
            'users' => User::select(['id', 'name', 'email', 'type', 'wallet_balance', 'wallet_currency'])
                ->where('wallet_balance', '>', 0)
                ->orWhereNotNull('wallet_balance')
                ->orderBy('wallet_balance', 'desc')
                ->paginate(50),
            
            'total_balance' => $totalBalance,
            'users_with_balance' => $usersWithBalance,
            'total_balance_aed' => $totalBalance / 100, // Convert to AED for display
            'average_balance_aed' => $usersWithBalance > 0 ? ($totalBalance / $usersWithBalance) / 100 : 0,
        ];
    }

    /**
     * The name of the screen displayed in the header.
     */
    public function name(): ?string
    {
        return 'Wallet Management';
    }

    /**
     * The screen's description.
     */
    public function description(): ?string
    {
        return 'Manage user wallet balances and view transactions';
    }

    /**
     * The screen's action buttons.
     */
    public function commandBar(): iterable
    {
        return [
            ModalToggle::make('Add Balance')
                ->icon('bs.plus-circle')
                ->modal('addBalanceModal')
                ->method('addBalance'),
        ];
    }

    /**
     * The screen's layout elements.
     */
    public function layout(): iterable
    {
        return [
            Layout::view('orchid.wallet.stats'),
            
            WalletListLayout::class,

            Layout::modal('addBalanceModal', [
                Layout::rows([
                    Select::make('user_id')
                        ->title('Select User')
                        ->fromQuery(User::query(), 'name', 'id')
                        ->required(),

                    Input::make('amount')
                        ->title('Amount (AED)')
                        ->type('number')
                        ->step(0.01)
                        ->min(0)
                        ->required()
                        ->help('Amount in AED (will be converted to cents)'),

                    Select::make('operation')
                        ->title('Operation')
                        ->options([
                            'add' => 'Add to balance',
                            'subtract' => 'Subtract from balance',
                            'set' => 'Set balance to',
                        ])
                        ->required(),

                    Input::make('reason')
                        ->title('Reason')
                        ->placeholder('Admin adjustment reason')
                        ->required(),
                ])
            ])->title('Adjust User Balance'),

            Layout::modal('adjustBalanceModal', [
                Layout::rows([
                    Input::make('amount')
                        ->title('Amount (AED)')
                        ->type('number')
                        ->step(0.01)
                        ->min(0)
                        ->required()
                        ->help('Amount in AED (will be converted to cents)'),

                    Select::make('operation')
                        ->title('Operation')
                        ->options([
                            'add' => 'Add to balance',
                            'subtract' => 'Subtract from balance',
                            'set' => 'Set balance to',
                        ])
                        ->required(),

                    Input::make('reason')
                        ->title('Reason')
                        ->placeholder('Admin adjustment reason')
                        ->required(),
                ])
            ])->title('Adjust User Balance'),
        ];
    }

    /**
     * Add balance to user
     */
    public function addBalance(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'amount' => 'required|numeric|min:0',
            'operation' => 'required|in:add,subtract,set',
            'reason' => 'required|string|max:255',
        ]);

        $user = User::findOrFail($request->user_id);
        $amountCents = (int) ($request->amount * 100); // Convert AED to cents
        $oldBalance = $user->wallet_balance ?? 0;

        try {
            switch ($request->operation) {
                case 'add':
                    $newBalance = $oldBalance + $amountCents;
                    break;
                case 'subtract':
                    $newBalance = max(0, $oldBalance - $amountCents);
                    break;
                case 'set':
                    $newBalance = $amountCents;
                    break;
            }

            // Create transaction record
            WalletTransaction::create([
                'user_id' => $user->id,
                'type' => 'admin_adjustment',
                'amount' => abs($newBalance - $oldBalance),
                'balance_before' => $oldBalance,
                'balance_after' => $newBalance,
                'currency' => 'aed',
                'meta' => [
                    'admin_id' => auth()->id(),
                    'admin_name' => auth()->user()->name,
                    'operation' => $request->operation,
                    'reason' => $request->reason,
                    'original_amount_aed' => $request->amount,
                ],
            ]);

            // Update user balance
            $user->update([
                'wallet_balance' => $newBalance,
                'wallet_currency' => 'aed',
            ]);

            $balanceAED = $newBalance / 100;
            Toast::info("Balance updated successfully. New balance: {$balanceAED} AED");

        } catch (\Exception $e) {
            Toast::error('Error updating balance: ' . $e->getMessage());
        }
    }

    /**
     * Adjust balance for specific user
     */
    public function adjustUserBalance(Request $request)
    {
        $request->validate([
            'user' => 'required|exists:users,id',
            'amount' => 'required|numeric|min:0',
            'operation' => 'required|in:add,subtract,set',
            'reason' => 'required|string|max:255',
        ]);

        $user = User::findOrFail($request->user);
        $amountCents = (int) ($request->amount * 100); // Convert AED to cents
        $oldBalance = $user->wallet_balance ?? 0;

        try {
            switch ($request->operation) {
                case 'add':
                    $newBalance = $oldBalance + $amountCents;
                    break;
                case 'subtract':
                    $newBalance = max(0, $oldBalance - $amountCents);
                    break;
                case 'set':
                    $newBalance = $amountCents;
                    break;
            }

            // Create transaction record
            WalletTransaction::create([
                'user_id' => $user->id,
                'type' => 'admin_adjustment',
                'amount' => abs($newBalance - $oldBalance),
                'balance_before' => $oldBalance,
                'balance_after' => $newBalance,
                'currency' => 'aed',
                'meta' => [
                    'admin_id' => auth()->id(),
                    'admin_name' => auth()->user()->name,
                    'operation' => $request->operation,
                    'reason' => $request->reason,
                    'original_amount_aed' => $request->amount,
                ],
            ]);

            // Update user balance
            $user->update([
                'wallet_balance' => $newBalance,
                'wallet_currency' => 'aed',
            ]);

            $balanceAED = $newBalance / 100;
            Toast::info("Balance updated successfully for {$user->name}. New balance: {$balanceAED} AED");

        } catch (\Exception $e) {
            Toast::error('Error updating balance: ' . $e->getMessage());
        }
    }
}
