<?php

namespace App\Orchid\Screens\Referral;

use App\Models\Referral;
use App\Models\User;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Layout;
use Orchid\Screen\TD;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Actions\DropDown;
use Orchid\Screen\Actions\Link;
use Orchid\Support\Facades\Toast;
use Illuminate\Http\Request;

class ReferralListScreen extends Screen
{
    /**
     * Fetch data to be displayed on the screen.
     */
    public function query(): iterable
    {
        return [
            'referrals' => Referral::with(['referrer', 'referred', 'transactions'])
                ->orderBy('created_at', 'desc')
                ->paginate(50)
        ];
    }

    /**
     * The name of the screen displayed in the header.
     */
    public function name(): ?string
    {
        return 'Управление рефералами';
    }

    /**
     * The screen's description.
     */
    public function description(): ?string
    {
        return 'Просмотр и управление всеми реферальными связями';
    }

    /**
     * The screen's action buttons.
     */
    public function commandBar(): iterable
    {
        return [
            Link::make('Статистика')
                ->icon('bs.graph-up')
                ->route('platform.referrals.stats'),
                
            Link::make('Настройки')
                ->icon('bs.gear')
                ->route('platform.referrals.settings'),
        ];
    }

    /**
     * The screen's layout elements.
     */
    public function layout(): iterable
    {
        return [
            Layout::table('referrals', [
                TD::make('referrer.name', 'Реферрер')
                    ->render(function ($referral) {
                        return "<strong>{$referral->referrer->name}</strong><br><small>{$referral->referrer->email}</small>";
                    }),

                TD::make('referred.name', 'Реферал')
                    ->render(function ($referral) {
                        return "<strong>{$referral->referred->name}</strong><br><small>{$referral->referred->email}</small>";
                    }),

                TD::make('status', 'Статус')
                    ->render(function ($referral) {
                        $badges = [
                            'active' => '<span class="badge bg-success">Активен</span>',
                            'pending' => '<span class="badge bg-warning">Ожидание</span>',
                            'cancelled' => '<span class="badge bg-danger">Отменён</span>',
                        ];
                        return $badges[$referral->status] ?? $referral->status;
                    }),

                TD::make('transactions', 'Транзакций')
                    ->render(function ($referral) {
                        return $referral->transactions->count();
                    })
                    ->alignCenter(),

                TD::make('earnings', 'Заработано (AED)')
                    ->render(function ($referral) {
                        $totalEarned = $referral->transactions()
                            ->where('status', 'processed')
                            ->sum('cashback_amount');
                        return number_format($totalEarned / 100, 2);
                    })
                    ->alignRight(),

                TD::make('created_at', 'Дата регистрации')
                    ->render(function ($referral) {
                        return $referral->created_at->format('d.m.Y H:i');
                    }),

                TD::make('actions', 'Действия')
                    ->render(function ($referral) {
                        return DropDown::make()
                            ->icon('bs.three-dots-vertical')
                            ->list([
                                Button::make('Просмотреть детали')
                                    ->icon('bs.eye')
                                    ->method('viewDetails', ['id' => $referral->id]),

                                $referral->status === 'active' 
                                    ? Button::make('Отменить связь')
                                        ->icon('bs.x-circle')
                                        ->method('cancelReferral', ['id' => $referral->id])
                                        ->confirm('Вы уверены, что хотите отменить эту реферальную связь?')
                                    : null,
                            ]);
                    })
                    ->cantSort(),
            ])
        ];
    }

    /**
     * Просмотреть детали реферала
     */
    public function viewDetails(Request $request)
    {
        $referral = Referral::with(['referrer', 'referred', 'transactions'])
            ->findOrFail($request->get('id'));

        $transactions = $referral->transactions()
            ->with('walletTransaction')
            ->orderBy('created_at', 'desc')
            ->get();

        $details = [
            'Реферрер' => $referral->referrer->name . ' (' . $referral->referrer->email . ')',
            'Реферал' => $referral->referred->name . ' (' . $referral->referred->email . ')',
            'Статус' => $referral->status,
            'Дата регистрации' => $referral->created_at->format('d.m.Y H:i:s'),
            'Транзакций кэшбэка' => $transactions->count(),
            'Общая сумма кэшбэка' => number_format($transactions->sum('cashback_amount') / 100, 2) . ' AED',
        ];

        $message = "Детали реферальной связи:\n\n";
        foreach ($details as $key => $value) {
            $message .= "{$key}: {$value}\n";
        }

        if ($transactions->isNotEmpty()) {
            $message .= "\nПоследние транзакции:\n";
            foreach ($transactions->take(5) as $transaction) {
                $amount = number_format($transaction->cashback_amount / 100, 2);
                $date = $transaction->created_at->format('d.m.Y H:i');
                $message .= "• {$amount} AED - {$date}\n";
            }
        }

        Toast::info($message);
    }

    /**
     * Отменить реферальную связь
     */
    public function cancelReferral(Request $request)
    {
        $referral = Referral::findOrFail($request->get('id'));
        
        if ($referral->cancel()) {
            Toast::info('Реферальная связь отменена');
        } else {
            Toast::error('Не удалось отменить реферальную связь');
        }
    }
}
