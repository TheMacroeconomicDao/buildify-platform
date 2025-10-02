<?php
// app/Orchid/Screens/Payment/PaymentListScreen.php

namespace App\Orchid\Screens\Payment;

use App\Models\User;
use App\Models\WalletTransaction;
use Orchid\Screen\Screen;
use Orchid\Screen\TD;
use Orchid\Support\Facades\Layout;

class PaymentListScreen extends Screen
{
    public function name(): string
    {
        return 'Payment History';
    }

    public function description(): string
    {
        return 'All user payments for subscriptions';
    }

    public function query(): array
    {
        return [
            'payments' => WalletTransaction::with('user')
                ->orderBy('created_at', 'desc')
                ->paginate()
        ];
    }

    public function layout(): array
    {
        return [
            Layout::table('payments', [
                TD::make('id', 'ID')->sort(),
                TD::make('user.name', 'User')
                    ->render(function (WalletTransaction $transaction) {
                        return $transaction->user ? $transaction->user->name : 'N/A';
                    }),
                TD::make('type', 'Type')
                    ->render(function (WalletTransaction $transaction) {
                        $typeLabels = [
                            'deposit' => 'Wallet Deposit',
                            'withdrawal' => 'Wallet Withdrawal',
                            'subscription_payment' => 'Subscription Payment',
                            'hold' => 'Hold',
                            'release' => 'Release',
                            'charge' => 'Charge'
                        ];
                        return $typeLabels[$transaction->type] ?? ucfirst($transaction->type);
                    }),
                TD::make('amount', 'Amount')
                    ->render(function (WalletTransaction $transaction) {
                        return number_format($transaction->amount / 100, 2) . ' AED';
                    }),
                TD::make('meta', 'Details')
                    ->render(function (WalletTransaction $transaction) {
                        if ($transaction->type === 'subscription_payment' && $transaction->meta) {
                            $meta = $transaction->meta;
                            $tariffName = $meta['tariff_name'] ?? 'Unknown';
                            $duration = $meta['duration_days'] ?? 0;
                            $isTest = $meta['is_test'] ?? false;
                            $testLabel = $isTest ? ' (Test)' : '';
                            return "{$tariffName}{$testLabel} - {$duration} days";
                        }
                        return '-';
                    }),
                TD::make('created_at', 'Date')->sort(),
            ])
        ];
    }

    public function commandBar(): array
    {
        return [];
    }
}
