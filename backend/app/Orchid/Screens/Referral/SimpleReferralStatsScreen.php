<?php

namespace App\Orchid\Screens\Referral;

use App\Models\User;
use App\Models\Referral;
use App\Models\ReferralTransaction;
use App\Models\ReferralCode;
use App\Enums\Users\Type;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Layout;
use Orchid\Screen\Sight;

class SimpleReferralStatsScreen extends Screen
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

        return [
            'metrics' => [
                'total_users' => $totalUsers,
                'total_executors' => $totalExecutors,
                'total_referral_codes' => $totalReferralCodes,
                'total_referrals' => $totalReferrals,
                'total_cashback_aed' => $totalCashbackAmount / 100,
                'total_cashback_transactions' => $totalCashbackTransactions,
                'average_cashback_aed' => $totalCashbackTransactions > 0 ? ($totalCashbackAmount / $totalCashbackTransactions) / 100 : 0,
            ]
        ];
    }

    /**
     * The name of the screen displayed in the header.
     */
    public function name(): ?string
    {
        return 'Referral Program Statistics';
    }

    /**
     * The screen's description.
     */
    public function description(): ?string
    {
        return 'Key metrics of the referral system';
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
                'Total Users' => 'metrics.total_users',
                'Executors' => 'metrics.total_executors',
                'Referral Codes' => 'metrics.total_referral_codes',
                'Active Referrals' => 'metrics.total_referrals',
            ]),

            Layout::metrics([
                'Total Cashback (AED)' => 'metrics.total_cashback_aed',
                'Cashback Transactions' => 'metrics.total_cashback_transactions',
                'Average Cashback (AED)' => 'metrics.average_cashback_aed',
            ]),

            Layout::view('referrals.info', [
                'info' => 'Detailed statistics and referral management available through API or database queries.'
            ])
        ];
    }
}
