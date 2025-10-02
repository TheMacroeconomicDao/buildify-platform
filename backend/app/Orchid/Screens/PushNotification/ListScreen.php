<?php

namespace App\Orchid\Screens\PushNotification;

use App\Models\ScheduledNotification;
use App\Orchid\Layouts\PushNotificationListLayout;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Toast;

class ListScreen extends Screen
{
    /**
     * Fetch data to be displayed on the screen.
     *
     * @return array
     */
    public function query(): iterable
    {
        return [
            'notifications' => ScheduledNotification::with('creator')
                ->orderBy('scheduled_at', 'desc')
                ->paginate()
        ];
    }

    /**
     * The name of the screen displayed in the header.
     *
     * @return string|null
     */
    public function name(): ?string
    {
        return 'Push Notifications';
    }

    /**
     * The screen's action buttons.
     *
     * @return \Orchid\Screen\Action[]
     */
    public function commandBar(): iterable
    {
        return [
            Link::make('Create Notification')
                ->icon('bs.plus-circle')
                ->route('platform.push-notifications.create'),
        ];
    }

    /**
     * The screen's layout elements.
     *
     * @return \Orchid\Screen\Layout[]|string[]
     */
    public function layout(): iterable
    {
        return [
            PushNotificationListLayout::class
        ];
    }

    /**
     * @param ScheduledNotification $notification
     *
     * @return \Illuminate\Http\RedirectResponse
     * @throws \Exception
     */
    public function remove(ScheduledNotification $notification)
    {
        $notification->delete();

        Toast::info(__('Push notification was removed'));

        return redirect()->route('platform.push-notifications');
    }

    /**
     * Cancel scheduled notification
     */
    public function cancel(ScheduledNotification $notification)
    {
        if ($notification->status === ScheduledNotification::STATUS_PENDING) {
            $notification->update(['status' => ScheduledNotification::STATUS_CANCELLED]);
            Toast::info(__('Push notification was cancelled'));
        } else {
            Toast::error(__('Can only cancel pending notifications'));
        }

        return redirect()->route('platform.push-notifications');
    }
}
