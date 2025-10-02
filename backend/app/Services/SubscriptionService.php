<?php

namespace App\Services;

use App\Models\Price;
use App\Models\PromoCode;
use App\Models\Tariff;
use App\Models\Training;
use App\Models\Transaction;
use App\Models\User;
use Laravel\Cashier\Cashier;

class SubscriptionService
{
    /**
     * @return array
     */
    public function getAll(): array
    {
        $result = Tariff::where('status', 0)->orderBy('id', 'DESC')->get();
        $data = [];
        foreach ($result as $value) {
            $data[] = [
                'id' => $value->id,
                'amount' => $value->amount,
                'month' => $value->month,
                'name' => $value->name,
                'directory' => $value->directory()->get()->select('id')
            ];
        }

        return $data;
    }

    public function getUserAll(User $user): array
    {
        $result = Tariff::where('status', 0)->orderBy('id', 'DESC')->get();
        $data = [];
        foreach ($result as $value) {
           $subscription =  $user->subscription($value->stripe_product_id);
            if ($subscription !== null) {
                $data[] = [
                    'id' => $value->id,
                    'amount' => $value->amount,
                    'month' => $value->month,
                    'name' => $value->name,
                    'directory' => $value->directory()->get()->select('id'),
                    'created_at' => $subscription->created_at,
                ];
            }
        }

        return $data;
    }

    /**
     * @param int $subscription_id
     * @return mixed
     */
    public function get(int $subscription_id): mixed
    {
        $result = Tariff::where('id', $subscription_id)->first();
        $data = null;
        if ($result instanceof Tariff) {
            $data = [
                'id' => $result->id,
                'amount' => $result->amount,
                'month' => $result->month,
                'name' => $result->name,
                'directory' => $value->directory()->get()->select('id'),
            ];
        }
        return $data;
    }

    /**
     * @param int $subscription_id
     * @param User $user
     * @return bool
     */
    public function cancelSubscription(int $subscription_id, User $user): bool
    {
        $result = Tariff::where('id', $subscription_id)->first();
        $user->subscription($result->stripe_product_id)->cancel();

        return true;
    }

    /**
     * @param int $subscription_id
     * @param User $user
     * @param string|null $promo_code
     * @return array
     * @throws \Stripe\Exception\ApiErrorException
     * @throws \Throwable
     */
    public function pay(int $subscription_id, User $user, ?string $promo_code)
    {
        $user_discount = 0;
        $subscription = Tariff::find($subscription_id);
        $stripe_coupon_id = null;
        if ($promo_code !== null) {
            $promoCode = PromoCode::where('name', $promo_code)->first();
            if ($promoCode instanceof PromoCode) {
                $user_discount = $promoCode->user_discount;
                $stripe_coupon_id = $promoCode->stripe_coupon_id;
            }
        }

        $amount = $subscription->amount;
        if ($user_discount > 0) {
            $amount = $amount - ($amount / $user_discount);
        }

        $price = Price::where('product_id', $subscription->stripe_product_id)->orderBy('id', 'DESC')->limit(1)->first();

        $transaction = $this->createTransaction($subscription_id, $user, $user_discount, $amount, $promoCode->id ?? null);

        $result = $user->newSubscription($subscription->stripe_product_id, $price->price_id)
            ->withPromotionCode($stripe_coupon_id)
            ->checkout([
                'success_url' => config('app.success_url') . '?transaction_id=' . $transaction->id,
                'cancel_url' => config('app.cancel_url') . '?transaction_id=' . $transaction->id,
                'metadata' => ['transaction_id' => $transaction->id],
            ]);

        $session = Cashier::stripe()->checkout->sessions->retrieve($result->id);
        $transaction->update(['payment_id' => $session->id]);

        return [
            'url' => $result->url
        ];
    }

