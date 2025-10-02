<?php

namespace App\Orchid\Screens\Order;

use App\Enums\Order\ResponseStatus;
use App\Models\Order;
use App\Models\OrderResponse;
use App\Orchid\Layouts\Order\EditLayout;
use App\Orchid\Layouts\Order\ShowLayout;
use App\Services\FileService;
use App\Services\ExecutorNotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Layout;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Toast;

class EditScreen extends Screen
{
    public function __construct(private readonly FileService $fileService)
    {
    }

    private ?Order $order = null;

    /**
     * Fetch data to be displayed on the screen.
     *
     * @return array
     */
    public function query(Order $order): iterable
    {
        $this->order = $order;

        return [
            'order' => $order,
        ];
    }

    /**
     * Display header name.
     *
     * @return string|null
     */
    public function name(): ?string
    {
        return __('order.Order');
    }

    public function commandBar(): iterable
    {
        return [
            Button::make(__('Save'))
                ->icon('check')
                ->method('save'),
            Link::make(__('Reset changes'))
                ->icon('reload')
                ->route('platform.systems.orders.edit', ['order' => $this->order->id]),
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
            EditLayout::class,
        ];
    }

    public function save(Order $order, Request $request): RedirectResponse
    {
        $order = DB::transaction(function () use ($order, $request) {
            $data = $request->validate([
                'order.title' => 'required|string',
                'order.work_direction' => 'required|string',
                'order.work_type' => 'required|string',
                'order.description' => 'nullable|string',
                'order.city' => 'required|string',
                'order.address' => 'required|string',

                'order.max_amount' => 'required|numeric',
                'order.executor_id' => 'nullable|integer|exists:users,id',
                'order.status' => 'required|string',
            ])['order'];

            $lastExecutor = $order->executor_id;
            $order->update($data);
            if ($lastExecutor === null && $data['executor_id'] !== null) {
                OrderResponse::updateOrCreate(
                    ['order_id' => $order->id, 'executor_id' => $data['executor_id']],
                    ['status' => ResponseStatus::OrderReceived->value]
                );
                
                // Send notification to new executor
                $executor = \App\Models\User::find($data['executor_id']);
                if ($executor) {
                    $notificationService = app(ExecutorNotificationService::class);
                    $notificationService->sendExecutorSelectedNotification($order, $executor);
                }
            } elseif ($lastExecutor !== null) {
                OrderResponse::query()
                    ->where('order_id', $order->id)
                    ->where('executor_id', $lastExecutor)
                    ->update([
                        'status' => ResponseStatus::Rejected->value,
                    ]);

                if ($data['executor_id'] !== null) {
                    OrderResponse::updateOrCreate(
                        ['order_id' => $order->id, 'executor_id' => $data['executor_id']],
                        ['status' => ResponseStatus::OrderReceived->value]
                    );
                    
                    // Send notification to new executor
                    $executor = \App\Models\User::find($data['executor_id']);
                    if ($executor) {
                        $notificationService = app(ExecutorNotificationService::class);
                        $notificationService->sendExecutorSelectedNotification($order, $executor);
                    }
                }
            }

            $attachments = $request->get('attachments', []);
            foreach ($attachments as $attachment) {
                $order->attachments()->create([
                    'file_id' => $this->fileService->createFromAttachment($attachment, $request->user()->id)->id,
                ]);
            }

            return $order->refresh();
        });

        Toast::info(__('Order updated'));

        return redirect()->route('platform.systems.orders.edit', ['order' => $order->id,]);
    }
}
