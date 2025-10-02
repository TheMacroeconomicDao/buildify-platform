<?php

namespace App\Orchid\Layouts\Complaint;

use App\Models\Complaint;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Actions\DropDown;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Layouts\Table;
use Orchid\Screen\TD;

class ListLayout extends Table
{
    /**
     * Data source.
     *
     * The name of the key to fetch it from the query.
     * The results of which will be elements of the table.
     *
     * @var string
     */
    protected $target = 'complaints';

    /**
     * Get the table cells to be displayed.
     *
     * @return TD[]
     */
    protected function columns(): iterable
    {
        return [
            TD::make('id', 'ID')
                ->sort()
                ->render(fn(Complaint $complaint) => Link::make($complaint->id)
                    ->route('platform.systems.complaints.edit', $complaint)),

            TD::make('complainant.name', 'Complainant')
                ->render(function (Complaint $complaint) {
                    if (!$complaint->complainant) {
                        return 'Not found';
                    }
                    
                    $name = $complaint->complainant->name;
                    $phone = $complaint->complainant->phone ? '<br><small>📞 ' . $complaint->complainant->phone . '</small>' : '';
                    $email = $complaint->complainant->email ? '<br><small>✉️ ' . $complaint->complainant->email . '</small>' : '';
                    
                    return $name . $phone . $email;
                }),

            TD::make('reported_user.name', 'Reported User')
                ->render(function (Complaint $complaint) {
                    if (!$complaint->reportedUser) {
                        return 'Not found';
                    }
                    
                    $name = $complaint->reportedUser->name;
                    $phone = $complaint->reportedUser->phone ? '<br><small>📞 ' . $complaint->reportedUser->phone . '</small>' : '';
                    $email = $complaint->reportedUser->email ? '<br><small>✉️ ' . $complaint->reportedUser->email . '</small>' : '';
                    
                    return $name . $phone . $email;
                }),

            TD::make('reason', 'Reason')
                ->render(function (Complaint $complaint) {
                    $reasons = [
                        'inappropriate_behavior' => 'Inappropriate Behavior',
                        'poor_quality_work' => 'Poor Quality Work',
                        'non_payment' => 'Non-payment',
                        'fraud' => 'Fraud',
                        'spam' => 'Spam',
                        'fake_profile' => 'Fake Profile',
                        'other' => 'Other',
                    ];
                    return $reasons[$complaint->reason] ?? $complaint->reason;
                }),

            TD::make('status', 'Status')
                ->render(function (Complaint $complaint) {
                    $statuses = [
                        'pending' => 'Pending',
                        'reviewing' => 'Under Review',
                        'resolved' => 'Resolved',
                        'rejected' => 'Rejected',
                    ];
                    $statusText = $statuses[$complaint->status] ?? $complaint->status;
                    
                    $badgeClass = match($complaint->status) {
                        'pending' => 'bg-warning text-dark',
                        'reviewing' => 'bg-info text-white', 
                        'resolved' => 'bg-success text-white',
                        'rejected' => 'bg-danger text-white',
                        default => 'bg-secondary text-white'
                    };
                    
                    return "<span class='badge {$badgeClass}' style='font-size: 12px; padding: 4px 8px;'>{$statusText}</span>";
                }),

            TD::make('order.title', 'Order')
                ->render(fn(Complaint $complaint) => $complaint->order 
                    ? Link::make($complaint->order->title)
                        ->route('platform.systems.orders.edit', $complaint->order)
                    : 'Not linked'),

            TD::make('created_at', 'Created Date')
                ->sort()
                ->render(fn(Complaint $complaint) => $complaint->created_at->format('d.m.Y H:i')),

            TD::make('reviewed_at', 'Review Date')
                ->render(fn(Complaint $complaint) => $complaint->reviewed_at 
                    ? $complaint->reviewed_at->format('d.m.Y H:i') 
                    : 'Not reviewed'),

            TD::make('actions', 'Actions')
                ->align(TD::ALIGN_CENTER)
                ->width('100px')
                ->render(fn(Complaint $complaint) => DropDown::make()
                    ->icon('bs.three-dots-vertical')
                    ->list([
                        Link::make('View')
                            ->route('platform.systems.complaints.edit', $complaint)
                            ->icon('bs.eye'),

                        Button::make('Under Review')
                            ->method('updateStatus', ['complaint' => $complaint->id, 'status' => 'reviewing'])
                            ->icon('bs.clock')
                            ->canSee($complaint->status === 'pending'),

                        Button::make('Resolved')
                            ->method('updateStatus', ['complaint' => $complaint->id, 'status' => 'resolved'])
                            ->icon('bs.check-circle')
                            ->canSee(in_array($complaint->status, ['pending', 'reviewing'])),

                        Button::make('Rejected')
                            ->method('updateStatus', ['complaint' => $complaint->id, 'status' => 'rejected'])
                            ->icon('bs.x-circle')
                            ->canSee(in_array($complaint->status, ['pending', 'reviewing'])),
                    ])),
        ];
    }
}
