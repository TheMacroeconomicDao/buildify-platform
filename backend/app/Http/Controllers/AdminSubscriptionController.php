<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Tariff;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AdminSubscriptionController extends Controller
{
    /**
     * Получить список всех доступных тарифов
     */
    public function getTariffs(): JsonResponse
    {
        try {
            $tariffs = Tariff::where('is_active', true)
                ->orderBy('price', 'asc')
                ->get(['id', 'name', 'price', 'duration_days', 'max_orders', 'max_contacts']);

            return response()->json([
                'success' => true,
                'tariffs' => $tariffs
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load tariffs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Получить информацию о подписке пользователя
     */
    public function getUserSubscription(Request $request, int $userId): JsonResponse
    {
        try {
            $user = User::findOrFail($userId);
            $currentTariff = $user->currentTariff();

            return response()->json([
                'success' => true,
                'user_id' => $user->id,
                'user_name' => $user->name,
                'user_email' => $user->email,
                'current_tariff' => $currentTariff,
                'subscription_started_at' => $user->subscription_started_at,
                'subscription_ends_at' => $user->subscription_ends_at,
                'is_active' => $user->hasActiveSubscription(),
                'days_until_expiration' => $user->getDaysUntilSubscriptionExpires(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load user subscription',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Изменить подписку пользователя
     */
    public function updateUserSubscription(Request $request, int $userId): JsonResponse
    {
        $request->validate([
            'tariff_id' => 'required|integer|exists:tariffs,id',
            'custom_duration_days' => 'nullable|integer|min:1|max:365'
        ]);

        try {
            $user = User::findOrFail($userId);
            $tariff = Tariff::findOrFail($request->tariff_id);
            
            // Определяем длительность подписки
            $durationDays = $request->custom_duration_days ?? $tariff->duration_days;
            
            // Активируем подписку
            if ($tariff->name === 'Free' || $tariff->price == 0) {
                // Для бесплатного тарифа
                $user->activateSubscription($tariff);
            } else {
                // Для платного тарифа с возможной кастомной длительностью
                $now = now();
                $endsAt = $durationDays > 0 ? $now->copy()->addDays($durationDays) : null;
                
                $user->update([
                    'current_tariff_id' => $tariff->id,
                    'subscription_started_at' => $now,
                    'subscription_ends_at' => $endsAt,
                ]);
            }

            // Получаем обновленную информацию
            $user->refresh();
            $currentTariff = $user->currentTariff();

            return response()->json([
                'success' => true,
                'message' => "Подписка пользователя {$user->name} успешно обновлена на тариф \"{$tariff->name}\"",
                'user_id' => $user->id,
                'current_tariff' => $currentTariff,
                'subscription_started_at' => $user->subscription_started_at,
                'subscription_ends_at' => $user->subscription_ends_at,
                'is_active' => $user->hasActiveSubscription(),
                'days_until_expiration' => $user->getDaysUntilSubscriptionExpires(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user subscription',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Продлить подписку пользователя на указанное количество дней
     */
    public function extendUserSubscription(Request $request, int $userId): JsonResponse
    {
        $request->validate([
            'extend_days' => 'required|integer|min:1|max:365'
        ]);

        try {
            $user = User::findOrFail($userId);
            $currentTariff = $user->currentTariff();

            if (!$currentTariff || $currentTariff->name === 'Free') {
                return response()->json([
                    'success' => false,
                    'message' => 'Невозможно продлить бесплатную подписку'
                ], 400);
            }

            // Продлеваем подписку
            $currentEndDate = $user->subscription_ends_at ?? now();
            $newEndDate = $currentEndDate->copy()->addDays($request->extend_days);
            
            $user->update([
                'subscription_ends_at' => $newEndDate
            ]);

            return response()->json([
                'success' => true,
                'message' => "Подписка пользователя {$user->name} продлена на {$request->extend_days} дней",
                'user_id' => $user->id,
                'subscription_ends_at' => $user->subscription_ends_at,
                'days_until_expiration' => $user->getDaysUntilSubscriptionExpires(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to extend user subscription',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}