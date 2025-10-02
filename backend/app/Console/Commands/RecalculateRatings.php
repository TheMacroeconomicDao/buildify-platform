<?php

namespace App\Console\Commands;

use App\Models\CustomerReview;
use App\Models\ExecutorReview;
use App\Models\User;
use Illuminate\Console\Command;

class RecalculateRatings extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ratings:recalculate {--force : Force recalculation for all users}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Recalculate all user ratings based on reviews';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting rating recalculation...');

        // Пересчитываем рейтинги заказчиков
        $customersWithReviews = CustomerReview::distinct('customer_id')->pluck('customer_id');
        $this->info("Found {$customersWithReviews->count()} customers with reviews");

        foreach ($customersWithReviews as $customerId) {
            CustomerReview::recalculateCustomerRating($customerId);
            $this->line("✓ Customer ID: {$customerId}");
        }

        // Пересчитываем рейтинги исполнителей
        $executorsWithReviews = ExecutorReview::distinct('executor_id')->pluck('executor_id');
        $this->info("Found {$executorsWithReviews->count()} executors with reviews");

        foreach ($executorsWithReviews as $executorId) {
            ExecutorReview::recalculateExecutorRating($executorId);
            $this->line("✓ Executor ID: {$executorId}");
        }

        // Если указан флаг --force, пересчитываем для всех пользователей
        if ($this->option('force')) {
            $this->info('Force recalculation for all users...');
            
            $allUsers = User::all();
            foreach ($allUsers as $user) {
                $user->recalculateOverallRating();
                $this->line("✓ Overall rating for user ID: {$user->id}");
            }
        }

        $this->info('Rating recalculation completed successfully!');

        // Показываем статистику
        $this->newLine();
        $this->info('Final statistics:');
        
        $stats = User::selectRaw('
            COUNT(CASE WHEN executor_rating > 0 THEN 1 END) as executors_with_rating,
            COUNT(CASE WHEN customer_rating > 0 THEN 1 END) as customers_with_rating,
            COUNT(CASE WHEN average_rating > 0 THEN 1 END) as users_with_overall_rating,
            AVG(CASE WHEN executor_rating > 0 THEN executor_rating END) as avg_executor_rating,
            AVG(CASE WHEN customer_rating > 0 THEN customer_rating END) as avg_customer_rating,
            AVG(CASE WHEN average_rating > 0 THEN average_rating END) as avg_overall_rating
        ')->first();

        $this->table(
            ['Metric', 'Value'],
            [
                ['Executors with rating', $stats->executors_with_rating],
                ['Customers with rating', $stats->customers_with_rating],
                ['Users with overall rating', $stats->users_with_overall_rating],
                ['Average executor rating', round($stats->avg_executor_rating ?? 0, 2)],
                ['Average customer rating', round($stats->avg_customer_rating ?? 0, 2)],
                ['Average overall rating', round($stats->avg_overall_rating ?? 0, 2)],
            ]
        );

        return Command::SUCCESS;
    }
}