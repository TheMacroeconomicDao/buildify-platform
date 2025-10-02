<?php

namespace App\Http\Requests\User;

use App\Http\Requests\CustomFromRequest;

class ChangePasswordConfirmRequest extends CustomFromRequest
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
            'code' => ['required', 'integer'],
            'new_password' => ['required', 'min:8', 'regex:/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!$#%]).{8,}$/'],
            'confirmed_password' => ['required', 'same:new_password'],
        ];
    }

    /**
     * Get the validation error messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'code.required' => __('user.code_missing'),
            'code.integer' => __('user.invalid_code_format'),
            'new_password.required' => __('user.password_is_missing'),
            'new_password.min' => __('user.minimum_password_length_8_characters'),
            'new_password.regex' => __('user.invalid_password_format'),
            'confirmed_password.required' => __('user.password_is_missing'),
            'confirmed_password.same' => __('user.passwords_dont_match'),
        ];
    }
}
