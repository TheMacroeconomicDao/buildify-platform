<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class TestComplaintsHTTP extends Command
{
    protected $signature = 'admin:test-complaints-http';
    protected $description = 'Test complaints page via HTTP';

    public function handle()
    {
        $this->info('Testing complaints page via HTTP...');
        
        try {
            // Тестируем страницу жалоб
            $response = Http::get('http://localhost:8000/admin/complaints');
            
            if ($response->successful()) {
                $this->info('✅ Complaints page loads successfully');
                $this->info('Status: ' . $response->status());
                
                $content = $response->body();
                if (str_contains($content, 'Жалобы') || str_contains($content, 'complaints')) {
                    $this->info('✅ Page contains expected content');
                } else {
                    $this->warn('⚠️  Page loaded but content might be unexpected');
                }
            } else {
                $this->error('❌ Failed to load complaints page');
                $this->error('Status: ' . $response->status());
                $this->error('Response: ' . $response->body());
            }
        } catch (\Exception $e) {
            $this->error('❌ Exception occurred: ' . $e->getMessage());
        }
        
        return Command::SUCCESS;
    }
}
