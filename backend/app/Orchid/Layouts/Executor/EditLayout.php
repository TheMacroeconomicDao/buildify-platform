<?php

namespace App\Orchid\Layouts\Executor;

use App\Enums\Users\Status;
use Orchid\Screen\Fields\Input;
use Orchid\Screen\Fields\Select;
use Orchid\Screen\Layouts\Rows;

class EditLayout extends Rows
{
    /**
     * @return iterable
     */
    protected function fields(): iterable
    {
        return [


            Input::make('executor.name')
                ->title(__('Name')),

            Input::make('executor.phone')
                ->title(__('Phone')),

            Input::make('executor.email')
                ->title(__('Email')),

            Input::make('executor.telegram')
                ->title(__('Telegram')),

            Input::make('executor.whatsApp')
                ->title(__('WhatsApp')),

            Input::make('executor.facebook')
                ->title(__('Facebook')),

            Input::make('executor.viber')
                ->title(__('Viber')),

                    Input::make('license_info')
            ->title('License')
            ->value(function () {
                $user = $this->query->get('executor');
                if ($user && $user->license_file_path) {
                    return '📄 ' . basename($user->license_file_path) . ' (uploaded)';
                }
                return 'License not uploaded';
            })
            ->readonly()
            ->help('Licenses are uploaded via mobile app and verified in "Licenses" section'),

            Input::make('executor.about_me')
                ->title(__('About me')),

            //-- 11.	Portfolio @todo

            Select::make('executor.status')
                ->title(__('Status'))
                ->options([
                    Status::Active->value => __('user.status.' . Status::Active->name),
                    Status::Deleted->value => __('user.status.' . Status::Deleted->name),
                ]),

            Input::make('password')
                ->title(__('Password')),
        ];
    }
}
