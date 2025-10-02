<?php

namespace App\Orchid\Layouts\Wallet;

use App\Models\WalletTransaction;
use Orchid\Screen\Components\Cells\DateTimeSplit;
use Orchid\Screen\Layouts\Table;
use Orchid\Screen\TD;

class WalletTransactionsLayout extends Table
{
    /**
     * @var string
     */
    public $target = 'transactions';

    /**
     * @return TD[]
     */
    public function columns(): array
    {
        return [
            TD::make('id', 'ID')
                ->sort()
                ->cantHide(),

            TD::make('type', 'Type')
                ->sort()
                ->render(function (WalletTransaction $transaction) {
                    $badges = [
                        'deposit' => '<span class="badge bg-success">Deposit</span>',
                        'subscription_payment' => '<span class="badge bg-primary">Subscription</span>',
                        'admin_adjustment' => '<span class="badge bg-warning">Admin Adjustment</span>',
                        'charge' => '<span class="badge bg-danger">Charge</span>',
                        'refund' => '<span class="badge bg-info">Refund</span>',
                    ];
                    return $badges[$transaction->type] ?? '<span class="badge bg-secondary">' . ucfirst($transaction->type) . '</span>';
                }),

            TD::make('amount', 'Amount (AED)')
                ->sort()
                ->render(function (WalletTransaction $transaction) {
                    $amount = $transaction->amount / 100;
                    $sign = in_array($transaction->type, ['deposit', 'refund']) ? '+' : '-';
                    $color = $sign === '+' ? 'success' : 'danger';
                    return '<span class="text-' . $color . '">' . $sign . number_format($amount, 2) . ' AED</span>';
                }),

            TD::make('balance_before', 'Balance Before')
                ->render(function (WalletTransaction $transaction) {
                    return number_format($transaction->balance_before / 100, 2) . ' AED';
                }),

            TD::make('balance_after', 'Balance After')
                ->render(function (WalletTransaction $transaction) {
                    return '<strong>' . number_format($transaction->balance_after / 100, 2) . ' AED</strong>';
                }),

            TD::make('currency', 'Currency')
                ->render(fn (WalletTransaction $transaction) => strtoupper($transaction->currency)),

            TD::make('meta', 'Details')
                ->render(function (WalletTransaction $transaction) {
                    if (!$transaction->meta) return '—';
                    
                    $meta = is_array($transaction->meta) ? $transaction->meta : json_decode($transaction->meta, true);
                    $details = [];
                    
                    if (isset($meta['reason'])) {
                        $details[] = 'Reason: ' . $meta['reason'];
                    }
                    if (isset($meta['admin_name'])) {
                        $details[] = 'Admin: ' . $meta['admin_name'];
                    }
                    if (isset($meta['tariff_name'])) {
                        $details[] = 'Tariff: ' . $meta['tariff_name'];
                    }
                    if (isset($meta['operation'])) {
                        $details[] = 'Operation: ' . $meta['operation'];
                    }
                    
                    return implode('<br>', $details) ?: '—';
                }),

            TD::make('created_at', 'Date')
                ->usingComponent(DateTimeSplit::class)
                ->align(TD::ALIGN_RIGHT)
                ->sort(),
        ];
    }
}
