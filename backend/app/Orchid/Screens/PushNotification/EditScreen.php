<?php

namespace App\Orchid\Screens\PushNotification;

use App\Models\ScheduledNotification;
use App\Models\User;
use Illuminate\Http\Request;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Fields\CheckBox;
use Orchid\Screen\Fields\DateTimer;
use Orchid\Screen\Fields\Group;
use Orchid\Screen\Fields\Input;
use Orchid\Screen\Fields\Select;
use Orchid\Screen\Fields\TextArea;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Layout;
use Orchid\Support\Facades\Toast;

class EditScreen extends Screen
{
    /**
     * @var ScheduledNotification
     */
    public $notification;

    /**
     * Fetch data to be displayed on the screen.
     *
     * @return array
     */
    public function query(ScheduledNotification $notification): iterable
    {
        if (!$notification->exists) {
            $notification->schedule_type = ScheduledNotification::SCHEDULE_ONCE;
            $notification->target_type = ScheduledNotification::TARGET_ALL;
            $notification->scheduled_at = now()->addHour();
        }
        
        return [
            'notification' => $notification
        ];
    }

    /**
     * The name of the screen displayed in the header.
     *
     * @return string|null
     */
    public function name(): ?string
    {
        return $this->notification->exists ? 'Edit Push Notification' : 'Create Push Notification';
    }

    /**
     * The screen's action buttons.
     *
     * @return \Orchid\Screen\Action[]
     */
    public function commandBar(): iterable
    {
        return [
            Button::make('Create Notification')
                ->icon('bs.check-circle')
                ->canSee(!$this->notification->exists)
                ->method('createOrUpdate'),

            Button::make('Update')
                ->icon('bs.check-circle')
                ->canSee($this->notification->exists)
                ->method('createOrUpdate'),

            Button::make('Cancel')
                ->icon('bs.x-circle')
                ->confirm(__('Are you sure you want to cancel this notification?'))
                ->method('cancel')
                ->canSee($this->notification->exists && $this->notification->status === ScheduledNotification::STATUS_PENDING),

            Button::make('Remove')
                ->icon('bs.trash3')
                ->confirm(__('Are you sure you want to delete this notification?'))
                ->method('remove')
                ->canSee($this->notification->exists),
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
            Layout::rows([
                Input::make('notification.title')
                    ->title('Title')
                    ->placeholder('Enter notification title')
                    ->required()
                    ->help('Title that will be displayed in the notification'),

                TextArea::make('notification.message')
                    ->title('Message')
                    ->placeholder('Enter notification message')
                    ->rows(4)
                    ->required()
                    ->help('Message content for the notification'),

                Group::make([
                    Select::make('notification.target_type')
                        ->title('Target Audience')
                        ->options([
                            ScheduledNotification::TARGET_ALL => 'All Users',
                            ScheduledNotification::TARGET_CUSTOMERS => 'Customers Only',
                            ScheduledNotification::TARGET_EXECUTORS => 'Executors Only',
                            ScheduledNotification::TARGET_SPECIFIC => 'Specific Users',
                        ])
                        ->required()
                        ->help('Who should receive this notification'),

                    Select::make('notification.schedule_type')
                        ->title('Schedule Type')
                        ->options([
                            ScheduledNotification::SCHEDULE_ONCE => 'Send Once',
                            ScheduledNotification::SCHEDULE_DAILY => 'Daily',
                            ScheduledNotification::SCHEDULE_WEEKLY => 'Weekly',
                            ScheduledNotification::SCHEDULE_MONTHLY => 'Monthly',
                        ])
                        ->required()
                        ->help('How often to send this notification'),
                ]),

                DateTimer::make('notification.scheduled_at')
                    ->title('Scheduled Date & Time')
                    ->required()
                    ->help('When to send the notification'),

                TextArea::make('notification.data')
                    ->title('Additional Data (JSON)')
                    ->placeholder('{"key": "value"}')
                    ->rows(3)
                    ->help('Optional JSON data to include with the notification'),
            ]),
        ];
    }

    /**
     * @param ScheduledNotification $notification
     * @param Request $request
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function createOrUpdate(ScheduledNotification $notification, Request $request)
    {
        try {
            $validationRules = [
                'notification.title' => 'required|string|max:255',
                'notification.message' => 'required|string|max:1000',
                'notification.target_type' => 'required|in:all,customers,executors,specific_users',
                'notification.schedule_type' => 'required|in:once,daily,weekly,monthly',
                'notification.scheduled_at' => 'required|date|after:now',
                'notification.data' => 'nullable|string',
            ];
            
            $request->validate($validationRules);

            $data = $request->get('notification');
            
            // Парсим JSON данные если есть
            if (!empty($data['data'])) {
                $jsonData = json_decode($data['data'], true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    Toast::error('Invalid JSON in additional data field');
                    return back()->withInput();
                }
                $data['data'] = $jsonData;
            }
            
            // Для новых записей устанавливаем создателя
            if (!$notification->exists) {
                $data['created_by'] = auth()->id();
                $data['status'] = ScheduledNotification::STATUS_PENDING;
            }

            $notification->fill($data)->save();

            Toast::info(__('Push notification was saved.'));

            return redirect()->route('platform.push-notifications');
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            Toast::error('Validation failed: ' . implode(', ', $e->validator->errors()->all()));
            return back()->withInput();
        } catch (\Exception $e) {
            \Log::error('Error saving push notification: ' . $e->getMessage());
            Toast::error('Error saving push notification: ' . $e->getMessage());
            return back()->withInput();
        }
    }

    /**
     * Cancel notification
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
}
