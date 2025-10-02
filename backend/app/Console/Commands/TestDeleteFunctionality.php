<?php

namespace App\Console\Commands;

use App\Enums\Users\Status;
use App\Enums\Users\Type;
use App\Models\User;
use Illuminate\Console\Command;

class TestDeleteFunctionality extends Command
{
    protected $signature = 'admin:test-delete';
    protected $description = 'Test delete functionality in admin tables';

    public function handle()
    {
        $this->info('Testing delete functionality...');
        
        // Проверяем количество записей до удаления
        $totalCustomers = User::where('type', Type::Customer->value)->count();
        $activeCustomers = User::where('type', Type::Customer->value)
            ->where('status', '!=', Status::Deleted->value)->count();
        $deletedCustomers = User::where('type', Type::Customer->value)
            ->where('status', Status::Deleted->value)->count();
            
        $this->table(['Type', 'Total', 'Active', 'Deleted'], [
            ['Customers', $totalCustomers, $activeCustomers, $deletedCustomers]
        ]);
        
        // Проверяем есть ли тестовые заказчики
        $testCustomer = User::where('type', Type::Customer->value)
            ->where('status', '!=', Status::Deleted->value)
            ->first();
            
        if ($testCustomer) {
            $this->info("Found test customer: {$testCustomer->name} (ID: {$testCustomer->id})");
            $this->info("You can test deletion via admin panel at: http://localhost:8000/admin/customers");
        } else {
            $this->warn('No active customers found to test deletion');
        }
        
        return Command::SUCCESS;
    }
}
