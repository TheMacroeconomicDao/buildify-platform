<?php

namespace App\Console\Commands;

use App\Models\Complaint;
use Illuminate\Console\Command;

class TestComplaintsPage extends Command
{
    protected $signature = 'admin:test-complaints';
    protected $description = 'Test complaints page functionality';

    public function handle()
    {
        $this->info('Testing complaints page...');
        
        // Проверяем количество жалоб
        $totalComplaints = Complaint::count();
        $this->info("Total complaints: {$totalComplaints}");
        
        if ($totalComplaints > 0) {
            $this->info('Sample complaints:');
            $complaints = Complaint::with(['complainant', 'reportedUser'])->limit(5)->get();
            
            $this->table(['ID', 'Complainant', 'Reported User', 'Reason', 'Status', 'Created'], 
                $complaints->map(function($c) {
                    return [
                        $c->id,
                        $c->complainant ? $c->complainant->name : 'N/A',
                        $c->reportedUser ? $c->reportedUser->name : 'N/A',
                        $c->reason ?? 'N/A',
                        $c->status ?? 'pending',
                        $c->created_at->format('Y-m-d H:i:s')
                    ];
                })->toArray()
            );
        } else {
            $this->warn('No complaints found');
            $this->info('The complaints page will show an empty table');
        }
        
        $this->info('');
        $this->info('You can access complaints at: http://localhost:8000/admin/complaints');
        
        return Command::SUCCESS;
    }
}