    /**
     * @param int $subscription_id
     * @param User $user
     * @param int $user_discount
     * @param int $amount
     * @param int|null $promo_code_id
     * @return int
     * @throws \Throwable
     */
    private function createTransaction(int $subscription_id, User $user, int $user_discount, int $amount, ?int $promo_code_id): Transaction
    {
        $transaction = new Transaction();
        $transaction->subscription_id = $subscription_id;
        $transaction->user_id = $user->id;
        $transaction->user_discount = $user_discount;
        $transaction->amount = $amount;
        $transaction->promo_code_id = $promo_code_id;

        throw_if(
            $transaction->save() === false,
            \Exception::class, 'Error create transaction'
        );

        return $transaction;
    }

    public function availableTraining(int $training_id, User $user): bool
    {
        $training = Training::find($training_id);
        $directory = $training->directory()->get()->toArray();
        $directory_ids = array_column($directory, 'id');
        $subscriptions = Tariff::get();
        foreach ($subscriptions as $subscription) {
            if ($subscription->stripe_product_id !== null && $user->subscription($subscription->stripe_product_id)) {
                $subscriptionDirectory = $subscription->directory()->get()->toArray();
                $ids = array_column($subscriptionDirectory, 'id');
                foreach ($ids as $id) {
                    if (in_array($id, $directory_ids)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * Проверяет, может ли пользователь откликнуться на заказ
     * @param User $user
     * @return array ['can_respond' => bool, 'message' => string]
     */
    public function canUserRespondToOrder(User $user): array
    {
        // Используем новый метод для проверки платной подписки
        if (!$user->hasActivePaidSubscription()) {
            return [
                'can_respond' => false,
                'message' => 'You need an active subscription to respond to orders. Would you like to view subscription plans?'
            ];
        }

        $currentTariff = $user->currentTariff();

        // Проверяем лимит откликов (используем max_orders как лимит откликов)
        if ($currentTariff && $currentTariff->max_orders !== null && $currentTariff->max_orders >= 0) {
            // Подсчитываем количество откликов пользователя за текущий период подписки
            $currentResponses = \App\Models\OrderResponse::where('executor_id', $user->id)
                ->when($user->subscription_started_at, function ($query) use ($user) {
                    // Считаем отклики за текущий период подписки
                    $query->where('created_at', '>=', $user->subscription_started_at);
                })
                ->count();

            if ($currentResponses >= $currentTariff->max_orders) {
                return [
                    'can_respond' => false,
                    'message' => 'Order response limit reached for current subscription. Upgrade your plan to respond to more orders.'
                ];
            }
        }

        return [
            'can_respond' => true,
            'message' => 'OK'
        ];
    }

    /**
     * Проверяет, может ли пользователь взять заказ в работу
     * @param User $user
     * @return array ['can_take' => bool, 'message' => string]
     */
    public function canUserTakeOrder(User $user): array
    {
        // Используем новый метод для проверки платной подписки
        if (!$user->hasActivePaidSubscription()) {
            $currentTariff = $user->currentTariff();
            
            // Определяем тип сообщения об ошибке
            if (!$currentTariff || $currentTariff->name === 'Free') {
                return [
                    'can_take' => false,
                    'message' => 'Subscription required to take orders'
                ];
            }
            
            // Проверяем, является ли это тестовым тарифом
            $isTestTariff = stripos($currentTariff->name, 'test') !== false;
            
            if (!$isTestTariff && $currentTariff->price == 0) {
                return [
                    'can_take' => false,
                    'message' => 'Subscription required to take orders'
                ];
            } else {
                return [
                    'can_take' => false,
                    'message' => 'Subscription expired'
                ];
            }
        }

        $currentTariff = $user->currentTariff();

        // Проверяем лимит заказов в работе
        if ($currentTariff->max_orders > 0) {
            $currentOrders = $user->executorOrders()
                ->whereIn('status', [
                    \App\Enums\Order\Status::InWork->value,
                    \App\Enums\Order\Status::AwaitingConfirmation->value
                ])
                ->when($user->subscription_started_at, function ($query) use ($user) {
                    // Считаем заказы за текущий период подписки
                    $query->where('updated_at', '>=', $user->subscription_started_at);
                })
                ->count();

            if ($currentOrders >= $currentTariff->max_orders) {
                return [
                    'can_take' => false,
                    'message' => 'Order limit reached for current subscription'
                ];
            }
        }

        return [
            'can_take' => true,
            'message' => 'OK'
        ];
    }
}
