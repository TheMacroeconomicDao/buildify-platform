<?php

namespace App\Services;

use App\Models\PromoCode;
use App\Models\Tariff;
use App\Models\Transaction;
use App\Models\User;
use Laravel\Cashier\Cashier;

class StripeService
{
    public function createPromoCode(string $name, string $duration, $duration_in_months, $percent_off)
    {
        $coupon = Cashier::stripe()->coupons->create([
            'duration' => $duration,
            'duration_in_months' => $duration_in_months,
            'percent_off' => $percent_off,
        ]);

        return Cashier::stripe()->promotionCodes->create([
            'coupon' => $coupon->id,
            'code' => $name,
        ]);
    }

    public function editPromoCode(string $promoCodeId, string $couponId,  string $name, string $duration, $duration_in_months, $percent_off)
    {
        $coupon = Cashier::stripe()->coupons->update($couponId, [
            'duration' => $duration,
            'duration_in_months' => $duration_in_months,
            'percent_off' => $percent_off,
        ]);

        return Cashier::stripe()->promotionCodes->update($promoCodeId, [
            'coupon' => $coupon->id,
            'code' => $name,
        ]);
    }

    public function createProduct(string $name)
    {
        return Cashier::stripe()->products->create([
            'name' => $name,
        ]);
    }

    public function createPrice(string $productId, string $currency, string $amount, string $interval)
    {
        return Cashier::stripe()->prices->create([
            'currency' => $currency,
            'unit_amount' => $amount,
            'recurring' => [
                'interval' => 'month',
                'interval_count' => $interval,
            ],
            'product' => $productId,
        ]);
    }
}
