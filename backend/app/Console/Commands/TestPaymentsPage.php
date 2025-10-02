<?php

namespace App\Console\Commands;

use App\Models\WalletTransaction;
use Illuminate\Console\Command;

class TestPaymentsPage extends Command
{
    protected $signature = 'admin:test-payments';
    protected $description = 'Test payments page functionality';

    public function handle()
    {
        $this->info('Testing payments page...');
        
        // Проверяем количество транзакций
        $totalTransactions = WalletTransaction::count();
        $this->info("Total wallet transactions: {$totalTransactions}");
        
        if ($totalTransactions > 0) {
            $this->info('Sample transactions:');
            $transactions = WalletTransaction::with('user')->limit(5)->get();
            
            $this->table(['ID', 'User', 'Type', 'Amount', 'Currency', 'Created'], 
                $transactions->map(function($t) {
                    return [
                        $t->id,
                        $t->user ? $t->user->name : 'N/A',
                        $t->type,
                        number_format($t->amount, 2),
                        $t->currency,
                        $t->created_at->format('Y-m-d H:i:s')
                    ];
                })->toArray()
            );
        } else {
            $this->warn('No wallet transactions found');
            $this->info('The payments page will show an empty table');
        }
        
        $this->info('');
        $this->info('You can access payments at: http://localhost:8000/admin/payments');
        
        return Command::SUCCESS;
    }
}
