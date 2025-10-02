<?php

declare(strict_types=1);

namespace App\Orchid\Screens\Analytics;

use App\Models\User;
use App\Models\Order;
use App\Models\Complaint;
use App\Models\Tariff;
use App\Enums\Users\Type;
use App\Enums\Order\Status as OrderStatus;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Layout;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Actions\Button;
use Carbon\Carbon;

class AnalyticsScreen extends Screen
{
    /**
     * Fetch data to be displayed on the screen.
     */
    public function query(): iterable
    {
        // Статистика по периодам
        $currentMonth = now()->startOfMonth();
        $lastMonth = now()->subMonth()->startOfMonth();
        
        // Пользователи
        $usersThisMonth = User::where('created_at', '>=', $currentMonth)->count();
        $usersLastMonth = User::whereBetween('created_at', [$lastMonth, $currentMonth])->count();
        
        // Заказы
        $ordersThisMonth = Order::where('created_at', '>=', $currentMonth)->count();
        $ordersLastMonth = Order::whereBetween('created_at', [$lastMonth, $currentMonth])->count();
        
        // Завершенные заказы
        $completedThisMonth = Order::where('status', OrderStatus::Completed->value)
            ->where('created_at', '>=', $currentMonth)->count();
        $completedLastMonth = Order::where('status', OrderStatus::Completed->value)
            ->whereBetween('created_at', [$lastMonth, $currentMonth])->count();
        
        // Жалобы
        $complaintsThisMonth = Complaint::where('created_at', '>=', $currentMonth)->count();
        $complaintsLastMonth = Complaint::whereBetween('created_at', [$lastMonth, $currentMonth])->count();

        // Статистика по дням за последние 30 дней
        $dailyStats = [];
        for ($i = 29; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $dailyStats[] = [
                'date' => $date->format('d.m'),
                'users' => User::whereDate('created_at', $date)->count(),
                'orders' => Order::whereDate('created_at', $date)->count(),
                'complaints' => Complaint::whereDate('created_at', $date)->count(),
            ];
        }

        // Топ исполнителей по количеству заказов
        $topExecutors = User::where('type', Type::Executor->value)
            ->withCount(['executorOrders' => function ($query) {
                $query->where('status', OrderStatus::Completed->value);
            }])
            ->orderBy('executor_orders_count', 'desc')
            ->limit(10)
            ->get();

        // Топ заказчиков по количеству заказов
        $topCustomers = User::where('type', Type::Customer->value)
            ->withCount('customerOrders')
            ->orderBy('customer_orders_count', 'desc')
            ->limit(10)
            ->get();

        // Статистика по статусам заказов
        $ordersByStatus = Order::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();

        // Статистика по причинам жалоб
        $complaintsByReason = Complaint::selectRaw('reason, COUNT(*) as count')
            ->groupBy('reason')
            ->get()
            ->pluck('count', 'reason')
            ->toArray();

        return [
            'metrics' => [
                'users_this_month' => $usersThisMonth,
                'users_last_month' => $usersLastMonth,
                'orders_this_month' => $ordersThisMonth,
                'orders_last_month' => $ordersLastMonth,
                'completed_this_month' => $completedThisMonth,
                'completed_last_month' => $completedLastMonth,
                'complaints_this_month' => $complaintsThisMonth,
                'complaints_last_month' => $complaintsLastMonth,
            ],
            'daily_stats' => $dailyStats,
            'top_executors' => $topExecutors,
            'top_customers' => $topCustomers,
            'orders_by_status' => $ordersByStatus,
            'complaints_by_reason' => $complaintsByReason,
        ];
    }

    /**
     * The name of the screen displayed in the header.
     */
    public function name(): ?string
    {
        return 'Analytics & Statistics';
    }

    /**
     * Display header description.
     */
    public function description(): ?string
    {
        return 'Detailed analytics of platform activity';
    }

    /**
     * The permissions required to access this screen.
     */
    public function permission(): ?iterable
    {
        return [
            'platform.systems.analytics',
        ];
    }

    /**
     * The screen's action buttons.
     */
    public function commandBar(): iterable
    {
        return [
            Link::make('Export Data')
                ->icon('bs.download')
                ->href(route('admin.export.analytics'))
                ->target('_blank'),
        ];
    }

    /**
     * The screen's layout elements.
     */
    public function layout(): iterable
    {
        return [
            Layout::metrics([
                'New Users (This Month)' => 'metrics.users_this_month',
                'New Users (Last Month)' => 'metrics.users_last_month',
                'New Orders (This Month)' => 'metrics.orders_this_month',
                'New Orders (Last Month)' => 'metrics.orders_last_month',
            ]),

            Layout::metrics([
                'Completed Orders (This Month)' => 'metrics.completed_this_month',
                'Completed Orders (Last Month)' => 'metrics.completed_last_month',
                'Complaints (This Month)' => 'metrics.complaints_this_month',
                'Complaints (Last Month)' => 'metrics.complaints_last_month',
            ]),

            Layout::columns([
                Layout::table('top_executors', [
                    \Orchid\Screen\TD::make('name', 'Executor'),
                    \Orchid\Screen\TD::make('executor_orders_count', 'Completed Orders')
                        ->sort(),
                    \Orchid\Screen\TD::make('executor_rating', 'Rating')
                        ->render(fn($user) => $user->executor_rating && is_numeric($user->executor_rating) ? round((float) $user->executor_rating, 1) : 'None'),
                    \Orchid\Screen\TD::make('created_at', 'Registered')
                        ->render(fn($user) => $user->created_at->format('d.m.Y')),
                ])->title('Top Executors'),

                Layout::table('top_customers', [
                    \Orchid\Screen\TD::make('name', 'Customer'),
                    \Orchid\Screen\TD::make('customer_orders_count', 'Orders Count')
                        ->sort(),
                    \Orchid\Screen\TD::make('customer_rating', 'Rating')
                        ->render(fn($user) => $user->customer_rating && is_numeric($user->customer_rating) ? round((float) $user->customer_rating, 1) : 'None'),
                    \Orchid\Screen\TD::make('created_at', 'Registered')
                        ->render(fn($user) => $user->created_at->format('d.m.Y')),
                ])->title('Top Customers'),
            ]),

            Layout::view('orchid.analytics.charts'),
        ];
    }


}
