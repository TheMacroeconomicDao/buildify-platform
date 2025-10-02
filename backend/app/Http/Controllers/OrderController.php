<?php

namespace App\Http\Controllers;

use App\Enums\Order\ResponseStatus;
use App\Enums\Order\Status;
use App\Enums\Users\Type;
use App\Http\Requests\Order\IndexRequest;
use App\Http\Requests\Order\StoreRequest;
use App\Http\Requests\Order\UpdateRequest;
use App\Models\Order;
use App\Models\UserNotification;
use App\Models\WorkDirection;
use App\Models\WorkType;
use App\Services\WorkService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Throwable;

class OrderController extends Controller
{
    /**
     * Получить заказы поиска
     * @param IndexRequest $request
     * @return JsonResponse
     */
    public function index(IndexRequest $request): JsonResponse
    {
        // Debug logging
        \Log::info('OrderController::index called', [
            'sort_by' => $request->get('sort_by'),
            'sort_direction' => $request->get('sort_direction'),
            'all_params' => $request->all()
        ]);

        $sortBy = $request->get('sort_by', 'created_at');
        $sortDirection = $request->get('sort_direction', 'asc');

        // Ensure we don't use planned_start_date (field was removed)
        if ($sortBy === 'planned_start_date') {
            $sortBy = 'created_at';
            \Log::warning('Attempted to sort by planned_start_date, changed to created_at', [
                'original_sort_by' => $request->get('sort_by'),
                'user_id' => auth()->id()
            ]);
        }

        // Validate sort field exists in table
        $allowedSortFields = ['created_at', 'max_amount', 'id', 'title', 'status'];
        if (!in_array($sortBy, $allowedSortFields)) {
            $sortBy = 'created_at';
            \Log::warning('Invalid sort field provided, changed to created_at', [
                'invalid_sort_by' => $request->get('sort_by')
            ]);
        }

        $query = Order::query()
            ->whereIn('status', [Status::SearchExecutor->value, Status::SelectingExecutor->value])
            ->orderBy($sortBy, $sortDirection)
            ->withCount('files');

        $user = auth()->user();
        // Фильтрация по выбранным категориям только для исполнителей
        // Посредники видят все заказы без фильтрации по категориям
        if ($user && $user->type === Type::Executor->value) {
            $works = $user->works()->get(['direction', 'type']);

            if ($works->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'result' => [],
                ]);
            }

