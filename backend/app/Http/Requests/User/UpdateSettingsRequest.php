<?php

namespace App\Http\Requests\User;

use App\Enums\Localization;
use App\Http\Requests\CustomFromRequest;
use Illuminate\Validation\Rule;

class UpdateSettingsRequest extends CustomFromRequest
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
            'localization' => ['string', Rule::in(Localization::values())], // Тип Тренировки Медитации

        ];
    }

    public function messages(): array
    {
        return [
            'type.string' => __('user.invalid_type_format'),
            'type.in' => __('user.invalid_type_format'),
        ];
    }
}
