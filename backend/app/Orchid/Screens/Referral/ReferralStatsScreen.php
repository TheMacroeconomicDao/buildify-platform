<?php

namespace App\Orchid\Screens\Referral;

use App\Models\User;
use App\Models\Referral;
use App\Models\ReferralTransaction;
use App\Models\ReferralCode;
use App\Enums\Users\Type;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Layout;
use Orchid\Screen\TD;
use Orchid\Screen\Sight;

class ReferralStatsScreen extends Screen
{
    /**
     * Fetch data to be displayed on the screen.
     */
    public function query(): iterable
    {
        // Общая статистика
        $totalUsers = User::count();
        $totalExecutors = User::where('type', Type::Executor->value)->count();
        $totalReferralCodes = ReferralCode::count();
        $totalReferrals = Referral::where('status', 'active')->count();
        
        $totalCashbackAmount = ReferralTransaction::where('status', 'processed')->sum('cashback_amount');
        $totalCashbackTransactions = ReferralTransaction::where('status', 'processed')->count();
        
        // Топ реферреры
        $topReferrers = User::with('referralCode')
            ->where('total_referrals_count', '>', 0)
            ->orderBy('total_referral_earnings', 'desc')
            ->limit(10)
            ->get();

        // Убираем таблицу статистики по дням для упрощения
        $dailyStats = collect();

        return [
            'metrics' => [
                'total_users' => $totalUsers,
                'total_executors' => $totalExecutors,
                'total_referral_codes' => $totalReferralCodes,
                'total_referrals' => $totalReferrals,
                'total_cashback_aed' => $totalCashbackAmount / 100,
                'total_cashback_transactions' => $totalCashbackTransactions,
                'average_cashback_aed' => $totalCashbackTransactions > 0 ? ($totalCashbackAmount / $totalCashbackTransactions) / 100 : 0,
            ],
            'top_referrers' => $topReferrers,
            'daily_stats' => $dailyStats,
        ];
    }

    /**
     * The name of the screen displayed in the header.
     */
    public function name(): ?string
    {
        return 'Статистика партнёрской программы';
    }

    /**
     * The screen's description.
     */
    public function description(): ?string
    {
        return 'Аналитика и метрики реферальной системы';
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
            Layout::metrics([
                'Всего пользователей' => 'metrics.total_users',
                'Исполнителей' => 'metrics.total_executors',
                'Промокодов' => 'metrics.total_referral_codes',
                'Активных рефералов' => 'metrics.total_referrals',
            ]),

            Layout::metrics([
                'Общий кэшбэк (AED)' => 'metrics.total_cashback_aed',
                'Транзакций кэшбэка' => 'metrics.total_cashback_transactions',
                'Средний кэшбэк (AED)' => 'metrics.average_cashback_aed',
            ]),

            Layout::table('top_referrers', [
                TD::make('name', 'Имя')
                    ->render(function ($user) {
                        return "<strong>{$user->name}</strong><br><small>{$user->email}</small>";
                    }),

                TD::make('referralCode.code', 'Промокод')
                    ->render(function ($user) {
                        $code = $user->referralCode?->code ?? 'N/A';
                        return "<code>{$code}</code>";
                    }),

                TD::make('total_referrals_count', 'Рефералов')
                    ->alignCenter(),

                TD::make('total_referral_earnings', 'Заработано (AED)')
                    ->render(function ($user) {
                        return number_format(($user->total_referral_earnings ?? 0) / 100, 2);
                    })
                    ->alignRight(),

                TD::make('referral_balance', 'Баланс (AED)')
                    ->render(function ($user) {
                        return number_format(($user->referral_balance ?? 0) / 100, 2);
                    })
                    ->alignRight(),
            ])->title('Топ 10 реферреров'),


        ];
    }
}
