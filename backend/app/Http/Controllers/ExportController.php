<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Order;
use App\Models\Complaint;
use App\Models\WalletTransaction;
use App\Enums\Users\Type;
use App\Enums\Order\Status as OrderStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Carbon\Carbon;

class ExportController extends Controller
{
    /**
     * Export analytics data to CSV
     */
    public function exportAnalytics(Request $request): StreamedResponse
    {
        $filename = "analytics_" . now()->format('Y-m-d_H-i-s') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        return response()->stream(function() {
            $handle = fopen('php://output', 'w');
            
            // UTF-8 BOM для корректного отображения в Excel
            fwrite($handle, "\xEF\xBB\xBF");
            
            // Headers
            fputcsv($handle, [
                'Metric',
                'This Month',
                'Last Month',
                'Change'
            ]);

            // Получаем данные
            $thisMonth = now()->startOfMonth();
            $lastMonth = now()->subMonth()->startOfMonth();
            $lastMonthEnd = now()->subMonth()->endOfMonth();

            $usersThisMonth = User::where('created_at', '>=', $thisMonth)->count();
            $usersLastMonth = User::whereBetween('created_at', [$lastMonth, $lastMonthEnd])->count();

            $ordersThisMonth = Order::where('created_at', '>=', $thisMonth)->count();
            $ordersLastMonth = Order::whereBetween('created_at', [$lastMonth, $lastMonthEnd])->count();

            $completedThisMonth = Order::where('status', OrderStatus::Completed->value)
                ->where('created_at', '>=', $thisMonth)->count();
            $completedLastMonth = Order::where('status', OrderStatus::Completed->value)
                ->whereBetween('created_at', [$lastMonth, $lastMonthEnd])->count();

            $complaintsThisMonth = Complaint::where('created_at', '>=', $thisMonth)->count();
            $complaintsLastMonth = Complaint::whereBetween('created_at', [$lastMonth, $lastMonthEnd])->count();

            // Data
            fputcsv($handle, [
                'New Users',
                $usersThisMonth,
                $usersLastMonth,
                $usersThisMonth - $usersLastMonth
            ]);

            fputcsv($handle, [
                'New Orders',
                $ordersThisMonth,
                $ordersLastMonth,
                $ordersThisMonth - $ordersLastMonth
            ]);

            fputcsv($handle, [
                'Completed Orders',
                $completedThisMonth,
                $completedLastMonth,
                $completedThisMonth - $completedLastMonth
            ]);

            fputcsv($handle, [
                'New Complaints',
                $complaintsThisMonth,
                $complaintsLastMonth,
                $complaintsThisMonth - $complaintsLastMonth
            ]);
            
            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Export reports data to CSV
     */
    public function exportReports(Request $request): StreamedResponse
    {
        $startDate = $request->get('start_date', now()->subMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->format('Y-m-d'));
        $reportType = $request->get('report_type', 'general');

        $filename = "report_{$reportType}_" . now()->format('Y-m-d_H-i-s') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        return response()->stream(function() use ($startDate, $endDate, $reportType) {
            $handle = fopen('php://output', 'w');
            
            // UTF-8 BOM для корректного отображения в Excel
            fwrite($handle, "\xEF\xBB\xBF");
            
            switch ($reportType) {
                case 'users':
                    $this->exportUsersData($handle, $startDate, $endDate);
                    break;
                case 'orders':
                    $this->exportOrdersData($handle, $startDate, $endDate);
                    break;
                case 'complaints':
                    $this->exportComplaintsData($handle, $startDate, $endDate);
                    break;
                case 'financial':
                    $this->exportFinancialData($handle, $startDate, $endDate);
                    break;
                default:
                    $this->exportGeneralData($handle, $startDate, $endDate);
            }
            
            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Export users data to CSV
     */
    private function exportUsersData($handle, string $startDate, string $endDate): void
    {
        // Headers
        fputcsv($handle, [
            'ID',
            'Name',
            'Email',
            'Phone',
            'Type',
            'Status',
            'Registration Date',
            'Email Verified',
            'Verification Status'
        ]);

        // Данные
        User::whereBetween('created_at', [$startDate, $endDate])
            ->orderBy('created_at', 'desc')
            ->chunk(1000, function ($users) use ($handle) {
                foreach ($users as $user) {
                    fputcsv($handle, [
                        $user->id,
                        $user->name,
                        $user->email,
                        $user->phone,
                        $this->getUserTypeText($user->type),
                        $this->getUserStatusText($user->status),
                        $user->created_at->format('d.m.Y H:i'),
                        $user->email_verified_at ? 'Yes' : 'No',
                        $this->getVerificationStatusText($user->verification_status ?? 3)
                    ]);
                }
            });
    }

    /**
     * Export orders data to CSV
     */
    private function exportOrdersData($handle, string $startDate, string $endDate): void
    {
        // Headers
        fputcsv($handle, [
            'ID',
            'Title',
            'Customer',
            'Executor',
            'Status',
            'Min Price ($)',
            'Max Price ($)',
            'Created Date',
            'Updated Date'
        ]);

        // Данные
        Order::with(['customer', 'executor'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->orderBy('created_at', 'desc')
            ->chunk(1000, function ($orders) use ($handle) {
                foreach ($orders as $order) {
                    fputcsv($handle, [
                        $order->id,
                        $order->title,
                        $order->customer ? $order->customer->name : 'Not specified',
                        $order->executor ? $order->executor->name : 'Not assigned',
                        $this->getOrderStatusText($order->status),
                        $order->min_amount,
                        $order->max_amount,
                        $order->created_at->format('d.m.Y H:i'),
                        $order->updated_at->format('d.m.Y H:i')
                    ]);
                }
            });
    }

    /**
     * Export complaints data to CSV
     */
    private function exportComplaintsData($handle, string $startDate, string $endDate): void
    {
        // Headers
        fputcsv($handle, [
            'ID',
            'Complainant',
            'Reported User',
            'Reason',
            'Status',
            'Order',
            'Created Date',
            'Updated Date'
        ]);

        // Данные
        Complaint::with(['complainant', 'reportedUser', 'order'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->orderBy('created_at', 'desc')
            ->chunk(1000, function ($complaints) use ($handle) {
                foreach ($complaints as $complaint) {
                    fputcsv($handle, [
                        $complaint->id,
                        $complaint->complainant ? $complaint->complainant->name : 'Not found',
                        $complaint->reportedUser ? $complaint->reportedUser->name : 'Not found',
                        $complaint->reason,
                        $complaint->status,
                        $complaint->order ? $complaint->order->title : 'Not linked',
                        $complaint->created_at->format('d.m.Y H:i'),
                        $complaint->updated_at->format('d.m.Y H:i')
                    ]);
                }
            });
    }

    /**
     * Export financial data to CSV
     */
    private function exportFinancialData($handle, string $startDate, string $endDate): void
    {
        // Headers
        fputcsv($handle, [
            'ID',
            'User',
            'Transaction Type',
            'Amount ($)',
            'Currency',
            'Balance After ($)',
            'Transaction Date'
        ]);

        // Данные
        WalletTransaction::with('user')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->orderBy('created_at', 'desc')
            ->chunk(1000, function ($transactions) use ($handle) {
                foreach ($transactions as $transaction) {
                    fputcsv($handle, [
                        $transaction->id,
                        $transaction->user ? $transaction->user->name : 'Not found',
                        $transaction->type,
                        $transaction->amount,
                        strtoupper($transaction->currency),
                        $transaction->balance_after,
                        $transaction->created_at->format('d.m.Y H:i')
                    ]);
                }
            });
    }

    /**
     * Export general data to CSV
     */
    private function exportGeneralData($handle, string $startDate, string $endDate): void
    {
        // Headers
        fputcsv($handle, [
            'Metric',
            'Value',
            'Period'
        ]);

        // Данные для общего отчета
        $totalUsers = User::whereBetween('created_at', [$startDate, $endDate])->count();
        $totalOrders = Order::whereBetween('created_at', [$startDate, $endDate])->count();
        $completedOrders = Order::where('status', OrderStatus::Completed->value)
            ->whereBetween('created_at', [$startDate, $endDate])->count();
        $totalComplaints = Complaint::whereBetween('created_at', [$startDate, $endDate])->count();

        $period = "{$startDate} - {$endDate}";

        fputcsv($handle, ['Total Users', $totalUsers, $period]);
        fputcsv($handle, ['Total Orders', $totalOrders, $period]);
        fputcsv($handle, ['Completed Orders', $completedOrders, $period]);
        fputcsv($handle, ['Total Complaints', $totalComplaints, $period]);
    }

    /**
     * Get user type text
     */
    private function getUserTypeText(int $type): string
    {
        return match($type) {
            Type::Customer->value => 'Customer',
            Type::Executor->value => 'Executor',
            Type::Mediator->value => 'Mediator',
            Type::Admin->value => 'Administrator',
            default => 'Unknown'
        };
    }

    /**
     * Get user status text
     */
    private function getUserStatusText(int $status): string
    {
        return match($status) {
            0 => 'Active',
            1 => 'Inactive',
            2 => 'Deleted',
            default => 'Unknown'
        };
    }

    /**
     * Get verification status text
     */
    private function getVerificationStatusText(int $status): string
    {
        return match($status) {
            0 => 'Pending',
            1 => 'Approved',
            2 => 'Rejected',
            3 => 'Not Required',
            default => 'Unknown'
        };
    }

    /**
     * Get order status text
     */
    private function getOrderStatusText(int $status): string
    {
        return match($status) {
            OrderStatus::Draft->value => 'Draft',
            OrderStatus::Published->value => 'Published',
            OrderStatus::InProgress->value => 'In Progress',
            OrderStatus::Completed->value => 'Completed',
            OrderStatus::Cancelled->value => 'Cancelled',
            default => 'Unknown'
        };
    }
}
