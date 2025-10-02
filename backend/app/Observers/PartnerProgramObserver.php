<?php

namespace App\Observers;

use App\Models\Order;
use App\Services\PartnerProgramService;
use Illuminate\Support\Facades\Log;

class PartnerProgramObserver
{
    private PartnerProgramService $partnerService;

    public function __construct(PartnerProgramService $partnerService)
    {
        $this->partnerService = $partnerService;
    }

    /**
     * Handle the Order "created" event.
     */
    public function created(Order $order): void
    {
        try {
            // Проверяем, является ли это первым заказом пользователя
            if ($order->author && $order->author->partner_id) {
                $this->partnerService->handleFirstOrder($order);
                
                Log::info('Partner program: first order processed', [
                    'order_id' => $order->id,
                    'user_id' => $order->author->id,
                    'partner_id' => $order->author->partner_id,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Partner program observer error on order created', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle the Order "updated" event.
     */
    public function updated(Order $order): void
    {
        try {
            // Проверяем изменение статуса на "завершен"
            if ($order->isDirty('status') && 
                $order->status === \App\Enums\Order\Status::Completed->value &&
                $order->author && 
                $order->author->partner_id) {
                
                // Рассчитываем комиссию платформы
                $platformCommission = $this->calculatePlatformCommission($order);
                
                if ($platformCommission > 0) {
                    $this->partnerService->handleOrderCommission($order, $platformCommission);
                    
                    Log::info('Partner program: order commission processed', [
                        'order_id' => $order->id,
                        'commission' => $platformCommission,
                        'partner_id' => $order->author->partner_id,
                    ]);
                }
            }
        } catch (\Exception $e) {
            Log::error('Partner program observer error on order updated', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Рассчитать комиссию платформы с заказа
     */
    private function calculatePlatformCommission(Order $order): float
    {
        // Комиссия платформы обычно составляет 10-15% от суммы заказа
        // Это можно настроить в конфиге или брать из модели заказа
        $platformCommissionRate = config('partner.platform_commission_rate', 10);
        
        return $order->max_amount * ($platformCommissionRate / 100);
    }
}