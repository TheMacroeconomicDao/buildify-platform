<?php

namespace App\Services;

use App\Models\User;
use App\Models\Order;
use App\Models\MediatorTransaction;
use App\Models\MediatorOrderStep;
use App\Enums\Users\Type;
use App\Enums\Order\Status;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class MediatorService
{
    /**
     * Расчет комиссии посредника
     */
    public function calculateCommission(Order $order, User $mediator): float
    {
        $orderAmount = $order->max_amount ?? 0;
        
        // Приоритет: фиксированная ставка > процент > согласованная цена
        if ($mediator->mediator_fixed_fee && $mediator->mediator_fixed_fee > 0) {
            return (float) $mediator->mediator_fixed_fee;
        }
        
        if ($mediator->mediator_margin_percentage && $mediator->mediator_margin_percentage > 0) {
            return $orderAmount * ($mediator->mediator_margin_percentage / 100);
        }
        
        if ($mediator->mediator_agreed_price && $mediator->mediator_agreed_price > 0) {
            return (float) $mediator->mediator_agreed_price;
        }
        
        // Дефолтная комиссия 10%
        return $orderAmount * 0.1;
    }
    
    /**
     * Назначить посредника на заказ
     */
    public function assignMediatorToOrder(int $orderId, int $mediatorId): bool
    {
        try {
            DB::beginTransaction();
            
            $order = Order::findOrFail($orderId);
            $mediator = User::where('id', $mediatorId)
                ->where('type', Type::Mediator->value)
                ->firstOrFail();
            
            // Проверяем, что заказ может быть взят посредником
            if (!in_array($order->status, [Status::SearchExecutor->value, Status::SelectingExecutor->value])) {
                throw new Exception('Order cannot be assigned to mediator in current status');
            }
            
            // Рассчитываем комиссию
            $commission = $this->calculateCommission($order, $mediator);
            
            // Обновляем заказ - переводим в первый шаг посредника
            $order->update([
                'mediator_id' => $mediatorId,
                'mediator_commission' => $commission,
                'escrow_status' => 'pending',
                'status' => Status::MediatorStep1->value,
                'mediator_step' => MediatorOrderStep::STEP_1_DETAILS
            ]);
            
            // Создаем запись о транзакции
            MediatorTransaction::create([
                'mediator_id' => $mediatorId,
                'order_id' => $orderId,
                'commission_amount' => $commission,
                'status' => 'pending',
                'type' => 'commission'
            ]);
            
            // Создаем или обновляем первый этап для посредника
            MediatorOrderStep::updateOrCreate(
                [
                    'order_id' => $orderId,
                    'step' => MediatorOrderStep::STEP_1_DETAILS,
                ],
                [
                    'mediator_id' => $mediatorId,
                    'status' => MediatorOrderStep::STATUS_ACTIVE,
                    'started_at' => now(),
                    'notes' => 'Этап уточнения деталей заказа начат'
                ]
            );
            
            DB::commit();
            return true;
            
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Failed to assign mediator to order: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Обновить статус заказа через посредника
     */
    public function updateOrderStatus(int $orderId, int $status, int $mediatorId): bool
    {
        try {
            DB::beginTransaction();
            
            $order = Order::where('id', $orderId)
                ->where('mediator_id', $mediatorId)
                ->firstOrFail();
            
            $oldStatus = $order->status;
            $order->update(['status' => $status]);
            
            // Обновляем статус транзакции посредника
            if ($status === Status::Completed->value) {
                $this->processCommissionPayment($order, $mediatorId);
            } elseif ($status === Status::Cancelled->value) {
                $this->cancelMediatorTransaction($order, $mediatorId);
            }
            
            DB::commit();
            return true;
            
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Failed to update order status: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Обработать платеж комиссии при завершении заказа
     */
    private function processCommissionPayment(Order $order, int $mediatorId): void
    {
        $transaction = MediatorTransaction::where('order_id', $order->id)
            ->where('mediator_id', $mediatorId)
            ->where('type', 'commission')
            ->first();
            
        if ($transaction) {
            $transaction->update([
                'status' => 'completed',
                'processed_at' => now()
            ]);
            
            // Обновляем баланс посредника
            $mediator = User::find($mediatorId);
            $mediator->increment('wallet_balance', $transaction->commission_amount);
        }
    }
    
    /**
     * Отменить транзакцию посредника
     */
    private function cancelMediatorTransaction(Order $order, int $mediatorId): void
    {
        MediatorTransaction::where('order_id', $order->id)
            ->where('mediator_id', $mediatorId)
            ->where('type', 'commission')
            ->update([
                'status' => 'cancelled',
                'processed_at' => now()
            ]);
    }
    
    /**
     * Получить активные сделки посредника
     */
    public function getMediatorActiveDeals(int $mediatorId): array
    {
        $orders = Order::with(['author', 'executor', 'files'])
            ->where('mediator_id', $mediatorId)
            ->whereIn('status', Status::activeStatuses())
            ->orderBy('created_at', 'desc')
            ->get();
            
        return $orders->map(function ($order) {
            return [
                'id' => $order->id,
                'title' => $order->title,
                'status' => $order->status,
                'max_amount' => $order->max_amount,
                'commission' => $order->mediator_commission,
                'customer' => [
                    'id' => $order->author->id,
                    'name' => $order->author->name,
                    'avatar' => $order->author->avatar
                ],
                'executor' => $order->executor ? [
                    'id' => $order->executor->id,
                    'name' => $order->executor->name,
                    'avatar' => $order->executor->avatar
                ] : null,
                'created_at' => $order->created_at,
                'files_count' => $order->files->count()
            ];
        })->toArray();
    }
    
    /**
     * Получить статистику посредника
     */
    public function getMediatorStats(int $mediatorId): array
    {
        $totalDeals = Order::where('mediator_id', $mediatorId)->count();
        $completedDeals = Order::where('mediator_id', $mediatorId)
            ->where('status', Status::Completed->value)
            ->count();
        $activeDeals = Order::where('mediator_id', $mediatorId)
            ->whereIn('status', Status::activeStatuses())
            ->count();
        $archivedDeals = Order::where('mediator_id', $mediatorId)
            ->where('status', Status::MediatorArchived->value)
            ->count();
            
        // Статистика по этапам workflow
        $step1Deals = Order::where('mediator_id', $mediatorId)
            ->where('status', Status::MediatorStep1->value)
            ->count();
        $step2Deals = Order::where('mediator_id', $mediatorId)
            ->where('status', Status::MediatorStep2->value)
            ->count();
        $step3Deals = Order::where('mediator_id', $mediatorId)
            ->where('status', Status::MediatorStep3->value)
            ->count();
            
        $totalEarnings = MediatorTransaction::where('mediator_id', $mediatorId)
            ->where('type', 'commission')
            ->where('status', 'completed')
            ->sum('commission_amount');
            
        $pendingEarnings = MediatorTransaction::where('mediator_id', $mediatorId)
            ->where('type', 'commission')
            ->where('status', 'pending')
            ->sum('commission_amount');
            
        // Средняя маржа
        $averageMargin = Order::where('mediator_id', $mediatorId)
            ->whereNotNull('mediator_margin')
            ->avg('mediator_margin') ?? 0;
            
        // Средняя себестоимость
        $averageExecutorCost = Order::where('mediator_id', $mediatorId)
            ->whereNotNull('executor_cost')
            ->avg('executor_cost') ?? 0;
            
        return [
            'total_deals' => $totalDeals,
            'completed_deals' => $completedDeals,
            'active_deals' => $activeDeals,
            'archived_deals' => $archivedDeals,
            'success_rate' => $totalDeals > 0 ? round(($completedDeals / $totalDeals) * 100, 1) : 0,
            'total_earnings' => $totalEarnings,
            'pending_earnings' => $pendingEarnings,
            'average_commission' => $completedDeals > 0 ? round($totalEarnings / $completedDeals, 2) : 0,
            'average_margin' => round($averageMargin, 2),
            'average_executor_cost' => round($averageExecutorCost, 2),
            
            // Статистика по этапам workflow
            'workflow_stats' => [
                'step1_count' => $step1Deals,
                'step2_count' => $step2Deals,
                'step3_count' => $step3Deals,
                'total_workflow' => $step1Deals + $step2Deals + $step3Deals,
            ],
            
            // Эффективность workflow
            'workflow_efficiency' => [
                'completion_rate' => $totalDeals > 0 ? round((($completedDeals + $archivedDeals) / $totalDeals) * 100, 1) : 0,
                'archive_rate' => $totalDeals > 0 ? round(($archivedDeals / $totalDeals) * 100, 1) : 0,
            ]
        ];
    }
    
    /**
     * Получить доступные заказы для посредника
     */
    public function getAvailableOrders(): array
    {
        $orders = Order::with(['author', 'files'])
            ->whereNull('mediator_id') // Заказы без посредника
            ->whereIn('status', [Status::SearchExecutor->value, Status::SelectingExecutor->value])
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();
            
        return $orders->map(function ($order) {
            return [
                'id' => $order->id,
                'title' => $order->title,
                'description' => $order->description,
                'max_amount' => $order->max_amount,
                'work_direction' => $order->work_direction,
                'work_type' => $order->work_type,
                'city' => $order->city,
                'customer' => [
                    'id' => $order->author->id,
                    'name' => $order->author->name,
                    'avatar' => $order->author->avatar
                ],
                'created_at' => $order->created_at,
                'files_count' => $order->files->count(),
                'potential_commission' => $this->calculateCommission($order, auth()->user())
            ];
        })->toArray();
    }
    
    /**
     * Перейти к следующему этапу
     */
    public function moveToNextStep(int $orderId, int $mediatorId, array $stepData = []): bool
    {
        try {
            DB::beginTransaction();
            
            $order = Order::where('id', $orderId)
                ->where('mediator_id', $mediatorId)
                ->firstOrFail();
            
            $currentStep = $order->currentMediatorStep()->first();
            
            if (!$currentStep) {
                throw new Exception('No active step found');
            }
            
            // Сохраняем комментарий к текущему этапу если есть
            if (isset($stepData['notes']) && !empty($stepData['notes'])) {
                \App\Models\MediatorOrderComment::create([
                    'order_id' => $orderId,
                    'mediator_id' => $mediatorId,
                    'step' => $currentStep->step,
                    'comment' => $stepData['notes'],
                    'step_data' => $stepData,
                ]);
            }

            // Завершаем текущий этап
            $currentStep->complete($stepData);
            
            $nextStepNumber = $currentStep->step + 1;
            
            // Проверяем, есть ли следующий этап
            if ($nextStepNumber > MediatorOrderStep::STEP_3_EXECUTION) {
                throw new Exception('No next step available');
            }
            
            // Обновляем статус заказа
            $newStatus = match ($nextStepNumber) {
                MediatorOrderStep::STEP_2_EXECUTOR => Status::MediatorStep2->value,
                MediatorOrderStep::STEP_3_EXECUTION => Status::MediatorStep3->value,
            };
            
            $order->update([
                'status' => $newStatus,
                'mediator_step' => $nextStepNumber
            ]);
            
            // Создаем или обновляем следующий этап
            MediatorOrderStep::updateOrCreate(
                [
                    'order_id' => $orderId,
                    'step' => $nextStepNumber,
                ],
                [
                    'mediator_id' => $mediatorId,
                    'status' => MediatorOrderStep::STATUS_ACTIVE,
                    'started_at' => now(),
                    'notes' => match ($nextStepNumber) {
                        MediatorOrderStep::STEP_2_EXECUTOR => 'Этап поиска исполнителя начат',
                        MediatorOrderStep::STEP_3_EXECUTION => 'Этап реализации проекта начат',
                    }
                ]
            );
            
            DB::commit();
            return true;
            
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Failed to move to next step: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Архивировать заказ
     */
    public function archiveOrder(int $orderId, int $mediatorId, string $reason): bool
    {
        try {
            DB::beginTransaction();
            
            $order = Order::where('id', $orderId)
                ->where('mediator_id', $mediatorId)
                ->firstOrFail();
            
            // Архивируем текущий этап
            $currentStep = $order->currentMediatorStep()->first();
            if ($currentStep) {
                $currentStep->archive($reason);
            }
            
            // Обновляем заказ
            $order->update([
                'status' => Status::MediatorArchived->value,
                'mediator_notes' => ($order->mediator_notes ?? '') . "\nАрхивирован: " . $reason
            ]);
            
            // Отменяем транзакцию
            $this->cancelMediatorTransaction($order, $mediatorId);
            
            DB::commit();
            return true;
            
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Failed to archive order: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Вернуть заказ в приложение
     */
    public function returnOrderToApp(int $orderId, int $mediatorId, string $reason): bool
    {
        try {
            DB::beginTransaction();
            
            $order = Order::where('id', $orderId)
                ->where('mediator_id', $mediatorId)
                ->firstOrFail();
            
            // Возвращаем текущий этап
            $currentStep = $order->currentMediatorStep()->first();
            if ($currentStep) {
                $currentStep->returnToApp($reason);
            }
            
            // Обновляем заказ - возвращаем к поиску исполнителя
            $order->update([
                'status' => Status::SearchExecutor->value,
                'mediator_id' => null,
                'mediator_commission' => null,
                'mediator_step' => null,
                'mediator_notes' => ($order->mediator_notes ?? '') . "\nВозвращен в приложение: " . $reason
            ]);
            
            // Отменяем транзакцию
            $this->cancelMediatorTransaction($order, $mediatorId);
            
            DB::commit();
            return true;
            
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Failed to return order to app: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Обновить данные этапа
     */
    public function updateStepData(int $orderId, int $mediatorId, int $step, array $data): bool
    {
        try {
            $order = Order::where('id', $orderId)
                ->where('mediator_id', $mediatorId)
                ->firstOrFail();
            
            $stepRecord = MediatorOrderStep::where('order_id', $orderId)
                ->where('step', $step)
                ->first();
            
            if ($stepRecord) {
                $stepRecord->update([
                    'data' => array_merge($stepRecord->data ?? [], $data),
                    'notes' => $data['notes'] ?? $stepRecord->notes
                ]);
            }
            
            // Обновляем поля заказа в зависимости от этапа
            $updateData = [];
            
            if ($step == MediatorOrderStep::STEP_2_EXECUTOR) {
                if (isset($data['executor_contact_name'])) {
                    $updateData['executor_contact_name'] = $data['executor_contact_name'];
                }
                if (isset($data['executor_contact_phone'])) {
                    $updateData['executor_contact_phone'] = $data['executor_contact_phone'];
                }
                if (isset($data['executor_cost'])) {
                    $updateData['executor_cost'] = $data['executor_cost'];
                    // Автоматически рассчитываем маржу
                    $updateData['mediator_margin'] = ($order->max_amount ?? 0) - $data['executor_cost'];
                }
            }
            
            if ($step == MediatorOrderStep::STEP_3_EXECUTION) {
                if (isset($data['project_deadline'])) {
                    $updateData['project_deadline'] = $data['project_deadline'];
                }
            }
            
            if (!empty($updateData)) {
                $order->update($updateData);
            }
            
            return true;
            
        } catch (Exception $e) {
            Log::error('Failed to update step data: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Получить детали этапа заказа
     */
    public function getOrderStepDetails(int $orderId, int $mediatorId): array
    {
        $order = Order::with(['author', 'executor', 'files', 'mediatorSteps'])
            ->where('id', $orderId)
            ->where('mediator_id', $mediatorId)
            ->firstOrFail();
        
        $currentStep = $order->currentMediatorStep()->first();
        
        return [
            'order' => [
                'id' => $order->id,
                'title' => $order->title,
                'description' => $order->description,
                'max_amount' => $order->max_amount,
                'city' => $order->city,
                'address' => $order->address,
                'status' => $order->status,
                'mediator_step' => $order->mediator_step,
                'executor_contact_name' => $order->executor_contact_name,
                'executor_contact_phone' => $order->executor_contact_phone,
                'executor_cost' => $order->executor_cost,
                'mediator_margin' => $order->mediator_margin,
                'project_deadline' => $order->project_deadline,
                'mediator_notes' => $order->mediator_notes,
            ],
            'customer' => [
                'id' => $order->author->id,
                'name' => $order->author->name,
                'phone' => $order->author->phone,
                'email' => $order->author->email,
                'avatar' => $order->author->avatar
            ],
            'current_step' => $currentStep ? [
                'step' => $currentStep->step,
                'status' => $currentStep->status,
                'started_at' => $currentStep->started_at,
                'notes' => $currentStep->notes,
                'data' => $currentStep->data,
            ] : null,
            'all_steps' => $order->mediatorSteps->map(function ($step) {
                return [
                    'step' => $step->step,
                    'step_name' => $step->step_name,
                    'status' => $step->status,
                    'status_name' => $step->status_name,
                    'started_at' => $step->started_at,
                    'completed_at' => $step->completed_at,
                    'notes' => $step->notes,
                    'data' => $step->data,
                ];
            }),
            'files' => $order->files->map(function ($file) {
                return [
                    'id' => $file->id,
                    'name' => $file->name,
                    'original_name' => $file->original_name,
                    'mime' => $file->mime,
                    'size' => $file->size,
                    'url' => $file->url,
                ];
            })
        ];
    }
}
