<?php

declare(strict_types=1);

namespace App\Orchid\Screens;

use App\Models\User;
use App\Models\Order;
use App\Models\Complaint;
use App\Models\Tariff;
use App\Enums\Users\Type;
use App\Enums\Order\Status as OrderStatus;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Layout;
use Orchid\Screen\TD;

class PlatformScreen extends Screen
{
    /**
     * Fetch data to be displayed on the screen.
     *
     * @return array
     */
    public function query(): iterable
    {
        try {
            // Get statistics
        $totalUsers = User::count();
        $totalCustomers = User::where('type', Type::Customer->value)->count();
        $totalExecutors = User::where('type', Type::Executor->value)->count();
        
        $totalOrders = Order::count();
        $activeOrders = Order::whereNotIn('status', [OrderStatus::Completed->value, OrderStatus::Cancelled->value, OrderStatus::Deleted->value])->count();
        $completedOrders = Order::where('status', OrderStatus::Completed->value)->count();
        
        $totalComplaints = Complaint::count();
        $pendingComplaints = Complaint::where('status', 'pending')->count();
        
        $totalTariffs = Tariff::where('is_active', true)->count();
        $subscribedUsers = User::whereHas('subscriptions', function($query) {
            $query->where('stripe_status', 'active');
        })->count();

        // Recent orders
        $recentOrders = Order::with(['author', 'executor'])
            ->latest()
            ->limit(5)
            ->get();

        // Recent complaints
        $recentComplaints = Complaint::with(['complainant', 'reportedUser'])
            ->latest()
            ->limit(5)
            ->get();

        // New users in the last week
        $newUsersThisWeek = User::where('created_at', '>=', now()->subWeek())->count();

            return [
                'metrics' => [
                    'total_users' => $totalUsers,
                    'total_customers' => $totalCustomers,
                    'total_executors' => $totalExecutors,
                    'total_orders' => $totalOrders,
                    'active_orders' => $activeOrders,
                    'completed_orders' => $completedOrders,
                    'total_complaints' => $totalComplaints,
                    'pending_complaints' => $pendingComplaints,
                    'total_tariffs' => $totalTariffs,
                    'subscribed_users' => $subscribedUsers,
                    'new_users_week' => $newUsersThisWeek,
                ],
                'recent_orders' => $recentOrders,
                'recent_complaints' => $recentComplaints,
            ];
        } catch (\Exception $e) {
            \Log::error('PlatformScreen query() error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            // Возвращаем пустые данные в случае ошибки
            return [
                'metrics' => [
                    'total_users' => 0,
                    'total_customers' => 0,
                    'total_executors' => 0,
                    'total_orders' => 0,
                    'active_orders' => 0,
                    'completed_orders' => 0,
                    'total_complaints' => 0,
                    'pending_complaints' => 0,
                    'total_tariffs' => 0,
                    'subscribed_users' => 0,
                    'new_users_week' => 0,
                ],
                'recent_orders' => collect(),
                'recent_complaints' => collect(),
            ];
        }
    }

    /**
     * The name of the screen displayed in the header.
     */
    public function name(): ?string
    {
        return 'Control Panel';
    }

    /**
     * Display header description.
     */
    public function description(): ?string
    {
        return 'Overview of key Buildlify platform metrics';
    }

    /**
     * The screen's action buttons.
     *
     * @return \Orchid\Screen\Action[]
     */
    public function commandBar(): iterable
    {
        return [];
    }

    /**
     * The screen's layout elements.
     *
     * @return \Orchid\Screen\Layout[]
     */
    public function layout(): iterable
    {
        return [
            Layout::metrics([
                'Total Users' => 'metrics.total_users',
                'Customers' => 'metrics.total_customers',
                'Executors' => 'metrics.total_executors',
                'New This Week' => 'metrics.new_users_week',
            ]),

            Layout::metrics([
                'Total Orders' => 'metrics.total_orders',
                'Active Orders' => 'metrics.active_orders',
                'Completed Orders' => 'metrics.completed_orders',
                'Tariff Plans' => 'metrics.total_tariffs',
            ]),

            Layout::metrics([
                'Total Complaints' => 'metrics.total_complaints',
                'Pending Review' => 'metrics.pending_complaints',
                'Subscribers' => 'metrics.subscribed_users',
            ]),

            Layout::columns([
                Layout::table('recent_orders', [
                    TD::make('id', 'ID заказа'),
                    TD::make('title', 'Title'),
                    TD::make('author.name', 'Customer'),
                    TD::make('status', 'Status'),
                    TD::make('created_at', 'Created')
                        ->render(fn($order) => $order->created_at->format('d.m.Y H:i')),
                ])->title('Recent Orders'),

                Layout::table('recent_complaints', [
                    TD::make('id', 'ID жалобы'),
                    TD::make('reason', 'Reason'),
                    TD::make('complainant.name', 'From User'),
                    TD::make('reportedUser.name', 'Against User'),
                    TD::make('status', 'Status'),
                    TD::make('created_at', 'Date')
                        ->render(fn($complaint) => $complaint->created_at->format('d.m.Y H:i')),
                ])->title('Recent Complaints'),
            ]),
        ];
    }
}
