<?php

namespace App\Console\Commands;

use App\Enums\Users\Status;
use App\Enums\Users\Type;
use App\Models\User;
use Illuminate\Console\Command;

class TestMediatorDelete extends Command
{
    protected $signature = 'admin:test-mediator-delete';
    protected $description = 'Test mediator deletion functionality';

    public function handle()
    {
        $this->info('Testing mediator deletion...');
        
        // Проверяем количество посредников
        $totalMediators = User::where('type', Type::Mediator->value)->count();
        $activeMediators = User::where('type', Type::Mediator->value)
            ->where('status', '!=', Status::Deleted->value)->count();
        $deletedMediators = User::where('type', Type::Mediator->value)
            ->where('status', Status::Deleted->value)->count();
            
        $this->table(['Type', 'Total', 'Active', 'Deleted'], [
            ['Mediators', $totalMediators, $activeMediators, $deletedMediators]
        ]);
        
        // Показываем активных посредников
        $activeMediatorsList = User::where('type', Type::Mediator->value)
            ->where('status', '!=', Status::Deleted->value)
            ->get(['id', 'name', 'email', 'status']);
            
        if ($activeMediatorsList->count() > 0) {
            $this->info('Active mediators:');
            $this->table(['ID', 'Name', 'Email', 'Status'], 
                $activeMediatorsList->map(fn($u) => [$u->id, $u->name, $u->email, $u->status])->toArray()
            );
        } else {
            $this->warn('No active mediators found');
        }
        
        return Command::SUCCESS;
    }
}
