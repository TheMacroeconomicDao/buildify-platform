<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\UserWork;
use App\Models\WorkType;

class FixUserWorkDirections extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fix:user-work-directions';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix user work directions based on work types';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting to fix user work directions...');

        $userWorks = UserWork::all();
        $fixed = 0;
        $notFound = 0;

        foreach ($userWorks as $userWork) {
            // Находим тип работы
            $workType = WorkType::where('key', $userWork->type)->first();
            
            if ($workType && $workType->workDirection) {
                $correctDirection = $workType->workDirection->key;
                
                // Если направление неправильное, исправляем
                if ($userWork->direction !== $correctDirection) {
                    $userWork->update(['direction' => $correctDirection]);
                    $fixed++;
                    $this->line("Fixed: {$userWork->type} -> direction: {$correctDirection}");
                }
            } else {
                $notFound++;
                $this->warn("Work type not found: {$userWork->type}");
            }
        }

        $this->info("Process completed!");
        $this->info("Fixed: {$fixed} records");
        $this->warn("Not found: {$notFound} work types");

        return Command::SUCCESS;
    }
}