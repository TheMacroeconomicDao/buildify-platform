<?php

namespace App\Orchid\Layouts\User;

use App\Enums\Users\Type;
use App\Enums\Users\Status;
use App\Enums\Users\VerificationStatus;
use Orchid\Screen\Field;
use Orchid\Screen\Fields\Input;
use Orchid\Screen\Fields\Select;
use Orchid\Screen\Fields\Password;
use Orchid\Screen\Layouts\Rows;

class UserFormLayout extends Rows
{
    /**
     * Used to create the title of a group of form elements.
     */
    protected $title = 'User Information';

    /**
     * Get the fields elements to be displayed.
     */
    protected function fields(): iterable
    {
        return [
            Input::make('user.name')
                ->title('Name')
                ->placeholder('Enter user name')
                ->required()
                ->help('Full name of the user'),

            Input::make('user.email')
                ->title('Email')
                ->type('email')
                ->placeholder('Enter email address')
                ->required()
                ->help('User email address for login'),

            Input::make('user.phone')
                ->title('Phone')
                ->placeholder('+1234567890')
                ->help('User phone number'),

            Select::make('user.type')
                ->title('User Type')
                ->options([
                    Type::Customer->value => 'Customer',
                    Type::Executor->value => 'Executor',
                    Type::Mediator->value => 'Mediator',
                    Type::Admin->value => 'Administrator',
                ])
                ->required()
                ->help('Select user type/role'),

            Select::make('user.status')
                ->title('Status')
                ->options([
                    Status::Active->value => 'Active',
                    Status::Inactive->value => 'Inactive',
                ])
                ->value(Status::Active->value)
                ->required()
                ->help('User account status'),

            Select::make('user.verification_status')
                ->title('Verification Status')
                ->options([
                    VerificationStatus::Pending->value => 'Pending',
                    VerificationStatus::Approved->value => 'Approved',
                    VerificationStatus::Rejected->value => 'Rejected',
                    VerificationStatus::NotRequired->value => 'Not Required',
                ])
                ->value(VerificationStatus::NotRequired->value)
                ->required()
                ->help('User verification status'),

            Password::make('user.password')
                ->title('Password')
                ->placeholder('Enter password')
                ->help('Leave empty to keep current password (for editing)')
                ->canSee($this->query->get('user.id', false) === false), // Required only for new users

            Password::make('user.password')
                ->title('New Password')
                ->placeholder('Enter new password (optional)')
                ->help('Leave empty to keep current password')
                ->canSee($this->query->get('user.id', false) !== false), // Optional for existing users

            Input::make('user.wallet_balance')
                ->title('Wallet Balance (cents)')
                ->type('number')
                ->placeholder('0')
                ->value(0)
                ->help('Wallet balance in cents (100 = 1.00 AED)'),

            Input::make('user.wallet_currency')
                ->title('Wallet Currency')
                ->placeholder('aed')
                ->value('aed')
                ->readonly()
                ->help('Wallet currency (always AED)'),
        ];
    }
}
