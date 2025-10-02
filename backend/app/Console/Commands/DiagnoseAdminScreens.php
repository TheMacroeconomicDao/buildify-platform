<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Route;

class DiagnoseAdminScreens extends Command
{
    protected $signature = 'admin:diagnose-screens';
    protected $description = 'Diagnose admin screens for errors';

    public function handle()
    {
        $this->info('Diagnosing admin screens...');
        
        $screens = [
            'complaints' => 'http://localhost:8000/admin/complaints',
            'payments' => 'http://localhost:8000/admin/payments',
            'mediators' => 'http://localhost:8000/admin/mediators',
            'customers' => 'http://localhost:8000/admin/customers',
            'executors' => 'http://localhost:8000/admin/executors',
            'orders' => 'http://localhost:8000/admin/orders',
            'banners' => 'http://localhost:8000/admin/banners',
        ];
        
        foreach ($screens as $name => $url) {
            $this->info("Testing {$name}...");
            
            try {
                $response = \Illuminate\Support\Facades\Http::timeout(5)->get($url);
                
                if ($response->status() === 401) {
                    $this->line("  ✅ {$name}: Requires auth (normal)");
                } elseif ($response->successful()) {
                    $this->line("  ✅ {$name}: OK");
                } else {
                    $this->error("  ❌ {$name}: Status {$response->status()}");
                    
                    $body = $response->body();
                    if (str_contains($body, 'Target class') || str_contains($body, 'does not exist')) {
                        $this->error("    Contains dependency injection error");
                        $this->error("    Response: " . substr($body, 0, 200));
                    }
                }
            } catch (\Exception $e) {
                $this->error("  ❌ {$name}: Exception - " . $e->getMessage());
            }
        }
        
        return Command::SUCCESS;
    }
}
