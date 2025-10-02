<?php

namespace App\Console\Commands;

use App\Enums\Users\Type;
use App\Models\User;
use Illuminate\Console\Command;

class RecalculateExecutorRatings extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:recalculate-executor-ratings';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Пересчитать рейтинги всех исполнителей на основе их отзывов';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Начинаем пересчет рейтингов исполнителей...');

        $executors = User::where('type', Type::Executor->value)->get();
        $progressBar = $this->output->createProgressBar($executors->count());

        $updated = 0;

        foreach ($executors as $executor) {
            $executor->recalculateRating();
            $updated++;
            $progressBar->advance();
        }

        $progressBar->finish();
        $this->newLine();
        $this->info("Пересчет завершен! Обновлено рейтингов: {$updated}");

        return Command::SUCCESS;
    }
}
