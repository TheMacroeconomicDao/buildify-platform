<?php

namespace App\Orchid\Screens\Order\Response;

use App\Models\OrderResponse;
use App\Orchid\Layouts\Order\Response\EditLayout;
use App\Orchid\Layouts\Order\Response\ShowLayout;
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
    private ?OrderResponse $orderResponse = null;

    /**
     * Fetch data to be displayed on the screen.
     *
     * @return array
     */
    public function query(OrderResponse $orderResponse): iterable
    {
        $this->orderResponse = $orderResponse;

        return [
            'orderResponse' => $orderResponse,
            'review' => $orderResponse->review,
        ];
    }

    /**
     * Display header name.
     *
     * @return string|null
     */
    public function name(): ?string
    {
        return __('Order response');
    }

    public function commandBar(): iterable
    {
        return [
            Button::make(__('Save'))
                ->icon('check')
                ->method('save'),
            Link::make(__('Reset changes'))
                ->icon('reload')
                ->route('platform.systems.orders.responses.edit', ['orderResponse' => $this->orderResponse->id]),
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
            ShowLayout::class,
            EditLayout::class,
        ];
    }

    public function save(OrderResponse $orderResponse, Request $request): RedirectResponse
    {
        $orderResponse = DB::transaction(function () use ($orderResponse, $request) {
            $data = $request->validate([
                'review.rating' => 'required_with:review.text|string|between:1,5',
                'review.text' => 'nullable|string',
                'orderResponse.status' => 'required|integer',
            ]);

            $orderResponse->update([
                'status' => $data['orderResponse']['status'],
            ]);

            if ($data['review']['text'] !== null || $data['review']['rating'] !== null) {
                if ($orderResponse->review()->exists()) {
                    $orderResponse->review()->update([
                        'text' => $data['review']['text'],
                        'rating' => $data['review']['rating'],
                    ]);
                } else {
                    $orderResponse->review()->create([
                        'text' => $data['review']['text'],
                        'rating' => $data['review']['rating'],
                        'author_id' => $orderResponse->order->author_id,
                        'order_id' => $orderResponse->order_id,
                        'executor_id' => $orderResponse->executor_id,
                    ]);
                }
            }

            return $orderResponse->refresh();
        });

        Toast::info(__('Order response updated'));

        return redirect()->route('platform.systems.orders.responses.edit', ['orderResponse' => $orderResponse->id,]);
    }
}
