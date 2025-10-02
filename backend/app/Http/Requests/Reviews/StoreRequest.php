<?php

namespace App\Http\Requests\Reviews;

use App\Enums\Order\Status;
use App\Enums\Users\Type;
use App\Http\Requests\CustomFromRequest;
use App\Models\ExecutorReview;
use App\Models\Order;
use App\Models\User;
use Illuminate\Validation\Rule;

class StoreRequest extends CustomFromRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules(): array
    {
        return [
            'order_id' => [
                'required',
                'exists:App\Models\Order,id',
                function ($attribute, $value, $fail) {
                    $order = Order::find($value);
                    if (!$order) {
                        return;
                    }

                    // Проверяем, что заказ готов для отзыва
                    if ($order->status !== Status::AwaitingConfirmation->value && 
                        $order->status !== Status::Closed->value && 
                        $order->status !== Status::Completed->value) {
                        $fail(__('order.status.must_be_awaiting_confirmation_or_completed_for_review'));
                    }

                    // Проверяем, что пользователь является автором заказа
                    if ($order->author_id !== auth()->id()) {
                        $fail(__('order.customer.only_author_can_leave_review'));
                    }

                    // Проверяем, что отзыв еще не был оставлен
                    $existingReview = ExecutorReview::where('order_id', $value)
                        ->where('author_id', auth()->id())
                        ->exists();
                    
                    if ($existingReview) {
                        $fail(__('order.review.already_exists'));
                    }
                },
            ],
            'executor_id' => [
                'required',
                'exists:App\Models\User,id',
                function ($attribute, $value, $fail) {
                    $executor = User::find($value);
                    if (!$executor) {
                        return;
                    }

                    // Проверяем, что это исполнитель
                    if ($executor->type !== Type::Executor->value) {
                        $fail(__('user.must_be_executor'));
                    }

                    // Проверяем, что исполнитель назначен на заказ
                    $orderId = $this->input('order_id');
                    if ($orderId) {
                        $order = Order::find($orderId);
                        if ($order && $order->executor_id !== $value) {
                            $fail(__('order.executor.must_be_assigned_to_order'));
                        }
                    }
                },
            ],
            'rating' => 'required|integer|between:1,5',
            'text' => 'required|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'order_id.required' => __('order.id.required'),
            'order_id.exists' => __('order.not_found'),
            'executor_id.required' => __('user.executor_id.required'),
            'executor_id.exists' => __('user.executor.not_found'),
            'rating.required' => __('order.review.rating.required'),
            'rating.integer' => __('order.review.rating.must_be_integer'),
            'rating.between' => __('order.review.rating.must_be_between_1_and_5'),
            'text.required' => __('order.review.text.required'),
            'text.max' => __('order.review.text.max_length'),
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
           'executor_id' => $this->route('executor_id'),
        ]);
    }
}
