<?php

namespace App\Orchid\Screens\Executor;

use App\Enums\Users\Status;
use App\Models\User;
use App\Models\UserWork;
use App\Models\Tariff;
use App\Orchid\Layouts\Executor\EditLayout;
use App\Orchid\Layouts\Executor\ShowLayout;
use App\Orchid\Layouts\Executor\WorkLayout;
use App\Orchid\Layouts\Executor\SubscriptionLayout;
use App\Rules\PhoneNumberCheck;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Layout;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Toast;

class EditScreen extends Screen
{
    private ?User $executor = null;

    /**
     * Fetch data to be displayed on the screen.
     *
     * @return array
     */
    public function query(User $executor): iterable
    {
        $executor->loadCount(['executorReviews',])
            ->loadAvg('executorReviews', 'rating');

        $this->executor = $executor;

        $currentTariff = $executor->currentTariff();
        $subscriptionInfo = 'No subscription';
        
        if ($currentTariff) {
            $subscriptionInfo = "📋 {$currentTariff->name} ({$currentTariff->price} AED)";
            
            if ($executor->subscription_ends_at) {
                $daysLeft = $executor->getDaysUntilSubscriptionExpires();
                if ($daysLeft !== null) {
                    if ($daysLeft > 0) {
                        $subscriptionInfo .= " | ⏰ {$daysLeft} days left";
                    } elseif ($daysLeft === 0) {
                        $subscriptionInfo .= " | ⚠️ Expires today";
                    } else {
                        $subscriptionInfo .= " | ❌ Expired " . abs($daysLeft) . " days ago";
                    }
                }
            } else {
                $subscriptionInfo .= " | ♾️ Unlimited";
            }
        }

        $tariffOptions = [];
        $tariffs = Tariff::where('is_active', true)->orderBy('price', 'asc')->get();
        foreach ($tariffs as $tariff) {
            $tariffOptions[$tariff->id] = "{$tariff->name} ({$tariff->price} AED)";
        }

        return [
            'executor' => $executor,
            'current_subscription_info' => $subscriptionInfo,
            'tariff_options' => $tariffOptions,
        ];
    }

    /**
     * Display header name.
     *
     * @return string|null
     */
    public function name(): ?string
    {
        return __('Executor');
    }

    public function commandBar(): iterable
    {
        return [
            Button::make(__('Save'))
                ->icon('check')
                ->method('save'),
            Link::make(__('Reset changes'))
                ->icon('reload')
                ->route('platform.systems.executors.edit', ['executor' => $this->executor->id]),
        ];
    }

    /**
     * Views.
     *
     * @return Layout[]|string[]
     */
    public function layout(): iterable
    {
        return [
            ShowLayout::class,
            EditLayout::class,
            SubscriptionLayout::class,
            WorkLayout::class,
        ];
    }

    public function save(User $executor, Request $request): RedirectResponse
    {
        DB::transaction(function () use ($executor, $request) {
            $this->executor = $executor;

            $data = $request->validate([
                'executor.name' => ['required', 'string',],
                'executor.about_me' => ['nullable', 'string',],
                'executor.email' => [
                    'required',
                    Rule::unique('users', 'email')
                        ->ignore($executor->id)
                        ->where(function ($query) {
                            return $query->where('status', '!=', Status::Deleted->value);
                        })
                ],
                'executor.phone' => [
                    'required',
                    Rule::unique('users', 'phone')
                        ->ignore($executor->id)
                        ->where(function ($query) {
                            return $query->where('status', '!=', Status::Deleted->value);
                        }),
                    new PhoneNumberCheck,
                ],
                'executor.telegram' => ['nullable', 'string',],
                'executor.whatsApp' => ['nullable', 'string',],
                'executor.facebook' => ['nullable', 'string',],
                'executor.viber' => ['nullable', 'string',],

            ])['executor'];

            if ($request->has('password') && !empty($request->get('password'))) {
                $data['password'] = Hash::make($request->password);
            }

            $executor->update($data);

            // Обработка изменения подписки
            $this->handleSubscriptionUpdate($executor, $request);

            foreach ($request->get('works', []) as $direction => $types) {
                foreach ($types as $type => $value) {
                    if ($value === '1') {
                        UserWork::firstOrCreate([
                            'user_id' => $executor->id,
                            'direction' => $direction,
                            'type' => $type,
                        ]);
                    } else {
                        UserWork::query()
                            ->where('user_id', $executor->id)
                            ->where('direction', $direction)
                            ->where('type', $type)
                            ->delete();
                    }
                }
            }
        });

        Toast::info(__('Executor updated'));

        return redirect()->route('platform.systems.executors.edit', ['executor' => $executor->id,]);
    }

    /**
     * Handle subscription updates for executor
     */
    private function handleSubscriptionUpdate(User $executor, Request $request): void
    {
        // Изменение тарифа
        if ($request->filled('new_tariff_id')) {
            $tariff = Tariff::findOrFail($request->get('new_tariff_id'));
            $customDurationDays = $request->get('custom_duration_days');
            
            if ($tariff->name === 'Free' || $tariff->price == 0) {
                // Для бесплатного тарифа
                $executor->activateSubscription($tariff);
                Toast::info("Subscription changed to {$tariff->name}");
            } else {
                // Для платного тарифа с возможной кастомной длительностью
                $durationDays = $customDurationDays ?? $tariff->duration_days;
                $now = now();
                $endsAt = $durationDays > 0 ? $now->copy()->addDays($durationDays) : null;
                
                $executor->update([
                    'current_tariff_id' => $tariff->id,
                    'subscription_started_at' => $now,
                    'subscription_ends_at' => $endsAt,
                ]);
                
                $durationText = $customDurationDays ? " for {$customDurationDays} days" : " (default duration)";
                Toast::info("Subscription changed to {$tariff->name}{$durationText}");
            }
        }
        
        // Продление текущей подписки
        if ($request->filled('extend_days')) {
            $extendDays = (int) $request->get('extend_days');
            $currentTariff = $executor->currentTariff();
            
            if ($currentTariff && $currentTariff->name !== 'Free') {
                $currentEndDate = $executor->subscription_ends_at ?? now();
                $newEndDate = $currentEndDate->copy()->addDays($extendDays);
                
                $executor->update([
                    'subscription_ends_at' => $newEndDate
                ]);
                
                Toast::info("Subscription extended by {$extendDays} days");
            } else {
                Toast::warning("Cannot extend free subscription");
            }
        }
    }
}
