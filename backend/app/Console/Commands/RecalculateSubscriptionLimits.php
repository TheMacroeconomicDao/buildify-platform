<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Order;
use App\Enums\Users\Type;
use App\Enums\Order\Status;
use Illuminate\Console\Command;

class RecalculateSubscriptionLimits extends Command
{
    protected $signature = 'subscriptions:recalculate-limits';

    protected $description = 'Пересчитать использованные лимиты подписок на основе текущих заказов';

    public function handle()
    {
        $this->info('Пересчет лимитов подписок...');

        // Получаем всех исполнителей
        $executors = User::where('type', Type::Executor->value)
            ->whereNotNull('current_tariff_id')
            ->get();

        $processedCount = 0;

        foreach ($executors as $executor) {
            // Считаем заказы в работе за текущий период подписки
            $ordersInWork = Order::where('executor_id', $executor->id)
                ->whereIn('status', [
                    Status::InWork->value,
                    Status::AwaitingConfirmation->value,
                    Status::Completed->value,
                ])
                ->when($executor->subscription_started_at, function ($query) use ($executor) {
                    return $query->where('updated_at', '>=', $executor->subscription_started_at);
                })
                ->count();

            // Обновляем счетчик
            $executor->update(['used_orders_count' => $ordersInWork]);

            $this->line("Исполнитель {$executor->email}: {$ordersInWork} заказов в работе");
            $processedCount++;
        }

        $this->info("Обработано исполнителей: {$processedCount}");
        return 0;
    }
}