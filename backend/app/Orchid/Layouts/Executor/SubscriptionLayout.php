<?php

namespace App\Orchid\Layouts\Executor;

use App\Models\Tariff;
use Orchid\Screen\Fields\Select;
use Orchid\Screen\Fields\Input;
use Orchid\Screen\Fields\Group;
use Orchid\Screen\Layouts\Rows;

class SubscriptionLayout extends Rows
{
    /**
     * @return iterable
     */
    protected function fields(): iterable
    {
        return [
            Group::make([
                Input::make('current_subscription_info')
                    ->title('Current Subscription')
                    ->value('')
                    ->readonly()
                    ->help('Current active subscription for this executor'),
            ])->fullWidth(),

            Group::make([
                Select::make('new_tariff_id')
                    ->title('Change Subscription To')
                    ->options($this->query->get('tariff_options', []))
                    ->empty('Select new tariff...', '')
                    ->help('Choose a new subscription plan for this executor'),

                Input::make('custom_duration_days')
                    ->type('number')
                    ->title('Custom Duration (days)')
                    ->placeholder('Leave empty for default duration')
                    ->help('Override default tariff duration (1-365 days)')
                    ->min(1)
                    ->max(365),
            ])->autoWidth(),

            Group::make([
                Input::make('extend_days')
                    ->type('number')
                    ->title('Extend Current Subscription (days)')
                    ->placeholder('Enter days to extend')
                    ->help('Add extra days to current subscription without changing tariff')
                    ->min(1)
                    ->max(365),
            ])->autoWidth(),
        ];
    }
}
