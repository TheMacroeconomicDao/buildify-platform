<?php

namespace App\Orchid\Screens\Referral;

use App\Models\Referral;
use App\Models\User;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Layout;

class SimpleReferralListScreen extends Screen
{
    /**
     * Fetch data to be displayed on the screen.
     */
    public function query(): iterable
    {
        $totalReferrals = Referral::count();
        $activeReferrals = Referral::where('status', 'active')->count();
        $pendingReferrals = Referral::where('status', 'pending')->count();

        return [
            'stats' => [
                'total' => $totalReferrals,
                'active' => $activeReferrals,
                'pending' => $pendingReferrals,
            ]
        ];
    }

    /**
     * The name of the screen displayed in the header.
     */
    public function name(): ?string
    {
        return 'Referral Management';
    }

    /**
     * The screen's description.
     */
    public function description(): ?string
    {
        return 'View referral relationships statistics';
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
                'Total Referrals' => 'stats.total',
                'Active' => 'stats.active',
                'Pending' => 'stats.pending',
            ]),

            Layout::view('referrals.list-info', [
                'info' => 'Detailed referral management available through API or direct database queries.'
            ])
        ];
    }
}