            $query->where(function (Builder $builder) use ($works) {
                foreach ($works as $work) {
                    $builder->orWhere(function (Builder $sub) use ($work) {
                        $sub->where('work_direction', $work->direction);
                        if ($work->type !== $work->direction) {
                            $sub->where('work_type', $work->type);
                        }
                    });
                }
            });
        }
        // Для посредников (Type::Mediator) фильтрация не применяется - они видят все заказы

        $orders = $query->with(['files', 'author'])->get()->map(function (Order $order) {
            return [
                'id' => $order->id,
                'title' => $order->title,
                'work_direction' => $order->work_direction,
                'work_direction_label' => $this->getWorkDirectionLabel($order->work_direction),
                'work_direction_icon' => $this->getWorkDirectionIcon($order->work_direction),
                'work_type' => $order->work_type,
                'work_type_label' => $this->getWorkTypeLabel($order->work_type),
                'work_type_icon' => $this->getWorkTypeIcon($order->work_type),
                'description' => $order->description,

                'date_type' => $order->date_type,
                'work_date' => $order->work_date ? $order->work_date->format('Y-m-d') : null,
                'work_time' => $order->work_time,
                'start_date' => $order->start_date ? $order->start_date->format('Y-m-d') : null,
                'start_time' => $order->start_time,
                'end_date' => $order->end_date ? $order->end_date->format('Y-m-d') : null,
                'end_time' => $order->end_time,
                'address' => $order->address,
                'max_amount' => $order->max_amount,
                'files_count' => $order->files_count,
                'files' => $order->files->map(function ($file) {
                    return [
                        'id' => $file->id,
                        'name' => $file->name,
                        'url' => $file->url,
                        'path' => $file->path,
                    ];
                }),
                'author' => $order->author ? [
                    'id' => $order->author->id,
                    'name' => $order->author->name,
                    'avatar' => $order->author->avatar,
                    'customer_rating' => $order->author->customer_rating,
                    'customer_reviews_count' => $order->author->customer_reviews_count,
                    'customer_orders_count' => $order->author->customer_orders_count,
                ] : null,
                'status' => $order->status,
                'created_at' => $order->created_at,
                'updated_at' => $order->updated_at,
            ];
        });

        return response()->json([
            'success' => true,
            'result' => $orders,
        ]);
    }

    public function active(): JsonResponse
    {
        $user = auth()->user();
        $showArchived = request()->get('archived', false); // New parameter for archived orders

        if ($user->type === Type::Customer->value) {
            $statusFilter = $showArchived 
                ? [Status::Closed->value, Status::Completed->value]
                : Status::activeStatuses();

            $ordersQuery = Order::query()
                ->where('author_id', $user->id)
                ->whereIn('status', $statusFilter)
                ->where('customer_archived', false) // Исключаем архивированные заказчиком заказы
                ->orderBy($showArchived ? 'updated_at' : 'created_at', 'desc')
                ->withCount([
                    'files', 
                    'orderResponses',
                    'orderResponses as active_responses_count' => function ($query) {
                        $query->where('status', '!=', 1); // Исключаем отклоненные отклики (статус 1)
                    }
                ]);
        } elseif ($user->type === Type::Executor->value) {
            //-- Показываем заказы где исполнитель откликнулся ИЛИ назначен исполнителем
            $ordersQuery = Order::query()
                ->leftJoin('order_responses', function($join) use ($user) {
                    $join->on('orders.id', '=', 'order_responses.order_id')
                         ->where('order_responses.executor_id', '=', $user->id);
                })
                ->where(function (Builder $builder) use ($user) {
                    $builder->where('orders.executor_id', $user->id) // Назначен исполнителем
                        ->orWhereNotNull('order_responses.id'); // ИЛИ есть отклик от этого исполнителя
                })
                ->whereIn('orders.status', Status::activeStatuses())
                ->where('orders.executor_archived', false) // Исключаем архивированные исполнителем заказы
                ->select('orders.*') // Выбираем только поля заказа
                ->orderByRaw('CASE WHEN order_responses.status=' . ResponseStatus::ContactReceived->value . ' THEN 0
                    WHEN orders.status=' . Status::Rejected->value . ' THEN 0
                    WHEN orders.status=' . Status::InWork->value . ' THEN 1
                    WHEN orders.status=' . Status::AwaitingConfirmation->value . ' THEN 1
                    ELSE 2 END ASC')
                ->orderBy('orders.created_at')
                ->withCount(['files', 'orderResponses']);
        }

        return response()->json([
            'success' => true,
            'result' => $ordersQuery === null
                ? []
                : $ordersQuery
                    ->with(['files', 'author'])
                    ->get()
                    ->map(function (Order $order) {
                        return [
                            'id' => $order->id,
                            'title' => $order->title,
                            'work_direction' => $order->work_direction,
                            'work_direction_label' => $this->getWorkDirectionLabel($order->work_direction),
                            'work_type' => $order->work_type,
                            'work_type_label' => $this->getWorkTypeLabel($order->work_type),
                            'description' => $order->description,
                            'city' => $order->city,
                            'address' => $order->address,
            
                            'date_type' => $order->date_type,
                            'work_date' => $order->work_date ? $order->work_date->format('Y-m-d') : null,
                            'work_time' => $order->work_time,
                            'start_date' => $order->start_date ? $order->start_date->format('Y-m-d') : null,
                            'start_time' => $order->start_time,
                            'end_date' => $order->end_date ? $order->end_date->format('Y-m-d') : null,
                            'end_time' => $order->end_time,
                            'max_amount' => $order->max_amount,
                            'status' => $order->status,
                            'files_count' => $order->files_count,
                            'responses_count' => $order->active_responses_count ?? $order->order_responses_count,
                            'files' => $order->files->map(function ($file) {
                                return [
                                    'id' => $file->id,
                                    'name' => $file->name,
                                    'url' => $file->url,
                                    'path' => $file->path,
                                ];
                            }),
                            'author' => $order->author ? [
                                'id' => $order->author->id,
                                'name' => $order->author->name,
                                'avatar' => $order->author->avatar,
                                'customer_rating' => $order->author->customer_rating,
                                'customer_reviews_count' => $order->author->customer_reviews_count,
                                'customer_orders_count' => $order->author->customer_orders_count,
                            ] : null,
                            'status' => $order->status,
                            'created_at' => $order->created_at,
                            'updated_at' => $order->updated_at,
                        ];
                    }),
        ]);
    }

    /**
     * Получить архив завершенных заказов
     * @return JsonResponse
     */
    public function archived(): JsonResponse
    {
        $user = auth()->user();
        
        // Архивные статусы: Rejected, Closed, Completed, Deleted, MediatorArchived
        $archivedStatuses = Status::archivedStatuses();

        if ($user->type === Type::Customer->value) {
            // Для заказчиков - показываем заказы которые они создали
            $ordersQuery = Order::query()
                ->where('author_id', $user->id)
                ->where(function (Builder $builder) use ($archivedStatuses) {
                    // Показываем либо архивные статусы, либо принудительно архивированные заказчиком
                    $builder->whereIn('status', $archivedStatuses)
                        ->orWhere('customer_archived', true);
                })
                ->orderBy('updated_at', 'desc')
                ->withCount(['files', 'orderResponses'])
                ->with(['author:id,name,avatar,customer_rating,customer_reviews_count,customer_orders_count']);
        } elseif ($user->type === Type::Executor->value) {
            // Для исполнителей - показываем заказы где они были исполнителями
            $ordersQuery = Order::query()
                ->where('executor_id', $user->id)
                ->where(function (Builder $builder) use ($archivedStatuses) {
                    // Показываем либо архивные статусы, либо принудительно архивированные исполнителем
                    $builder->whereIn('status', $archivedStatuses)
                        ->orWhere('executor_archived', true);
                })
                ->orderBy('updated_at', 'desc')
                ->withCount(['files', 'orderResponses'])
                ->with(['author:id,name,avatar,customer_rating,customer_reviews_count,customer_orders_count']);
        } else {
            // Для других типов пользователей - пустой результат
            return response()->json([
                'success' => true,
                'result' => [],
                'pagination' => [
                    'current_page' => 1,
                    'total_pages' => 1,
                    'total_items' => 0,
                    'per_page' => 20,
                ],
            ]);
        }

        $orders = $ordersQuery->paginate(20);

        return response()->json([
            'success' => true,
            'result' => $orders->items(),
            'pagination' => [
                'current_page' => $orders->currentPage(),
                'total_pages' => $orders->lastPage(),
                'total_items' => $orders->total(),
                'per_page' => $orders->perPage(),
            ],
        ]);
    }

    /**
     * Создать новый заказ
     * @param StoreRequest $request
     * @return JsonResponse
     * @throws Throwable
     */
    public function store(StoreRequest $request): JsonResponse
    {
        DB::beginTransaction();
        try {
            throw_if(
                auth()->user()->type !== Type::Customer->value,
                AccessDeniedHttpException::class,
                __('order.customer.only_author_can_create')
            );

            $data = $request->validated();

            // Убираем attachments из основных данных
            if (key_exists('attachments', $data)) {
                unset($data['attachments']);
            }

            // Обработка дат в зависимости от date_type
            $this->processDates($data);

            // Установка системных полей
            $data['author_id'] = auth()->user()->id;
            $data['status'] = Status::SearchExecutor->value;

            $order = Order::create($data);

            // Обработка вложений
            if ($request->has('attachments')) {
                foreach ($request->post('attachments') as $fileId) {
                    $order->attachments()->create([
                        'file_id' => $fileId,
                    ]);
                }
            }

            // Отправляем уведомление о создании заказа
            $notificationService = app(\App\Services\OrderStatusNotificationService::class);
            $notificationService->sendOrderStatusNotification($order, null, Status::SearchExecutor->value);

            DB::commit();
        } catch (Throwable $exception) {
            DB::rollBack();

            throw $exception;
        }

        return response()->json([
            'success' => true,
            'result' => $order->load('files'),
        ]);
    }

    /**
     * Обработка дат для заказа
     * @param array &$data
     */
    private function processDates(array &$data): void
    {
        if ($data['date_type'] === 'single') {
            // Преобразуем дату из DD.MM.YYYY в Y-m-d для БД
            if (isset($data['work_date'])) {
                $workDate = \DateTime::createFromFormat('d.m.Y', $data['work_date']);
                $data['work_date'] = $workDate ? $workDate->format('Y-m-d') : null;
                

            }
            
            // Очищаем поля периода если они были переданы
            unset($data['start_date'], $data['start_time'], $data['end_date'], $data['end_time']);
            
        } elseif ($data['date_type'] === 'period') {
            // Преобразуем даты периода из DD.MM.YYYY в Y-m-d для БД
            if (isset($data['start_date'])) {
                $startDate = \DateTime::createFromFormat('d.m.Y', $data['start_date']);
                $data['start_date'] = $startDate ? $startDate->format('Y-m-d') : null;
                

            }
            
            if (isset($data['end_date'])) {
                $endDate = \DateTime::createFromFormat('d.m.Y', $data['end_date']);
                $data['end_date'] = $endDate ? $endDate->format('Y-m-d') : null;
            }
            
            // Очищаем поля одиночной даты если они были переданы
            unset($data['work_date'], $data['work_time']);
        }
    }

    /**
     * Получить заказ по ID
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $order = Order::with(['files', 'author'])
            ->findOrFail($id);
        $user = auth()->user();

        $result = [
            'id' => $order->id,
            'title' => $order->title,
            'work_direction' => $order->work_direction,
                        'work_direction_label' => $this->getWorkDirectionLabel($order->work_direction),
            'work_direction_icon' => $this->getWorkDirectionIcon($order->work_direction),
            'work_type' => $order->work_type,
            'work_type_label' => $this->getWorkTypeLabel($order->work_type),
            'work_type_icon' => $this->getWorkTypeIcon($order->work_type),
            'description' => $order->description,
            'city' => $order->city,
            'address' => $order->address,

            
            // Новые поля даты и времени
            'date_type' => $order->date_type,
            'work_date' => $order->work_date ? $order->work_date->format('Y-m-d') : null,
            'work_time' => $order->work_time,
            'start_date' => $order->start_date ? $order->start_date->format('Y-m-d') : null,
            'start_time' => $order->start_time,
            'end_date' => $order->end_date ? $order->end_date->format('Y-m-d') : null,
            'end_time' => $order->end_time,
            
            // Дополнительные поля жилья
            'full_address' => $order->full_address,
            'latitude' => $order->latitude,
            'longitude' => $order->longitude,
            'housing_type' => $order->housing_type,
            'housing_type_label' => $this->getHousingOptionLabel('housing_type', $order->housing_type),
            'housing_condition' => $order->housing_condition,
            'housing_condition_label' => $this->getHousingOptionLabel('housing_condition', $order->housing_condition),
            'housing_preparation_level' => $order->housing_preparation_level,
            'housing_preparation_level_label' => $this->getHousingOptionLabel('housing_preparation_level', $order->housing_preparation_level),
            'bathroom_type' => $order->bathroom_type,
            'bathroom_type_label' => $this->getHousingOptionLabel('bathroom_type', $order->bathroom_type),
            'ceiling_height' => $order->ceiling_height,
            'total_area' => $order->total_area,
            'max_amount' => $order->max_amount,
            'status' => $order->status,
            'files' => $order->files->map(function ($file) {
                return [
                    'id' => $file->id,
                    'name' => $file->name,
                    'url' => $file->url,
                    'path' => $file->path,
                ];
            }),
            'author' => $order->author ? [
                'id' => $order->author->id,
                'name' => $order->author->name,
                'avatar' => $order->author->avatar,
                'contact_data' => $order->author->contact_data,
                'customer_rating' => $order->author->customer_rating,
                'customer_reviews_count' => $order->author->customer_reviews_count,
                'customer_orders_count' => $order->author->customer_orders_count,
            ] : null,
            'author_id' => $order->author_id,
            'executor_id' => $order->executor_id,
            'completed_by_executor' => $order->completed_by_executor,
            'completed_by_customer' => $order->completed_by_customer,
            'executor_archived' => $order->executor_archived,
            'customer_archived' => $order->customer_archived,
            'created_at' => $order->created_at,
            'updated_at' => $order->updated_at,
        ];
        
        $result['additional'] = null;

        if ($user->type === Type::Executor->value) {
            $orderResponse = $order->orderResponses()
                ->where('executor_id', $user->id)
                ->first();

            $result['additional']['response'] = $orderResponse !== null ?
                ['id' => $orderResponse->id, 'status' => $orderResponse->status,]
                : null;
            $result['additional']['contacts'] = null;
            if ($orderResponse !== null && in_array($orderResponse->status, ResponseStatus::showContactData())) {
                $result['additional']['contacts'] = $order->author->contact_data;
            }
        } elseif ($user->type === Type::Customer->value && $user->id === $order->author_id) {
            // Для заказчика показываем контакты исполнителя только если он отправил свои контакты
            if ($order->executor_id) {
                $executorResponse = $order->orderResponses()
                    ->where('executor_id', $order->executor_id)
                    ->first();
                
                $result['additional']['executor_response'] = $executorResponse !== null ?
                    ['id' => $executorResponse->id, 'status' => $executorResponse->status,]
                    : null;
                
                $result['additional']['executor_contacts'] = null;
                if ($executorResponse !== null && in_array($executorResponse->status, ResponseStatus::showExecutorContactData())) {
                    $result['additional']['executor_contacts'] = $order->executor->contact_data;
                }
            }
        } elseif ($user->type === Type::Mediator->value && $order->mediator_id === $user->id) {
            // Для посредника показываем всю доступную информацию
            $result['additional']['mediator_data'] = [
                'step' => $order->mediator_step,
                'commission' => $order->mediator_commission,
                'executor_cost' => $order->executor_cost,
                'margin' => $order->mediator_margin,
                'deadline' => $order->project_deadline,
                'notes' => $order->mediator_notes,
            ];
            
            // Показываем контакты исполнителя если есть
            if ($order->executor_id) {
                $result['additional']['executor_contacts'] = $order->executor->contact_data;
            }
        }

        // Добавляем potential_commission для посредников
        if ($user->type === Type::Mediator->value) {
            $mediatorService = app(\App\Services\MediatorService::class);
            $result['potential_commission'] = $mediatorService->calculateCommission($order, $user);
        }

        return response()->json([
            'success' => true,
            'result' => $result,
        ]);
    }

    /**
     * Обновить заказ
     * @param UpdateRequest $request
     * @return JsonResponse
     * @throws Throwable
     */
    public function update(UpdateRequest $request): JsonResponse
    {
        DB::beginTransaction();
        try {
            throw_if(
                auth()->user()->type !== Type::Customer->value,
                AccessDeniedHttpException::class,
                __('order.customer.only_author_can_create')
            );

            $order = Order::query()
                ->where('id', $request->route('id'))
                ->where('author_id', auth()->user()->id)
                ->firstOrFail();

            $data = $request->validated();

            if (key_exists('attachments', $data)) {
                unset($data['attachments']);
            }

            // Handle status changes by customer
            $oldStatus = $order->status;
            $newStatus = $data['status'] ?? $oldStatus;
            
            // Validate status transitions for customers
            if (isset($data['status']) && $data['status'] != $oldStatus) {
                $this->validateCustomerStatusTransition($order, $oldStatus, $newStatus);
            }

            $order->update($data);

            // Send notifications for status changes
            if ($newStatus != $oldStatus) {
                $this->handleStatusChangeNotifications($order, $oldStatus, $newStatus);
            }

            if ($request->has('attachments')) {
                // Удаляем старые файлы
                foreach ($order->attachments as $attachment) {
                    $attachment->delete();
                }

                // Сохраняем новые файлы
                foreach ($request->post('attachments') as $fileId) {
                    $order->attachments()->create([
                        'file_id' => $fileId,
                    ]);
                }
            }

            DB::commit();
        } catch (Throwable $exception) {
            DB::rollBack();

            throw $exception;
        }

        return response()->json([
            'success' => true,
            'result' => $order->load('files'),
        ]);
    }

    /**
     * @param int $id
     * @return JsonResponse
     * @throws Throwable
     */
    public function cancel(int $id): JsonResponse
    {
        $order = Order::findOrFail($id);
        $user = auth()->user();

        throw_if(
            $user->id !== $order->author_id || $user->type !== Type::Customer->value,
            AccessDeniedHttpException::class,
            __('order.customer.only_author_can_cancel')
        );

        throw_if(
            !in_array($order->status, [Status::SearchExecutor->value, Status::SelectingExecutor->value, Status::Cancelled->value,]),
            BadRequestHttpException::class,
            __('order.status.cannot_cancel')
        );

        $oldStatus = $order->status;
        
        // EDGE CASE: Сбрасываем флаги завершения при отмене заказа
        $order->updateOrFail([
            'status' => Status::Cancelled->value,
            'completed_by_executor' => false,
            'completed_by_customer' => false,
            'executor_completed_at' => null,
            'customer_completed_at' => null,
        ]);

        // Отправляем уведомление о смене статуса
        $notificationService = app(\App\Services\OrderStatusNotificationService::class);
        $notificationService->sendOrderStatusNotification($order, $oldStatus, Status::Cancelled->value);

        return response()->json([
            'success' => true,
        ]);
    }



    /**
     * Завершить заказ исполнителем
     * @param int $id
     * @return JsonResponse
     * @throws Throwable
     */
    public function complete(int $id): JsonResponse
    {
        $order = Order::findOrFail($id);
        $user = auth()->user();

        throw_if(
            $user->type !== Type::Executor->value,
            AccessDeniedHttpException::class,
            __('order.executor.only_executor_can_complete_order')
        );

        throw_if(
            $order->executor_id !== $user->id,
            AccessDeniedHttpException::class,
            __('order.executor.only_executor_can_complete_order')
        );

        throw_if(
            !in_array($order->status, [Status::InWork->value, Status::Rejected->value]),
            BadRequestHttpException::class,
            __('order.executor.order_must_be_in_work')
        );

        // EDGE CASE: Проверяем что исполнитель еще не завершал заказ
        throw_if(
            $order->completed_by_executor,
            BadRequestHttpException::class,
            'You have already completed this order. Waiting for customer completion.'
        );

        $oldStatus = $order->status;
        
        // Отмечаем что исполнитель завершил заказ
        $order->updateOrFail([
            'completed_by_executor' => true,
            'executor_completed_at' => now(),
        ]);
        
        // Получаем свежие данные из базы после обновления
        $order->refresh();
        
        // Если обе стороны завершили заказ - переводим в статус Completed
        if ($order->completed_by_executor && $order->completed_by_customer) {
            $order->updateOrFail([
                'status' => Status::Completed->value,
            ]);
            $finalStatus = Status::Completed->value;
            
            // НОВОЕ: Освобождаем средства из escrow исполнителю
            if ($order->escrow_status === 'held' && $order->payment_held > 0) {
                try {
                    $walletService = app(\App\Services\WalletService::class);
                    $walletService->releaseFunds($order);
                } catch (\Exception $e) {
                    \Log::error('Failed to release escrow funds', [
                        'order_id' => $order->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }
        } else {
            // Если только исполнитель завершил - ждем завершения от заказчика
            $order->updateOrFail([
                'status' => Status::AwaitingConfirmation->value,
            ]);
            $finalStatus = Status::AwaitingConfirmation->value;
        }

        // Отправляем уведомление заказчику о завершении работы исполнителем
        if ($order->author) {
            UserNotification::create([
                'user_id' => $order->author->id,
                'data' => json_encode([
                    'type' => 'work_completed',
                    'title' => 'Работа завершена',
                    'message' => "Исполнитель {$user->name} завершил работу по заказу \"{$order->title}\". Проверьте результат.",
                    'order_id' => $order->id,
                    'order_title' => $order->title,
                    'executor_id' => $user->id,
                    'executor_name' => $user->name,
                ]),
                'read_at' => null,
            ]);
        }

        // Отправляем уведомление о смене статуса
        $notificationService = app(\App\Services\OrderStatusNotificationService::class);
        $notificationService->sendOrderStatusNotification($order, $oldStatus, $finalStatus);

        return response()->json([
            'success' => true,
        ]);
    }

    /**
     * Принять работы по заказу заказчиком
     * @param int $id
     * @return JsonResponse
     * @throws Throwable
     */
    public function accept(int $id): JsonResponse
    {
        $order = Order::findOrFail($id);
        $user = auth()->user();

        throw_if(
            $user->type !== Type::Customer->value || $user->id !== $order->author_id,
            AccessDeniedHttpException::class,
            __('order.customer.only_author_can_accept_work')
        );

        throw_if(
            $order->status !== Status::AwaitingConfirmation->value,
            BadRequestHttpException::class,
            __('order.customer.order_must_be_awaiting_confirmation')
        );

        $oldStatus = $order->status;
        
        // Отмечаем что заказчик принял работу (эквивалент завершения)
        $order->updateOrFail([
            'completed_by_customer' => true,
            'customer_completed_at' => now(),
        ]);
        
        // Получаем свежие данные из базы
        $order->refresh();
        
        // Если обе стороны завершили - переводим в Completed, иначе в Closed
        if ($order->completed_by_executor && $order->completed_by_customer) {
            $order->updateOrFail([
                'status' => Status::Completed->value,
            ]);
            $finalStatus = Status::Completed->value;
            
            // НОВОЕ: Освобождаем средства из escrow исполнителю
            if ($order->escrow_status === 'held' && $order->payment_held > 0) {
                try {
                    $walletService = app(\App\Services\WalletService::class);
                    $walletService->releaseFunds($order);
                } catch (\Exception $e) {
                    \Log::error('Failed to release escrow funds on accept', [
                        'order_id' => $order->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }
        } else {
            $order->updateOrFail([
                'status' => Status::Closed->value,
            ]);
            $finalStatus = Status::Closed->value;
        }

        // Отправляем уведомление исполнителю о принятии работы
        if ($order->executor) {
            UserNotification::create([
                'user_id' => $order->executor->id,
                'data' => json_encode([
                    'type' => 'work_accepted',
                    'title' => 'Работа принята',
                    'message' => "Заказчик принял вашу работу по заказу \"{$order->title}\"",
                    'order_id' => $order->id,
                    'order_title' => $order->title,
                    'customer_id' => $user->id,
                    'customer_name' => $user->name,
                ]),
                'read_at' => null,
            ]);
        }

        // Отправляем уведомление о смене статуса
        $notificationService = app(\App\Services\OrderStatusNotificationService::class);
        $notificationService->sendOrderStatusNotification($order, $oldStatus, $finalStatus);

        return response()->json([
            'success' => true,
        ]);
    }

    /**
     * Отклонить работы по заказу заказчиком
     * @param int $id
     * @return JsonResponse
     * @throws Throwable
     */
    public function reject(int $id): JsonResponse
    {
        $order = Order::findOrFail($id);
        $user = auth()->user();

        throw_if(
            $user->type !== Type::Customer->value || $user->id !== $order->author_id,
            AccessDeniedHttpException::class,
            __('order.customer.only_author_can_reject_work')
        );

        throw_if(
            $order->status !== Status::AwaitingConfirmation->value,
            BadRequestHttpException::class,
            __('order.customer.order_must_be_awaiting_confirmation')
        );

        $oldStatus = $order->status;
        
        // EDGE CASE: Сбрасываем флаги завершения при отклонении работы
        $order->updateOrFail([
            'status' => Status::Rejected->value,
            'completed_by_executor' => false,
            'completed_by_customer' => false,
            'executor_completed_at' => null,
            'customer_completed_at' => null,
        ]);

        // Отправляем уведомление исполнителю об отклонении работы
        if ($order->executor) {
            UserNotification::create([
                'user_id' => $order->executor->id,
                'data' => json_encode([
                    'type' => 'work_rejected',
                    'title' => 'Работа отклонена',
                    'message' => "Заказчик отклонил вашу работу по заказу \"{$order->title}\"",
                    'order_id' => $order->id,
                    'order_title' => $order->title,
                    'customer_id' => $user->id,
                    'customer_name' => $user->name,
                ]),
                'read_at' => null,
            ]);
        }

        // Отправляем уведомление о смене статуса
        $notificationService = app(\App\Services\OrderStatusNotificationService::class);
        $notificationService->sendOrderStatusNotification($order, $oldStatus, Status::Rejected->value);

        return response()->json([
            'success' => true,
        ]);
    }

    /**
     * Завершить заказ заказчиком
     * @param int $id
     * @return JsonResponse
     * @throws Throwable
     */
    public function completeByCustomer(int $id): JsonResponse
    {
        $order = Order::findOrFail($id);
        $user = auth()->user();

        throw_if(
            $user->type !== Type::Customer->value || $user->id !== $order->author_id,
            AccessDeniedHttpException::class,
            __('order.customer.only_author_can_complete_order')
        );

        throw_if(
            !in_array($order->status, [Status::InWork->value, Status::AwaitingConfirmation->value]),
            BadRequestHttpException::class,
            'Order must be in work or awaiting confirmation'
        );

        // EDGE CASE: Проверяем что заказчик еще не завершал заказ
        throw_if(
            $order->completed_by_customer,
            BadRequestHttpException::class,
            'You have already completed this order. Waiting for executor completion.'
        );

        $oldStatus = $order->status;
        
        // Отмечаем что заказчик завершил заказ
        $order->updateOrFail([
            'completed_by_customer' => true,
            'customer_completed_at' => now(),
        ]);
        
        // Получаем свежие данные из базы после обновления
        $order->refresh();
        
        // Если обе стороны завершили заказ - переводим в статус Completed
        if ($order->completed_by_executor && $order->completed_by_customer) {
            $order->updateOrFail([
                'status' => Status::Completed->value,
            ]);
            $finalStatus = Status::Completed->value;
        } else {
            // Если только заказчик завершил - ждем завершения от исполнителя
            $order->updateOrFail([
                'status' => Status::AwaitingConfirmation->value,
            ]);
            $finalStatus = Status::AwaitingConfirmation->value;
        }

        // Отправляем уведомление исполнителю о завершении заказчиком
        if ($order->executor) {
            UserNotification::create([
                'user_id' => $order->executor->id,
                'data' => json_encode([
                    'type' => 'customer_completed_order',
                    'title' => 'Заказчик завершил заказ',
                    'message' => "Заказчик завершил заказ \"{$order->title}\". " . 
                                ($finalStatus === Status::Completed->value ? 
                                 'Заказ полностью завершен!' : 
                                 'Завершите заказ с вашей стороны для полного закрытия.'),
                    'order_id' => $order->id,
                    'order_title' => $order->title,
                    'customer_id' => $user->id,
                    'customer_name' => $user->name,
                ]),
                'read_at' => null,
            ]);
        }

        // Отправляем уведомление о смене статуса
        $notificationService = app(\App\Services\OrderStatusNotificationService::class);
        $notificationService->sendOrderStatusNotification($order, $oldStatus, $finalStatus);

        return response()->json([
            'success' => true,
        ]);
    }

    /**
     * Архивировать заказ исполнителем принудительно
     * @param int $id
     * @return JsonResponse
     * @throws Throwable
     */
    public function archiveByExecutor(int $id): JsonResponse
    {
        $order = Order::findOrFail($id);
        $user = auth()->user();

        throw_if(
            $user->type !== Type::Executor->value,
            AccessDeniedHttpException::class,
            'Only executors can archive orders'
        );

        throw_if(
            $order->executor_id !== $user->id,
            AccessDeniedHttpException::class,
            'You can only archive orders assigned to you'
        );

        throw_if(
            $order->status !== Status::AwaitingConfirmation->value,
            BadRequestHttpException::class,
            'Order can only be archived when awaiting confirmation'
        );

        $order->updateOrFail([
            'executor_archived' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Order archived successfully'
        ]);
    }

    /**
     * Архивировать заказ заказчиком принудительно
     * @param int $id
     * @return JsonResponse
     * @throws Throwable
     */
    public function archiveByCustomer(int $id): JsonResponse
    {
        $order = Order::findOrFail($id);
        $user = auth()->user();

        throw_if(
            $user->type !== Type::Customer->value,
            AccessDeniedHttpException::class,
            'Only customers can archive their orders'
        );

        throw_if(
            $order->author_id !== $user->id,
            AccessDeniedHttpException::class,
            'You can only archive your own orders'
        );

        throw_if(
            $order->status !== Status::AwaitingConfirmation->value,
            BadRequestHttpException::class,
            'Order can only be archived when awaiting confirmation'
        );

        // Просто помечаем как архивированный заказчиком, не меняя статус
        $order->updateOrFail([
            'customer_archived' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Order archived successfully'
        ]);
    }

    /**
     * Отказаться от заказа исполнителем
     * @param int $id
     * @return JsonResponse
     * @throws Throwable
     */
    public function refuse(int $id): JsonResponse
    {
        $order = Order::findOrFail($id);
        $user = auth()->user();

        throw_if(
            $user->type !== Type::Executor->value,
            AccessDeniedHttpException::class,
            'Only executors can refuse orders'
        );

        // Проверяем что пользователь связан с заказом (либо как executor_id, либо через order_responses)
        $isAssigned = $order->executor_id === $user->id;
        $hasResponse = $order->orderResponses()->where('executor_id', $user->id)->exists();
        
        throw_if(
            !$isAssigned && !$hasResponse,
            AccessDeniedHttpException::class,
            'You are not assigned to this order'
        );

        // Проверяем статус заказа (может быть как число, так и строка)
        $allowedStatuses = [
            Status::SelectingExecutor->value, // Исполнитель может отозвать отклик
            Status::InWork->value, 
            Status::AwaitingConfirmation->value,
            2, // SelectingExecutor как число
            4, // InWork как число
            5, // AwaitingConfirmation как число
            'selecting_executor', // как строка
            'in_work', // как строка
            'awaiting_confirmation' // как строка
        ];
        
        throw_if(
            !in_array($order->status, $allowedStatuses),
            BadRequestHttpException::class,
            "Order cannot be refused in current status: {$order->status}"
        );

        $oldStatus = $order->status;
        
        // Если заказ в работе - сбрасываем к дефолтному статусу и освобождаем лимит
        if (in_array($order->status, [Status::InWork->value, Status::AwaitingConfirmation->value, 4, 5])) {
            $order->updateOrFail([
                'status' => Status::SearchExecutor->value, // Сброс к дефолтному статусу
                'executor_id' => null,
            ]);
            
            // Уменьшаем счетчик использованных заказов
            $user->decrement('used_orders_count');
        }
        
        // Если заказ в статусе SelectingExecutor - отзываем отклик и сбрасываем статус
        if (in_array($order->status, [Status::SelectingExecutor->value, 2, 'selecting_executor'])) {
            $orderResponse = $order->orderResponses()->where('executor_id', $user->id)->first();
            if ($orderResponse) {
                $orderResponse->delete(); // Удаляем отклик
            }
            
            // Сбрасываем статус к дефолтному
            $order->updateOrFail([
                'status' => Status::SearchExecutor->value,
            ]);
        }

        // Отправляем уведомление заказчику об отказе исполнителя
        if ($order->author) {
            UserNotification::create([
                'user_id' => $order->author->id,
                'data' => json_encode([
                    'type' => 'executor_refused',
                    'title' => 'Исполнитель отказался',
                    'message' => "Исполнитель {$user->name} отказался от выполнения заказа \"{$order->title}\"",
                    'order_id' => $order->id,
                    'order_title' => $order->title,
                    'executor_id' => $user->id,
                    'executor_name' => $user->name,
                ]),
                'read_at' => null,
            ]);
        }

        // Отправляем уведомление о смене статуса
        $notificationService = app(\App\Services\OrderStatusNotificationService::class);
        $notificationService->sendOrderStatusNotification($order, $oldStatus, Status::SearchExecutor->value);

        return response()->json([
            'success' => true,
        ]);
    }

    //// Удалить заказ
    //public function destroy($id)
    //{
    //    $order = Order::findOrFail($id);

    //    // Удаляем файлы
    //    foreach ($order->attachments as $attachment) {
    //        Storage::disk('public')->delete($attachment->file_path);
    //        $attachment->delete();
    //    }

    //    $order->delete();
    //    return response()->json(null, 204);
    //}

    /**
     * Получить лейбл направления работ
     */
    private function getWorkDirectionLabel(?string $directionKey): ?string
    {
        if (!$directionKey) {
            return null;
        }

        $direction = WorkService::getDirectionByKey($directionKey);
        if ($direction) {
            return $direction->getLocalizedName(app()->getLocale());
        }

        // Fallback для старых данных
        $translation = __('work.directions.' . $directionKey);
        return $translation !== 'work.directions.' . $directionKey 
            ? $translation 
            : ucfirst(str_replace('_', ' ', $directionKey));
    }

    /**
     * Получить лейбл типа работ
     */
    private function getWorkTypeLabel(?string $typeKey): ?string
    {
        if (!$typeKey) {
            return null;
        }

        $workType = WorkService::getWorkTypeByKey($typeKey);
        if ($workType) {
            return $workType->getLocalizedName(app()->getLocale());
        }

        // Fallback для старых данных
        $translation = __('work.types.' . $typeKey);
        return $translation !== 'work.types.' . $typeKey 
            ? $translation 
            : ucfirst(str_replace('_', ' ', $typeKey));
    }

    /**
     * Получить лейбл опции жилья
     */
    private function getHousingOptionLabel(?string $type, ?string $key): ?string
    {
        if (!$type || !$key) {
            return null;
        }

        $option = \App\Models\HousingOption::where('type', $type)
            ->where('key', $key)
            ->where('is_active', true)
            ->first();

        if ($option) {
            return $option->getLocalizedLabel(app()->getLocale());
        }

        // Fallback для старых данных
        return ucfirst(str_replace('_', ' ', $key));
    }

    /**
     * Получить иконку направления работ
     */
    private function getWorkDirectionIcon(?string $directionKey): ?string
    {
        if (!$directionKey) {
            return null;
        }

        $direction = WorkService::getDirectionByKey($directionKey);
        return $direction ? $direction->icon : null;
    }

    /**
     * Получить иконку типа работ
     */
    private function getWorkTypeIcon(?string $typeKey): ?string
    {
        if (!$typeKey) {
            return null;
        }

        $workType = WorkService::getWorkTypeByKey($typeKey);
        return $workType ? $workType->icon : null;
    }

    /**
     * Validate status transitions for customer
     */
    private function validateCustomerStatusTransition(Order $order, int $oldStatus, int $newStatus): void
    {
        // Define allowed transitions for customers
        $allowedTransitions = [
            // From InWork can go to:
            4 => [0, 6, 7], // SearchExecutor (return to search), Rejected (issues), Closed (complete)
            // From AwaitingConfirmation can go to:
            5 => [6, 7], // Rejected (issues), Closed (accept)
            // From Rejected can go to:
            6 => [0, 7], // SearchExecutor (return to search), Closed (accept anyway)
        ];

        if (isset($allowedTransitions[$oldStatus]) && 
            !in_array($newStatus, $allowedTransitions[$oldStatus])) {
            throw new \Symfony\Component\HttpKernel\Exception\BadRequestHttpException(
                "Invalid status transition from {$oldStatus} to {$newStatus}"
            );
        }
    }

    /**
     * Handle notifications for status changes
     */
    private function handleStatusChangeNotifications(Order $order, int $oldStatus, int $newStatus): void
    {
        $notificationService = app(\App\Services\OrderStatusNotificationService::class);
        
        // Send notification to executor if order returns to search
        if ($newStatus === 0 && $order->executor_id) {
            \App\Models\UserNotification::create([
                'user_id' => $order->executor_id,
                'data' => json_encode([
                    'type' => 'order_returned_to_search',
                    'title' => 'Order returned to search',
                    'message' => "The customer has returned order \"{$order->title}\" to search for performers",
                    'order_id' => $order->id,
                    'order_title' => $order->title,
                ]),
                'read_at' => null,
            ]);
        }
        
        // Send notification to executor if work is rejected
        if ($newStatus === 6 && $order->executor_id) {
            \App\Models\UserNotification::create([
                'user_id' => $order->executor_id,
                'data' => json_encode([
                    'type' => 'work_rejected',
                    'title' => 'Work needs improvement',
                    'message' => "The customer has requested improvements for order \"{$order->title}\"",
                    'order_id' => $order->id,
                    'order_title' => $order->title,
                ]),
                'read_at' => null,
            ]);
        }

        // Send standard status notification
        $notificationService->sendOrderStatusNotification($order, $oldStatus, $newStatus);
    }
}
