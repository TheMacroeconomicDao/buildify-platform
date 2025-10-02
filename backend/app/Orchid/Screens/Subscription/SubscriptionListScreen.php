<?php
// app/Orchid/Screens/Subscription/SubscriptionListScreen.php

namespace App\Orchid\Screens\Subscription;

use App\Models\Tariff;
use Orchid\Screen\Screen;
use Orchid\Screen\TD;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Actions\DropDown;
use Orchid\Screen\Actions\Link;
use Orchid\Support\Facades\Layout;
use Orchid\Support\Facades\Alert;
use Illuminate\Support\Facades\Log;

class SubscriptionListScreen extends Screen
{
    public function name(): string
    {
        return 'All Subscriptions';
    }

    public function description(): string
    {
        return 'List of all available subscriptions';
    }

    public function query(): array
    {
        return [
            'subscriptions' => Tariff::filters()->defaultSort('id')->paginate()
        ];
    }

    public function commandBar(): array
    {
        return [
            \Orchid\Screen\Actions\Link::make('Add Subscription')
                ->icon('plus')
                ->route('platform.subscriptions.create')
        ];
    }



    public function layout(): array
    {
        return [
            Layout::table('subscriptions', [
                TD::make('id', 'ID')->sort(),
                TD::make('name', 'Name')->sort()->filter(),
                TD::make('price', 'Price')->sort()
                    ->render(fn(Tariff $s) => number_format($s->price, 2) . ' AED'),
                TD::make('duration_days', 'Days')->sort(),
                TD::make('max_orders', 'Max Orders')->sort(),

                TD::make('max_contacts', 'Max Contacts')->sort(),
                TD::make('is_active', 'Active')->sort()
                    ->render(fn(Tariff $s) => $s->is_active ? 'Yes' : 'No'),
                TD::make('is_test', 'Test')->sort()
                    ->render(fn(Tariff $s) => $s->is_test ? 'Yes' : 'No'),
                TD::make('actions', 'Actions')
                    ->alignRight()
                    ->render(fn(Tariff $s) => DropDown::make()
                        ->icon('options-vertical')
                        ->list([
                            Link::make('Edit')
                                ->route('platform.subscriptions.edit', $s)
                                ->icon('pencil'),
                            Button::make('Delete')
                                ->icon('trash')
                                ->confirm('Are you sure you want to delete this subscription?')
                                ->method('remove')
                                ->parameters(['id' => $s->id])
                                ->canSee(!$this->isSystemTariff($s)),
                        ])),
            ])
        ];
    }

    /**
     * Проверяет, является ли тариф системным (нельзя удалять)
     */
    private function isSystemTariff(Tariff $tariff): bool
    {
        // Защищаем Free тариф от удаления
        return $tariff->name === 'Free';
    }

    /**
     * Удаление подписки
     */
    public function remove(\Illuminate\Http\Request $request)
    {
        \Log::info('Remove method called', ['request_data' => $request->all()]);
        
        $tariffId = $request->get('id');
        
        if (!$tariffId) {
            \Log::error('No tariff ID provided for deletion');
            Alert::error('No tariff ID provided');
            return;
        }
        
        $tariff = Tariff::find($tariffId);
        
        if (!$tariff) {
            \Log::error('Tariff not found for deletion', ['id' => $tariffId]);
            Alert::error('Tariff not found');
            return;
        }
        
        \Log::info('Attempting to delete tariff', ['id' => $tariff->id, 'name' => $tariff->name]);
        
        // Проверяем, что это не системный тариф
        if ($this->isSystemTariff($tariff)) {
            \Log::warning('Attempted to delete system tariff', ['tariff' => $tariff->name]);
            Alert::error('Cannot delete system tariff');
            return;
        }

        // Проверяем, есть ли активные пользователи с этим тарифом
        $activeUsersCount = \App\Models\User::where('current_tariff_id', $tariff->id)
            ->whereNotNull('subscription_ends_at')
            ->where('subscription_ends_at', '>', now())
            ->count();

        if ($activeUsersCount > 0) {
            \Log::warning('Cannot delete tariff with active users', ['tariff_id' => $tariff->id, 'active_users' => $activeUsersCount]);
            Alert::error("Cannot delete tariff. {$activeUsersCount} users have active subscriptions to this tariff.");
            return;
        }

        try {
            // Если у тарифа есть Stripe продукт, архивируем его
            if ($tariff->stripe_product_id) {
                $stripe = new \Stripe\StripeClient(config('cashier.secret'));
                $stripe->products->update($tariff->stripe_product_id, ['active' => false]);
                \Log::info('Stripe product archived', ['product_id' => $tariff->stripe_product_id]);
            }

            // Удаляем тариф
            $tariff->delete();
            \Log::info('Tariff deleted successfully', ['id' => $tariffId]);
            
            Alert::success('Subscription deleted successfully');
        } catch (\Exception $e) {
            \Log::error('Error deleting subscription', ['error' => $e->getMessage(), 'tariff_id' => $tariffId]);
            Alert::error('Error deleting subscription: ' . $e->getMessage());
        }
    }
}
