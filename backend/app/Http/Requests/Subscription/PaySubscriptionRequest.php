<?php

namespace App\Http\Requests\Subscription;

use App\Http\Requests\CustomFromRequest;

class PaySubscriptionRequest extends CustomFromRequest
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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'id_subscription' => ['required', 'integer', 'exists:App\Models\Tariff,id'],
            'promo_code' => ['nullable', 'string'],
        ];
    }

    public function messages()
    {
        return [
            'id_subscription.required' => __('id subscription required'),
            'id_subscription.integer' => __('user.invalid_id_format'),
            'id_subscription.exists' => __('user.this_training_does_not_exist'),
            'promo_code.string' => __('promo code to string'),
        ];
    }
}
