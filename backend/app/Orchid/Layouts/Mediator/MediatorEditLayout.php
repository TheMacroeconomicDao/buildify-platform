<?php

declare(strict_types=1);

namespace App\Orchid\Layouts\Mediator;

use App\Enums\Users\Status;
use Orchid\Screen\Field;
use Orchid\Screen\Fields\Input;
use Orchid\Screen\Fields\Password;
use Orchid\Screen\Fields\Select;
use Orchid\Screen\Fields\TextArea;
use Orchid\Screen\Layouts\Rows;

class MediatorEditLayout extends Rows
{
    /**
     * The screen's layout elements.
     *
     * @return Field[]
     */
    public function fields(): array
    {
        return [
            Input::make('mediator.name')
                ->type('text')
                ->max(255)
                ->required()
                ->title('Name')
                ->placeholder('Enter mediator name'),

            Input::make('mediator.email')
                ->type('email')
                ->required()
                ->title('Email')
                ->placeholder('example@example.com'),

            Input::make('mediator.phone')
                ->type('tel')
                ->title('Phone')
                ->placeholder('+971501234567'),

            Password::make('mediator.password')
                ->title('Password')
                ->placeholder('Leave empty to keep unchanged'),

            Select::make('mediator.status')
                ->options([
                    Status::Active->value => 'Active (0)',
                    Status::Inactive->value => 'Inactive (1)',
                ])
                ->title('Status')
                ->required()
                ->help('Mediator activity status in the system'),

            Input::make('mediator.telegram')
                ->title('Telegram')
                ->placeholder('@username'),

            Input::make('mediator.whatsApp')
                ->title('WhatsApp')
                ->placeholder('+971501234567'),

            TextArea::make('mediator.about_me')
                ->title('About Mediator')
                ->rows(3)
                ->placeholder('Description of mediator activities'),
        ];
    }
}
