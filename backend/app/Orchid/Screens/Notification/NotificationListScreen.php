<?php

declare(strict_types=1);

namespace App\Orchid\Screens\Notification;

use App\Models\AdminNotification;
use App\Orchid\Layouts\Notification\NotificationListLayout;
use App\Orchid\Layouts\Notification\NotificationFilterLayout;
use Illuminate\Http\Request;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Toast;

class NotificationListScreen extends Screen
{
    /**
     * Fetch data to be displayed on the screen.
     */
    public function query(): iterable
    {
        $notifications = AdminNotification::orderBy('id', 'desc')->paginate();
            
        // Временная отладка
        \Log::info('Notifications query debug:', [
            'total_in_db' => AdminNotification::count(),
            'returned_count' => $notifications->count(),
        ]);
        
        return [
            'notifications' => $notifications,
        ];
    }

    /**
     * The name of the screen displayed in the header.
     */
    public function name(): ?string
    {
        return 'Notifications';
    }

    /**
     * Display header description.
     */
    public function description(): ?string
    {
        return 'Administrator notification center';
    }

    /**
     * The permissions required to access this screen.
     */
    public function permission(): ?iterable
    {
        return [
            'platform.systems.notifications',
        ];
    }

    /**
     * The screen's action buttons.
     */
    public function commandBar(): iterable
    {
        return [
            Button::make('Mark All as Read')
                ->icon('bs.check2-all')
                ->method('markAllAsRead')
                ->confirm('Mark all notifications as read?'),
        ];
    }

    /**
     * The screen's layout elements.
     */
    public function layout(): iterable
    {
        return [
            new class extends \Orchid\Screen\Layouts\Table {
                protected $target = 'notifications';
                
                protected function columns(): array
                {
                    return [
                        \Orchid\Screen\TD::make('id', 'ID'),
                        \Orchid\Screen\TD::make('type', 'Type'),
                        \Orchid\Screen\TD::make('title', 'Title'),
                        \Orchid\Screen\TD::make('message', 'Message')->render(fn ($notification) => \Str::limit($notification->message, 50)),
                        \Orchid\Screen\TD::make('created_at', 'Created'),
                    ];
                }
            }
        ];
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(Request $request): void
    {
        $notification = AdminNotification::findOrFail($request->get('id'));
        
        $notification->markAsRead();
        
        Toast::info('Notification marked as read');
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(): void
    {
        AdminNotification::whereNull('read_at')
            ->update(['read_at' => now()]);
        
        Toast::success('All notifications marked as read');
    }

    /**
     * Delete notification
     */
    public function remove(Request $request): void
    {
        AdminNotification::findOrFail($request->get('id'))
            ->delete();
        
        Toast::info('Notification deleted');
    }
}
