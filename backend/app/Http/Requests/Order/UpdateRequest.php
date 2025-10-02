<?php

namespace App\Http\Requests\Order;

use App\Http\Requests\CustomFromRequest;
use App\Services\WorkService;
use Illuminate\Validation\Rule;

class UpdateRequest extends CustomFromRequest
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
        $rules = [
            'id' => 'required|exists:App\Models\Order,id',
            'title' => 'required|string',
            'work_direction' => ['required', 'string', Rule::in(WorkService::getDirectionsForValidation())],
            'work_type' => ['required', 'string', Rule::in(WorkService::getWorksForValidation())],
            'description' => 'nullable|string',
            'city' => 'required|string',
            'address' => 'required|string',
            'full_address' => 'nullable|string|max:500',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'housing_type' => 'nullable|in:apartment,house,commercial',
            'housing_condition' => 'nullable|in:new,secondary',
            'housing_preparation_level' => 'nullable|in:without_walls,rough_finish,finish_finish',
            'bathroom_type' => 'nullable|in:separate,combined',
            'ceiling_height' => 'nullable|string|max:50',
            'total_area' => 'nullable|string|max:50',
            'date_type' => 'required|in:single,period',
            'max_amount' => 'required|numeric',
            'status' => 'nullable|integer|in:0,6,7', // Заказчик может изменить статус на: SearchExecutor, Rejected, Closed
            'executor_id' => 'nullable|integer|exists:users,id',
            'attachments' => 'nullable|array',
            'attachments.*' => ['integer', 'exists:App\Models\File,id'],
            // Обратная совместимость

        ];

        // Условные правила для дат в зависимости от date_type (только если даты передаются)
        if ($this->has('work_date') || $this->has('work_time')) {
            if ($this->input('date_type') === 'single') {
                $rules['work_date'] = 'nullable|date_format:d.m.Y';
                $rules['work_time'] = 'nullable|in:morning,afternoon,evening';
            }
        }
        
        if ($this->has('start_date') || $this->has('end_date') || $this->has('start_time') || $this->has('end_time')) {
            if ($this->input('date_type') === 'period') {
                $rules['start_date'] = 'nullable|date_format:d.m.Y';
                $rules['start_time'] = 'nullable|in:morning,afternoon,evening';
                $rules['end_date'] = 'nullable|date_format:d.m.Y|after_or_equal:start_date';
                $rules['end_time'] = 'nullable|in:morning,afternoon,evening';
            }
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'title.required' => __('order.validation.title.required'),
            'title.string' => __('order.validation.title.string'),

            'work_direction.required' => __('order.validation.work_direction.required'),
            'work_direction.string' => __('order.validation.work_direction.string'),

            'work_type.required' => __('order.validation.work_type.required'),
            'work_type.string' => __('order.validation.work_type.string'),

            'description.string' => __('order.validation.description.string'),

            'city.required' => __('order.validation.city.required'),
            'city.string' => __('order.validation.city.string'),

            'address.required' => __('order.validation.address.required'),
            'address.string' => __('order.validation.address.string'),



            'max_amount.required' => __('order.validation.max_amount.required'),
            'max_amount.numeric' => __('order.validation.max_amount.numeric'),

            'attachments.array' => __('order.validation.attachments.array'),

            'attachments.*.integer' => __('order.validation.attachments.*.integer'),
            'attachments.*.exists' => __('order.validation.attachments.*.exists'),
        ];
    }
}
