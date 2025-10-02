<?php

namespace App\Http\Requests\Order;

use App\Http\Requests\CustomFromRequest;

class IndexRequest extends CustomFromRequest
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
            'sort_by' => ['nullable', 'string', 'in:max_amount,created_at',],
            'sort_direction' => ['nullable', 'string', 'in:asc,desc',],
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation()
    {
        // Replace planned_start_date with created_at if it's still being sent
        if ($this->input('sort_by') === 'planned_start_date') {
            $this->merge([
                'sort_by' => 'created_at'
            ]);
        }
    }

    public function messages(): array
    {
        return [
            'sort_by.string' => __('order.index_validation.sort_by.string'),
            'sort_by.in' => __('order.index_validation.sort_by.in'),

            'sort_direction.string' => __('order.index_validation.sort_direction.string'),
            'sort_direction.in' => __('order.index_validation.sort_direction.in'),
        ];
    }
}
