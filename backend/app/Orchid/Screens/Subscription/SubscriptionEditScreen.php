<?php
// app/Orchid/Screens/Subscription/SubscriptionEditScreen.php

namespace App\Orchid\Screens\Subscription;

use App\Models\Tariff;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Fields\CheckBox;
use Orchid\Screen\Fields\Input;
use Orchid\Screen\Fields\Number;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Alert;
use Orchid\Support\Facades\Layout;
use Stripe\StripeClient;

class SubscriptionEditScreen extends Screen
{
    public $subscription;

    public function name(): ?string
    {
        return $this->subscription->exists ? 'Edit Subscription' : 'Create Subscription';
    }

    public function description(): ?string
    {
        return 'Manage subscription parameters';
    }

    public function query(Tariff $subscription): array
    {
        $this->subscription = $subscription;
        return [
            'subscription' => $subscription
        ];
    }

    public function layout(): array
    {
        return [
            Layout::rows([
                Input::make('subscription.name')
                    ->title('Subscription Name')
                    ->required(),

                Input::make('subscription.price')
                    ->title('Price (AED)')
                    ->step(0.01)
                    ->required(),

                Input::make('subscription.duration_days')
                    ->title('Duration (days)')
                    ->required(),

                Input::make('subscription.max_orders')
                    ->title('Max. simultaneous orders')
                    ->required(),

                Input::make('subscription.max_contacts')
                    ->title('Max. number of open contacts')
                    ->required(),

                CheckBox::make('subscription.is_active')
                    ->title('Active for purchase')
                    ->sendTrueOrFalse(),

                CheckBox::make('subscription.is_test')
                    ->title('Test subscription (0 AED - no Stripe integration)')
                    ->help('Test subscriptions bypass Stripe and can be activated for free')
                    ->sendTrueOrFalse(),
            ])
        ];
    }

    public function createOrUpdate(Tariff $subscription, Request $request)
    {
        $request->validate([
            'subscription.name' => 'required|string|max:255',
            'subscription.price' => 'required|numeric|min:0',
            'subscription.duration_days' => 'required|integer|min:1',
            'subscription.max_orders' => 'required|integer|min:1',

            'subscription.max_contacts' => 'required|integer|min:1',
        ]);

        $data = $request->get('subscription');

        try {
            // Для тестовых подписок не создаем продукты в Stripe
            if (!isset($data['is_test']) || !$data['is_test']) {
                $stripe = new StripeClient(config('cashier.secret'));

                // If subscription is new or price has changed
                if (!$subscription->exists || $subscription->price != $data['price']) {
                    // Create product in Stripe
                    $product = $stripe->products->create([
                        'name' => $data['name'],
                        'description' => $this->generateDescription($data),
                    ]);

                    // Create price in Stripe
                    $price = $stripe->prices->create([
                        'product' => $product->id,
                        'unit_amount' => $data['price'] * 100, // В копейках/центах
                        'currency' => 'aed',
                        'recurring' => [
                            'interval' => 'month',
                        ],
                    ]);

                    $data['stripe_product_id'] = $product->id;
                    $data['stripe_price_id'] = $price->id;
                }
            } else {
                // Для тестовых подписок устанавливаем цену в 0 и убираем Stripe ID
                $data['price'] = 0.00;
                $data['stripe_product_id'] = null;
                $data['stripe_price_id'] = null;
            }

            $subscription->fill($data)->save();

            Alert::success('Subscription successfully saved');
        } catch (\Exception $e) {
            Log::error('Error saving subscription: ' . $e->getMessage());
            Alert::error('Error saving subscription: ' . $e->getMessage());
        }

        return redirect()->route('platform.subscriptions.list');
    }

    protected function generateDescription(array $data): string
    {
        return sprintf(
            "Subscription %s: %d days, %d orders, %d contacts",
            $data['name'],
            $data['duration_days'],
            $data['max_orders'],
            $data['max_contacts']
        );
    }

    public function commandBar(): array
    {
        return [
            Button::make('Save')
                ->icon('check')
                ->method('createOrUpdate'),
        ];
    }
}
