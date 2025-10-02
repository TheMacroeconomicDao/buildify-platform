<?php

namespace App\Orchid\Screens\Referral;

use App\Models\ReferralSetting;
use Orchid\Screen\Fields\Input;
use Orchid\Screen\Fields\TextArea;
use Orchid\Screen\Fields\CheckBox;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Layout;
use Orchid\Support\Facades\Toast;
use Illuminate\Http\Request;

class ReferralSettingsScreen extends Screen
{
    /**
     * Fetch data to be displayed on the screen.
     */
    public function query(): iterable
    {
        $settings = ReferralSetting::all()->pluck('value', 'key')->toArray();
        
        return [
            'settings' => [
                'cashback_percentage' => $settings['cashback_percentage'] ?? '10.00',
                'min_cashback_amount' => ($settings['min_cashback_amount'] ?? 100) / 100, // Конвертируем в AED
                'max_cashback_per_transaction' => ($settings['max_cashback_per_transaction'] ?? 10000) / 100,
                'referral_active_days' => $settings['referral_active_days'] ?? '365',
                'program_enabled' => ($settings['program_enabled'] ?? 'true') === 'true',
            ]
        ];
    }

    /**
     * The name of the screen displayed in the header.
     */
    public function name(): ?string
    {
        return 'Настройки партнёрской программы';
    }

    /**
     * The screen's description.
     */
    public function description(): ?string
    {
        return 'Управление параметрами реферальной системы и кэшбэка';
    }

    /**
     * The screen's action buttons.
     */
    public function commandBar(): iterable
    {
        return [];
    }

    /**
     * The screen's layout elements.
     */
    public function layout(): iterable
    {
        return [
            Layout::rows([
                CheckBox::make('settings.program_enabled')
                    ->title('Включить партнёрскую программу')
                    ->placeholder('Активировать реферальную систему')
                    ->help('Если отключено, новые рефералы не будут регистрироваться и кэшбэк не будет начисляться'),

                Input::make('settings.cashback_percentage')
                    ->title('Процент кэшбэка (%)')
                    ->type('number')
                    ->step(0.01)
                    ->min(0)
                    ->max(100)
                    ->required()
                    ->help('Процент от суммы пополнения, который получает реферрер'),

                Input::make('settings.min_cashback_amount')
                    ->title('Минимальная сумма для кэшбэка (AED)')
                    ->type('number')
                    ->step(0.01)
                    ->min(0)
                    ->required()
                    ->help('Минимальная сумма пополнения для начисления кэшбэка'),

                Input::make('settings.max_cashback_per_transaction')
                    ->title('Максимальный кэшбэк за транзакцию (AED)')
                    ->type('number')
                    ->step(0.01)
                    ->min(0)
                    ->required()
                    ->help('Максимальная сумма кэшбэка за одно пополнение'),

                Input::make('settings.referral_active_days')
                    ->title('Срок действия реферальной связи (дни)')
                    ->type('number')
                    ->min(1)
                    ->required()
                    ->help('Количество дней, в течение которых действует связь между реферрером и рефералом'),
            ])->title('Основные настройки'),

            Layout::rows([
                Button::make('Сохранить настройки')
                    ->icon('bs.check')
                    ->method('save')
                    ->type(\Orchid\Screen\Actions\Button::PRIMARY),
            ])
        ];
    }

    /**
     * Save settings
     */
    public function save(Request $request)
    {
        $request->validate([
            'settings.cashback_percentage' => 'required|numeric|min:0|max:100',
            'settings.min_cashback_amount' => 'required|numeric|min:0',
            'settings.max_cashback_per_transaction' => 'required|numeric|min:0',
            'settings.referral_active_days' => 'required|integer|min:1',
            'settings.program_enabled' => 'boolean',
        ]);

        $settings = $request->get('settings');

        // Сохраняем настройки
        ReferralSetting::set('program_enabled', $settings['program_enabled'] ? 'true' : 'false', 'Включена ли партнёрская программа');
        ReferralSetting::set('cashback_percentage', $settings['cashback_percentage'], 'Процент кэшбэка с пополнений рефералов');
        ReferralSetting::set('min_cashback_amount', (int)($settings['min_cashback_amount'] * 100), 'Минимальная сумма пополнения для кэшбэка (в центах)');
        ReferralSetting::set('max_cashback_per_transaction', (int)($settings['max_cashback_per_transaction'] * 100), 'Максимальный кэшбэк за одну транзакцию (в центах)');
        ReferralSetting::set('referral_active_days', $settings['referral_active_days'], 'Количество дней, в течение которых действует реферальная связь');

        // Очищаем кеш настроек
        ReferralSetting::clearCache();

        Toast::info('Настройки партнёрской программы сохранены успешно');

        return redirect()->route('platform.referrals.settings');
    }
}
