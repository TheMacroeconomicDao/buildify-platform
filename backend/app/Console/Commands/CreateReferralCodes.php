<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\ReferralCode;
use Illuminate\Console\Command;

class CreateReferralCodes extends Command
{
    protected $signature = 'referrals:create-codes';
    protected $description = 'Create referral codes for all users who don\'t have one';

    public function handle()
    {
        $this->info('Creating referral codes for users...');
        
        $users = User::whereDoesntHave('referralCode')->get();
        $created = 0;
        
        foreach ($users as $user) {
            try {
                $code = ReferralCode::createForUser($user);
                $this->line("Created code {$code->code} for user {$user->name} ({$user->email})");
                $created++;
            } catch (\Exception $e) {
                $this->error("Failed to create code for user {$user->name}: " . $e->getMessage());
            }
        }
        
        $this->info("Created {$created} referral codes successfully!");
        
        return 0;
    }
}
