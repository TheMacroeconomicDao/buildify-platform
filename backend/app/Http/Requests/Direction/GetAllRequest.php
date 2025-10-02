<?php

namespace App\Http\Requests\Direction;

use App\Http\Requests\CustomFromRequest;

class GetAllRequest extends CustomFromRequest
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
        ];
    }

    public function messages():array
    {
        return [
        ];
    }
}
