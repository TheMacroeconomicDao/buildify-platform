<?php

namespace App\Orchid\Layouts;

use App\Models\ScheduledNotification;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Actions\DropDown;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Layouts\Table;
use Orchid\Screen\TD;

class PushNotificationListLayout extends Table
{
    /**
     * Data source.
     *
     * The name of the key to fetch it from the query.
     * The results of which will be elements of the table.
     *
     * @var string
     */
    protected $target = 'notifications';

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
                ->cantHide()
                ->width('80px'),

            TD::make('title', 'Title')
                ->sort()
                ->cantHide()
                ->render(function (ScheduledNotification $notification) {
                    return Link::make($notification->title)
                        ->route('platform.push-notifications.edit', $notification->id);
                }),

            TD::make('message', 'Message')
                ->render(function (ScheduledNotification $notification) {
                    return substr($notification->message, 0, 100) . (strlen($notification->message) > 100 ? '...' : '');
                })
                ->width('300px'),

            TD::make('target_type', 'Target')
                ->render(function (ScheduledNotification $notification) {
                    $labels = [
                        'all' => 'All Users',
                        'customers' => 'Customers',
                        'executors' => 'Executors',
                        'specific_users' => 'Specific Users',
                    ];
                    return $labels[$notification->target_type] ?? $notification->target_type;
                })
                ->sort()
                ->width('120px'),

            TD::make('schedule_type', 'Schedule')
                ->render(function (ScheduledNotification $notification) {
                    $labels = [
                        'once' => 'Once',
                        'daily' => 'Daily',
                        'weekly' => 'Weekly',
                        'monthly' => 'Monthly',
                    ];
                    return $labels[$notification->schedule_type] ?? $notification->schedule_type;
                })
                ->sort()
                ->width('100px'),

            TD::make('scheduled_at', 'Scheduled')
                ->render(function (ScheduledNotification $notification) {
                    return $notification->scheduled_at->format('d.m.Y H:i');
                })
                ->sort()
                ->width('150px'),

            TD::make('status', 'Status')
                ->render(function (ScheduledNotification $notification) {
                    $badges = [
                        'pending' => '<span class="badge bg-warning">Pending</span>',
                        'sent' => '<span class="badge bg-success">Sent</span>',
                        'failed' => '<span class="badge bg-danger">Failed</span>',
                        'cancelled' => '<span class="badge bg-secondary">Cancelled</span>',
                    ];
                    return $badges[$notification->status] ?? $notification->status;
                })
                ->sort()
                ->width('100px'),

            TD::make('sent_count', 'Sent/Failed')
                ->render(function (ScheduledNotification $notification) {
                    if ($notification->status === 'sent') {
                        return "{$notification->sent_count} / {$notification->failed_count}";
                    }
                    return '-';
                })
                ->width('100px'),

            TD::make('creator', 'Created By')
                ->render(function (ScheduledNotification $notification) {
                    return $notification->creator->name ?? 'Unknown';
                })
                ->width('120px'),

            TD::make(__('Actions'))
                ->align(TD::ALIGN_CENTER)
                ->width('100px')
                ->render(function (ScheduledNotification $notification) {
                    $actions = [
                        Link::make(__('Edit'))
                            ->route('platform.push-notifications.edit', $notification->id)
                            ->icon('bs.pencil'),
                    ];

                    if ($notification->status === ScheduledNotification::STATUS_PENDING) {
                        $actions[] = Button::make(__('Cancel'))
                            ->icon('bs.x-circle')
                            ->confirm(__('Are you sure you want to cancel this notification?'))
                            ->method('cancel')
                            ->parameters(['id' => $notification->id]);
                    }

                    $actions[] = Button::make(__('Delete'))
                        ->icon('bs.trash3')
                        ->confirm(__('Are you sure you want to delete this notification?'))
                        ->method('remove')
                        ->parameters(['id' => $notification->id]);

                    return DropDown::make()
                        ->icon('bs.three-dots-vertical')
                        ->list($actions);
                }),
        ];
    }
}
