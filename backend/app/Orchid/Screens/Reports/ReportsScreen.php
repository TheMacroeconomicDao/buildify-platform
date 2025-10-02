<?php

declare(strict_types=1);

namespace App\Orchid\Screens\Reports;

use App\Models\User;
use App\Models\Order;
use App\Models\Complaint;
use App\Models\WalletTransaction;
use App\Enums\Users\Type;
use App\Enums\Order\Status as OrderStatus;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Layout;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Fields\DateRange;
use Orchid\Screen\Fields\Select;
use Carbon\Carbon;
use Illuminate\Http\Request;


class ReportsScreen extends Screen
{
    /**
     * Fetch data to be displayed on the screen.
     */
    public function query(Request $request): iterable
    {
        $startDate = $request->get('start_date', now()->subMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->format('Y-m-d'));
        $reportType = $request->get('report_type', 'general');

        $data = [];

        switch ($reportType) {
            case 'users':
                $data = $this->getUsersReport($startDate, $endDate);
                break;
            case 'orders':
                $data = $this->getOrdersReport($startDate, $endDate);
                break;
            case 'complaints':
                $data = $this->getComplaintsReport($startDate, $endDate);
                break;
            case 'financial':
                $data = $this->getFinancialReport($startDate, $endDate);
                break;
            default:
                $data = $this->getGeneralReport($startDate, $endDate);
        }

        return [
            'report_data' => $data,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'report_type' => $reportType,
        ];
    }

    /**
     * The name of the screen displayed in the header.
     */
    public function name(): ?string
    {
        return 'Reports & Statistics';
    }

    /**
     * Display header description.
     */
    public function description(): ?string
    {
        return 'Generate detailed reports on various platform metrics';
    }

    /**
     * The permissions required to access this screen.
     */
    public function permission(): ?iterable
    {
        return [
            'platform.systems.reports',
        ];
    }

    /**
     * The screen's action buttons.
     */
    public function commandBar(): iterable
    {
        return [
            Button::make('Generate Report')
                ->icon('bs.file-earmark-text')
                ->method('generateReport'),
                
            Link::make('Export to CSV')
                ->icon('bs.download')
                ->href(route('admin.export.reports'))
                ->target('_blank'),
        ];
    }

    /**
     * The screen's layout elements.
     */
    public function layout(): iterable
    {
        return [
            Layout::rows([
                DateRange::make('date_range')
                    ->title('Report Period')
                    ->help('Select period for report generation'),

                Select::make('report_type')
                    ->title('Report Type')
                    ->options([
                        'general' => 'General Report',
                        'users' => 'Users Report',
                        'orders' => 'Orders Report',
                        'complaints' => 'Complaints Report',
                        'financial' => 'Financial Report',
                    ])
                    ->value('general'),
            ]),

            Layout::view('orchid.reports.display'),
        ];
    }

    /**
     * Generate general report
     */
    private function getGeneralReport(string $startDate, string $endDate): array
    {
        return [
            'title' => 'General Report',
            'period' => "{$startDate} - {$endDate}",
            'metrics' => [
                'New Users' => User::whereBetween('created_at', [$startDate, $endDate])->count(),
                'New Orders' => Order::whereBetween('created_at', [$startDate, $endDate])->count(),
                'Completed Orders' => Order::where('status', OrderStatus::Completed->value)
                    ->whereBetween('created_at', [$startDate, $endDate])->count(),
                'New Complaints' => Complaint::whereBetween('created_at', [$startDate, $endDate])->count(),
            ],
        ];
    }

    /**
     * Generate users report
     */
    private function getUsersReport(string $startDate, string $endDate): array
    {
        $totalUsers = User::whereBetween('created_at', [$startDate, $endDate])->count();
        $customerCount = User::where('type', Type::Customer->value)
            ->whereBetween('created_at', [$startDate, $endDate])->count();
        $executorCount = User::where('type', Type::Executor->value)
            ->whereBetween('created_at', [$startDate, $endDate])->count();

        return [
            'title' => 'Users Report',
            'period' => "{$startDate} - {$endDate}",
            'metrics' => [
                'Total New Users' => $totalUsers,
                'New Customers' => $customerCount,
                'New Executors' => $executorCount,
                'Customer Percentage' => $totalUsers > 0 ? round(($customerCount / $totalUsers) * 100, 1) . '%' : '0%',
                'Executor Percentage' => $totalUsers > 0 ? round(($executorCount / $totalUsers) * 100, 1) . '%' : '0%',
            ],
        ];
    }

