<?php

namespace App\Orchid\Screens\Referral;

use App\Models\ReferralSetting;
use Orchid\Screen\Fields\Input;
use Orchid\Screen\Fields\CheckBox;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Layout;
use Orchid\Support\Facades\Toast;
use Illuminate\Http\Request;

class SimpleReferralSettingsScreen extends Screen
{
    /**
     * Fetch data to be displayed on the screen.
     */
    public function query(): iterable
    {
        return [
            'cashback_percentage' => ReferralSetting::get('cashback_percentage', '10.00'),
            'min_cashback_amount' => ReferralSetting::get('min_cashback_amount', '100'),
            'max_cashback_per_transaction' => ReferralSetting::get('max_cashback_per_transaction', '10000'),
            'program_enabled' => ReferralSetting::get('program_enabled', 'true') === 'true',
        ];
    }

    /**
     * The name of the screen displayed in the header.
     */
    public function name(): ?string
    {
        return 'Referral Program Settings';
    }

    /**
     * The screen's description.
     */
    public function description(): ?string
    {
        return 'Manage referral system parameters and cashback settings';
    }

    /**
     * The screen's action buttons.
     */
    public function commandBar(): iterable
    {
        return [
            Button::make('Save Settings')
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
            Layout::rows([
                CheckBox::make('program_enabled')
                    ->title('Enable Referral Program')
                    ->placeholder('Activate referral system')
                    ->help('If disabled, new referrals will not be registered and cashback will not be credited'),

                Input::make('cashback_percentage')
                    ->title('Cashback Percentage (%)')
                    ->type('number')
                    ->step(0.01)
                    ->min(0)
                    ->max(100)
                    ->required()
                    ->help('Percentage of top-up amount that referrer receives'),

                Input::make('min_cashback_amount')
                    ->title('Minimum Cashback Amount (cents)')
                    ->type('number')
                    ->min(0)
                    ->required()
                    ->help('Minimum top-up amount to qualify for cashback (in cents)'),

                Input::make('max_cashback_per_transaction')
                    ->title('Maximum Cashback Per Transaction (cents)')
                    ->type('number')
                    ->min(0)
                    ->required()
                    ->help('Maximum cashback amount per single top-up (in cents)'),
            ])
        ];
    }

    /**
     * Save settings
     */
    public function save(Request $request)
    {
        $request->validate([
            'cashback_percentage' => 'required|numeric|min:0|max:100',
            'min_cashback_amount' => 'required|integer|min:0',
            'max_cashback_per_transaction' => 'required|integer|min:0',
            'program_enabled' => 'boolean',
        ]);

        // Сохраняем настройки
        ReferralSetting::set('program_enabled', $request->boolean('program_enabled') ? 'true' : 'false');
        ReferralSetting::set('cashback_percentage', $request->get('cashback_percentage'));
        ReferralSetting::set('min_cashback_amount', $request->get('min_cashback_amount'));
        ReferralSetting::set('max_cashback_per_transaction', $request->get('max_cashback_per_transaction'));

        Toast::info('Referral program settings saved successfully');

        return redirect()->route('platform.referrals.settings');
    }
}
