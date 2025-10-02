<?php

namespace App\Http\Requests\Direction;

use App\Http\Requests\CustomFromRequest;

class GetRequest extends CustomFromRequest
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
            'id' => ['integer', 'exists:App\Models\Direction,id'], //Направление
        ];
    }

    public function messages()
    {
        return [
            'id.integer' => __('user.invalid_id_format'),
            'id.exists' => __('user.this_training_does_not_exist'),
        ];
    }
}
