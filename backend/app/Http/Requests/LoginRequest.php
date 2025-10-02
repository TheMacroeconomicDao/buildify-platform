<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends CustomFromRequest
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
            'email' => ['required', 'exists:App\Models\User,email'],
            'password' => ['required'],
        ];
    }

    public function messages()
    {
        return [
            'email.required' => __('user.email_is_missing'),
            'email.exists' => __('user.user_not_found'),
            'password.required' => __('user.password_is_missing'),
        ];
    }
}
