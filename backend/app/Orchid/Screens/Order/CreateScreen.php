<?php

namespace App\Orchid\Screens\Order;

use App\Enums\Order\ResponseStatus;
use App\Models\Order;
use App\Models\OrderResponse;
use App\Orchid\Layouts\Order\CreateLayout;
use App\Services\FileService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Layout;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Toast;

class CreateScreen extends Screen
{
    public function __construct(private readonly FileService $fileService)
    {
    }

    public function query(): iterable
    {
        return ['order' => null];
    }

    /**
     * Display header name.
     *
     * @return string|null
     */
    public function name(): ?string
    {
        return __('Create order');
    }

    public function commandBar(): iterable
    {
        return [
            Button::make(__('Save'))
                ->icon('check')
                ->method('save'),
            Link::make(__('Reset changes'))
                ->icon('reload')
                ->route('platform.systems.orders.create'),
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
            CreateLayout::class,
        ];
    }

    public function save(Request $request): RedirectResponse
    {
        $order = DB::transaction(function () use ($request) {
            $data = $request->validate([
                'order.title' => 'required|string',
                'order.work_direction' => 'required|string',
                'order.work_type' => 'required|string',
                'order.description' => 'nullable|string',
                'order.city' => 'required|string',
                'order.address' => 'required|string',

                'order.max_amount' => 'required|numeric',
                'order.executor_id' => 'nullable|integer|exists:users,id',
                'order.author_id' => 'required|integer|exists:users,id',
                'order.status' => 'required|string',
            ])['order'];

            $order = Order::create($data);

            if ($data['executor_id'] !== null) {
                OrderResponse::create([
                    'order_id' => $order->id,
                    'executor_id' => $data['executor_id'],
                    'status' => ResponseStatus::OrderReceived->value,
                ]);
            }

            $attachments = $request->get('attachments', []);
            foreach ($attachments as $attachment) {
                $order->attachments()->create([
                    'file_id' => $this->fileService->createFromAttachment($attachment, $request->user()->id)->id,
                ]);
            }

            return $order->refresh();
        });

        Toast::info(__('Order created'));

        return redirect()->route('platform.systems.orders.edit', ['order' => $order->id,]);
    }
}
