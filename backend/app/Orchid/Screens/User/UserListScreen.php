<?php

namespace App\Orchid\Screens\User;

use App\Models\User;
use App\Enums\Users\Status;
use App\Orchid\Layouts\User\UserListLayout;
use App\Orchid\Layouts\User\UserFilterLayout;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Screen;

use Orchid\Support\Facades\Toast;

class UserListScreen extends Screen
{
    /**
     * Fetch data to be displayed on the screen.
     */
    public function query(): iterable
    {
        return [
            'users' => User::with(['roles'])
                ->filters(UserFilterLayout::class)
                ->where('status', '!=', Status::Deleted->value)
                ->defaultSort('id', 'desc')
                ->paginate()
        ];
    }

    /**
     * The name of the screen displayed in the header.
     */
    public function name(): ?string
    {
        return 'User Management';
    }

    /**
     * The screen's description.
     */
    public function description(): ?string
    {
        return 'Manage all users in the system';
    }

    /**
     * The screen's action buttons.
     */
    public function commandBar(): iterable
    {
        return [
            Link::make('Create User')
                ->icon('bs.plus-circle')
                ->route('platform.users.create')
        ];
    }

    /**
     * The screen's layout elements.
     */
    public function layout(): iterable
    {
        return [
            UserFilterLayout::class,
            UserListLayout::class,
        ];
    }

    /**
     * Activate user
     */
    public function activate(User $user)
    {
        $user->update(['status' => Status::Active->value]);
        Toast::info('User activated successfully');
    }

    /**
     * Deactivate user
     */
    public function deactivate(User $user)
    {
        $user->update(['status' => Status::Inactive->value]);
        Toast::info('User deactivated successfully');
    }

    /**
     * Remove user (soft delete)
     */
    public function remove(User $user)
    {
        $user->update(['status' => Status::Deleted->value]);
        Toast::info('User deleted successfully');
    }
}

