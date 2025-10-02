<?php

namespace App\Console\Commands;

use App\Enums\Users\Status;
use App\Enums\Users\Type;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateTestMediator extends Command
{
    protected $signature = 'admin:create-test-mediator';
    protected $description = 'Create a test mediator for deletion testing';

    public function handle()
    {
        $mediator = User::create([
            'name' => 'Тестовый посредник для удаления',
            'email' => 'delete-test-mediator@example.com',
            'phone' => '+1234567890',
            'password' => Hash::make('password'),
            'type' => Type::Mediator->value,
            'status' => Status::Active->value,
            'mediator_margin_percentage' => 5,
            'mediator_fixed_fee' => 100,
        ]);
        
        $this->info("✅ Created test mediator:");
        $this->info("ID: {$mediator->id}");
        $this->info("Name: {$mediator->name}");
        $this->info("Email: {$mediator->email}");
        $this->info("Status: {$mediator->status}");
        $this->info("");
        $this->info("You can now test deletion at: http://localhost:8000/admin/mediators");
        
        return Command::SUCCESS;
    }
}
