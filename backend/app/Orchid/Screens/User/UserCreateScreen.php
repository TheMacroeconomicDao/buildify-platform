<?php

namespace App\Orchid\Screens\User;

use App\Models\User;
use App\Enums\Users\Type;
use App\Enums\Users\Status;
use App\Enums\Users\VerificationStatus;
use App\Orchid\Layouts\User\UserFormLayout;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Toast;

class UserCreateScreen extends Screen
{
    /**
     * Fetch data to be displayed on the screen.
     */
    public function query(): iterable
    {
        return [];
    }

    /**
     * The name of the screen displayed in the header.
     */
    public function name(): ?string
    {
        return 'Create User';
    }

    /**
     * The screen's description.
     */
    public function description(): ?string
    {
        return 'Create a new user in the system';
    }

    /**
     * The screen's action buttons.
     */
    public function commandBar(): iterable
    {
        return [
            Button::make('Create User')
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
    public function save(Request $request)
    {
        $request->validate([
            'user.name' => ['required', 'string', 'max:255'],
            'user.email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'user.phone' => ['nullable', 'string', 'max:20'],
            'user.type' => ['required', 'integer', 'in:' . implode(',', array_column(Type::cases(), 'value'))],
            'user.password' => ['required', 'string', 'min:8'],
        ]);

        $userData = $request->get('user');
        
        User::create([
            'name' => $userData['name'],
            'email' => $userData['email'],
            'phone' => $userData['phone'] ?? null,
            'type' => $userData['type'],
            'status' => Status::Active->value,
            'verification_status' => $userData['type'] == Type::Customer->value 
                ? VerificationStatus::NotRequired->value 
                : VerificationStatus::Pending->value,
            'password' => Hash::make($userData['password']),
            'email_verified_at' => now(),
        ]);

        Toast::info('User created successfully');

        return redirect()->route('platform.users.list');
    }
}
