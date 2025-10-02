<?php

namespace App\Console\Commands;

use App\Enums\Users\Status;
use App\Enums\Users\Type;
use App\Models\User;
use Illuminate\Console\Command;

class SimulateMediatorDelete extends Command
{
    protected $signature = 'admin:simulate-mediator-delete {id}';
    protected $description = 'Simulate mediator deletion by ID';

    public function handle()
    {
        $id = $this->argument('id');
        
        $mediator = User::where('type', Type::Mediator->value)
            ->where('status', '!=', Status::Deleted->value)
            ->find($id);
            
        if (!$mediator) {
            $this->error("Mediator with ID {$id} not found or already deleted");
            return Command::FAILURE;
        }
        
        $this->info("Found mediator: {$mediator->name} (ID: {$mediator->id})");
        
        // Симулируем удаление
        $mediator->update([
            'status' => Status::Deleted->value,
        ]);
        
        $this->info("✅ Mediator marked as deleted (status = " . Status::Deleted->value . ")");
        
        // Проверяем результат
        $this->call('admin:test-mediator-delete');
        
        return Command::SUCCESS;
    }
}
