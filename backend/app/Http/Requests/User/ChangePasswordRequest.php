<?php

namespace App\Http\Requests\User;

use App\Http\Requests\CustomFromRequest;

class ChangePasswordRequest extends CustomFromRequest
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
            'password' => ['required', 'min:8', 'regex:/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!$#%]).{8,}$/'],
            'new_password' => ['required', 'min:8', 'regex:/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!$#%]).{8,}$/']
        ];
    }

    public function messages()
    {
        return [
            'password.required' => __('user.password_is_missing'),
            'password.min' => __('user.minimum_password_length_8_characters'),
            'password.regex' => __('user.invalid_password_format'),
            'new_password.required' => __('user.password_is_missing'),
            'new_password.min' => __('user.minimum_password_length_8_characters'),
            'new_password.regex' => __('user.invalid_password_format'),
        ];
    }
}
