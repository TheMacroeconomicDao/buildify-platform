<?php

namespace App\Http\Requests\Notification;

use App\Http\Requests\CustomFromRequest;

class ReadNotificationRequest extends CustomFromRequest
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
            'ids' => ['nullable', 'array'],
        ];
    }

    public function messages()
    {
        return [
            'ids.array' => __('user.invalid_ids_format'),
        ];
    }
}