    /**
     * Generate orders report
     */
    private function getOrdersReport(string $startDate, string $endDate): array
    {
        $totalOrders = Order::whereBetween('created_at', [$startDate, $endDate])->count();
        $completedOrders = Order::where('status', OrderStatus::Completed->value)
            ->whereBetween('created_at', [$startDate, $endDate])->count();
        $cancelledOrders = Order::where('status', OrderStatus::Cancelled->value)
            ->whereBetween('created_at', [$startDate, $endDate])->count();

        return [
            'title' => 'Orders Report',
            'period' => "{$startDate} - {$endDate}",
            'metrics' => [
                'Total Orders' => $totalOrders,
                'Completed Orders' => $completedOrders,
                'Cancelled Orders' => $cancelledOrders,
                'Completion Percentage' => $totalOrders > 0 ? round(($completedOrders / $totalOrders) * 100, 1) . '%' : '0%',
                'Cancellation Percentage' => $totalOrders > 0 ? round(($cancelledOrders / $totalOrders) * 100, 1) . '%' : '0%',
            ],
        ];
    }

    /**
     * Generate complaints report
     */
    private function getComplaintsReport(string $startDate, string $endDate): array
    {
        $totalComplaints = Complaint::whereBetween('created_at', [$startDate, $endDate])->count();
        $resolvedComplaints = Complaint::where('status', 'resolved')
            ->whereBetween('created_at', [$startDate, $endDate])->count();
        $pendingComplaints = Complaint::where('status', 'pending')
            ->whereBetween('created_at', [$startDate, $endDate])->count();

        return [
            'title' => 'Complaints Report',
            'period' => "{$startDate} - {$endDate}",
            'metrics' => [
                'Total Complaints' => $totalComplaints,
                'Resolved Complaints' => $resolvedComplaints,
                'Pending Review' => $pendingComplaints,
                'Resolution Rate' => $totalComplaints > 0 ? round(($resolvedComplaints / $totalComplaints) * 100, 1) . '%' : '0%',
            ],
        ];
    }

    /**
     * Generate financial report
     */
    private function getFinancialReport(string $startDate, string $endDate): array
    {
        // Here you can add financial statistics
        // For example, total order amount, commissions, etc.
        
        $totalOrderValue = Order::whereBetween('created_at', [$startDate, $endDate])
            ->sum('max_amount');
        
        $completedOrderValue = Order::where('status', OrderStatus::Completed->value)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->sum('max_amount');

        return [
            'title' => 'Financial Report',
            'period' => "{$startDate} - {$endDate}",
            'metrics' => [
                'Total Order Amount' => number_format($totalOrderValue, 2) . ' AED',
                'Completed Orders Amount' => number_format($completedOrderValue, 2) . ' AED',
                'Active Subscribers' => User::whereHas('subscriptions', function($query) {
                    $query->where('stripe_status', 'active');
                })->count(),
            ],
        ];
    }

    /**
     * Generate report action
     */
    public function generateReport(Request $request): void
    {
        \Orchid\Support\Facades\Toast::success('Report generated successfully');
    }

    /**
     * Export to CSV action
     */
    public function exportToCsv(Request $request): Response
    {
        // Получаем параметры из формы или используем значения по умолчанию
        $dateRange = $request->get('date_range');
        $reportType = $request->get('report_type', 'general');
        
        // Парсим диапазон дат
        if ($dateRange && is_array($dateRange)) {
            $startDate = $dateRange['start'] ?? now()->subMonth()->format('Y-m-d');
            $endDate = $dateRange['end'] ?? now()->format('Y-m-d');
        } else {
            $startDate = $request->get('start_date', now()->subMonth()->format('Y-m-d'));
            $endDate = $request->get('end_date', now()->format('Y-m-d'));
        }

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
        // Заголовки
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
        // Заголовки
        fputcsv($handle, [
            'ID',
            'Title',
            'Customer',
            'Executor',
            'Status',
            'Min. Price',
            'Max. Price',
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
        // Заголовки
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
        // Заголовки
        fputcsv($handle, [
            'ID',
            'User',
            'Transaction Type',
            'Amount',
            'Currency',
            'Balance After',
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
        // Заголовки
        fputcsv($handle, [
            'Metric',
            'Value',
            'Period'
        ]);

        $data = $this->getGeneralReport($startDate, $endDate);
        
        foreach ($data['metrics'] as $metric => $value) {
            fputcsv($handle, [
                $metric,
                $value,
                $data['period']
            ]);
        }
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
