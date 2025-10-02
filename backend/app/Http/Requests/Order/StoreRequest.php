<?php

namespace App\Http\Requests\Order;

use App\Http\Requests\CustomFromRequest;
use App\Services\WorkService;
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
        $rules = [
            // === ОСНОВНАЯ ИНФОРМАЦИЯ ===
            'title' => 'required|string|max:255',
            'work_direction' => ['required', 'string', Rule::in(WorkService::getDirectionsForValidation())],
            'work_type' => ['required', 'string', Rule::in(WorkService::getWorksForValidation())],
            'description' => 'nullable|string',
            
            // === АДРЕС И ЛОКАЦИЯ ===
            'city' => 'required|string|max:255',
            'address' => 'required|string|max:500',
            'full_address' => 'nullable|string|max:500',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            
            // === ДЕТАЛИ ЖИЛЬЯ ===
            'housing_type' => 'nullable|in:apartment,house,commercial',
            'housing_condition' => 'nullable|in:new,secondary',
            'housing_preparation_level' => 'nullable|in:without_walls,rough_finish,finish_finish',
            'bathroom_type' => 'nullable|in:separate,combined',
            'ceiling_height' => 'nullable|string|max:50',
            'total_area' => 'nullable|string|max:50',
            
            // === ДАТА И ВРЕМЯ ===
            'date_type' => 'required|in:single,period',
            
            // === БЮДЖЕТ ===
            'max_amount' => 'required|numeric|min:0',
            
            // === ВЛОЖЕНИЯ ===
            'attachments' => 'nullable|array',
            'attachments.*' => ['integer', 'exists:App\Models\File,id'],
            
            // === ОБРАТНАЯ СОВМЕСТИМОСТЬ ===

        ];

        // Условные правила для дат в зависимости от date_type
        if ($this->input('date_type') === 'single') {
            $rules['work_date'] = 'required|date_format:d.m.Y';
            $rules['work_time'] = 'required|in:morning,afternoon,evening';
        } elseif ($this->input('date_type') === 'period') {
            $rules['start_date'] = 'required|date_format:d.m.Y';
            $rules['start_time'] = 'required|in:morning,afternoon,evening';
            $rules['end_date'] = 'required|date_format:d.m.Y|after_or_equal:start_date';
            $rules['end_time'] = 'required|in:morning,afternoon,evening';
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            // === ОСНОВНАЯ ИНФОРМАЦИЯ ===
            'title.required' => 'Название заказа обязательно для заполнения',
            'title.string' => 'Название заказа должно быть строкой',
            'title.max' => 'Название заказа не должно превышать 255 символов',

            'work_direction.required' => 'Направление работ обязательно для заполнения',
            'work_direction.string' => 'Направление работ должно быть строкой',

            'work_type.required' => 'Тип работ обязателен для заполнения',
            'work_type.string' => 'Тип работ должен быть строкой',

            'description.string' => 'Описание должно быть строкой',

            // === АДРЕС И ЛОКАЦИЯ ===
            'city.required' => 'Город обязателен для заполнения',
            'city.string' => 'Город должен быть строкой',
            'city.max' => 'Название города не должно превышать 255 символов',

            'address.required' => 'Адрес обязателен для заполнения',
            'address.string' => 'Адрес должен быть строкой',
            'address.max' => 'Адрес не должен превышать 500 символов',

            'full_address.string' => 'Полный адрес должен быть строкой',
            'full_address.max' => 'Полный адрес не должен превышать 500 символов',

            'latitude.numeric' => 'Широта должна быть числом',
            'latitude.between' => 'Широта должна быть в диапазоне от -90 до 90',

            'longitude.numeric' => 'Долгота должна быть числом',
            'longitude.between' => 'Долгота должна быть в диапазоне от -180 до 180',

            // === ДЕТАЛИ ЖИЛЬЯ ===
            'housing_type.in' => 'Тип жилья должен быть: квартира, дом или коммерческое помещение',
            'housing_condition.in' => 'Состояние жилья должно быть: новостройка или вторичное',
            'housing_preparation_level.in' => 'Уровень подготовки должен быть: без стен, черновая или чистовая отделка',
            'bathroom_type.in' => 'Тип санузла должен быть: раздельный или совмещенный',
            'ceiling_height.string' => 'Высота потолков должна быть строкой',
            'ceiling_height.max' => 'Высота потолков не должна превышать 50 символов',
            'total_area.string' => 'Общая площадь должна быть строкой',
            'total_area.max' => 'Общая площадь не должна превышать 50 символов',

            // === ДАТА И ВРЕМЯ ===
            'date_type.required' => 'Тип даты обязателен для заполнения',
            'date_type.in' => 'Тип даты должен быть: одна дата или период',

            'work_date.required' => 'Дата работы обязательна при выборе одной даты',
            'work_date.date_format' => 'Дата работы должна быть в формате ДД.ММ.ГГГГ',

            'work_time.required' => 'Время работы обязательно при выборе одной даты',
            'work_time.date_format' => 'Время работы должно быть в формате ЧЧ:ММ',

            'start_date.required' => 'Дата начала обязательна при выборе периода',
            'start_date.date_format' => 'Дата начала должна быть в формате ДД.ММ.ГГГГ',

            'start_time.required' => 'Время начала обязательно при выборе периода',
            'start_time.date_format' => 'Время начала должно быть в формате ЧЧ:ММ',

            'end_date.required' => 'Дата окончания обязательна при выборе периода',
            'end_date.date_format' => 'Дата окончания должна быть в формате ДД.ММ.ГГГГ',
            'end_date.after_or_equal' => 'Дата окончания должна быть не раньше даты начала',

            'end_time.required' => 'Время окончания обязательно при выборе периода',
            'end_time.date_format' => 'Время окончания должно быть в формате ЧЧ:ММ',

            // === БЮДЖЕТ ===
            'max_amount.required' => 'Максимальная сумма обязательна для заполнения',
            'max_amount.numeric' => 'Максимальная сумма должна быть числом',
            'max_amount.min' => 'Максимальная сумма не может быть отрицательной',

            // === ВЛОЖЕНИЯ ===
            'attachments.array' => 'Вложения должны быть массивом',
            'attachments.*.integer' => 'ID файла должен быть числом',
            'attachments.*.exists' => 'Файл не найден',

            // === ОБРАТНАЯ СОВМЕСТИМОСТЬ ===

        ];
    }
}
