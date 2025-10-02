<?php

namespace App\Orchid\Screens\User;

use App\Models\User;
use App\Enums\Users\Type;
use App\Enums\Users\Status;
use App\Enums\Users\VerificationStatus;
use App\Orchid\Layouts\User\UserFormLayout;
use App\Services\WalletService;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Toast;

class UserEditScreen extends Screen
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
            'user' => $user
        ];
    }

    /**
     * The name of the screen displayed in the header.
     */
    public function name(): ?string
    {
        return $this->user->exists ? 'Edit User' : 'Create User';
    }

    /**
     * The screen's description.
     */
    public function description(): ?string
    {
        return 'Update user information and settings';
    }

    /**
     * The screen's action buttons.
     */
    public function commandBar(): iterable
    {
        return [
            Button::make('Update User')
                ->icon('bs.check')
                ->method('save')
        ];
    }

    /**
     * The screen's layout elements.
     */
    public function layout(): iterable
    {
        return [
            UserFormLayout::class
        ];
    }

    /**
     * Save user
     */
    public function save(User $user, Request $request)
    {
        $request->validate([
            'user.name' => ['required', 'string', 'max:255'],
            'user.email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')
                    ->ignore($user->id)
                    ->where(function ($query) {
                        return $query->where('status', '!=', Status::Deleted->value);
                    })
            ],
            'user.phone' => ['nullable', 'string', 'max:20'],
            'user.type' => ['required', 'integer', 'in:' . implode(',', array_column(Type::cases(), 'value'))],
            'user.status' => ['required', 'integer', 'in:' . implode(',', array_column(Status::cases(), 'value'))],
            'user.verification_status' => ['required', 'integer', 'in:' . implode(',', array_column(VerificationStatus::cases(), 'value'))],
            'user.password' => ['nullable', 'string', 'min:8'],
            'user.wallet_balance' => ['nullable', 'integer', 'min:0'],
            'user.wallet_currency' => ['nullable', 'string', 'in:aed'],
        ]);

        $userData = $request->get('user');
        
        $updateData = [
            'name' => $userData['name'],
            'email' => $userData['email'],
            'phone' => $userData['phone'] ?? null,
            'type' => $userData['type'],
            'status' => $userData['status'],
            'verification_status' => $userData['verification_status'],
        ];

        // Only update password if provided
        if (!empty($userData['password'])) {
            $updateData['password'] = Hash::make($userData['password']);
        }

        // Handle wallet balance changes
        $oldBalance = $user->wallet_balance ?? 0;
        $newBalance = isset($userData['wallet_balance']) ? (int) $userData['wallet_balance'] : $oldBalance;
        
        if ($newBalance !== $oldBalance) {
            $updateData['wallet_balance'] = $newBalance;
            $updateData['wallet_currency'] = 'aed';
            
            // Create a transaction record for admin balance change
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
                    'adjustment_type' => $newBalance > $oldBalance ? 'increase' : 'decrease',
                    'reason' => 'Admin manual adjustment'
                ],
            ]);
        }

        $user->update($updateData);

        Toast::info('User updated successfully');

        return redirect()->route('platform.users.list');
    }
}