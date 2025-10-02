<?php

namespace App\Http\Requests\Registration;

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
            'email' => ['required', 'exists:App\Models\User,email'],
            'password' => ['required', 'min:8', 'regex:/^.*(?=.{3,})(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[\d\x])(?=.*[!$#%]).*$/'],
            'confirmed_password' => ['required'],
            'code' => ['required', 'integer'],
        ];
    }

    public function messages()
    {
        return [
            'email.required' => __('user.email_is_missing'),
            'email.exists' => __('user.user_with_this_email_does_not_exist'),
            'password.required' => __('user.password_is_missing'),
            'password.min' => __('user.minimum_password_length_8_characters'),
            'password.regex' => __('user.invalid_password_format'),
            'confirmed_password.required' => __('user.password_is_missing'),
            'code.required' => __('user.code_missing'),
            'code.integer' => __('user.invalid_code_format'),
        ];
    }
}
