<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class VideoRequest extends CustomFromRequest
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
            'id' => ['integer', 'exists:App\Models\Training,id'], //Тренировка
            'quality' => ['string', Rule::in(['url_4k', 'url_1080', 'url_480', 'audio'])], //Качество
        ];
    }

    public function messages()
    {
        return [
            'id.integer' => __('user.invalid_id_format'),
            'id.exists' => __('user.this_training_does_not_exist'),
            'quality.string' => __('user.invalid_id_format'),
            'quality.exists' => __('user.this_training_does_not_exist'),
        ];
    }
}
