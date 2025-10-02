<?php

namespace App\Http\Requests\Registration;

use App\Http\Requests\CustomFromRequest;

class PasswordRecoveryRequest extends CustomFromRequest
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
        ];
    }

    public function messages()
    {
        return [
            'email.required' => __('user.email_is_missing'),
            'email.exists' => __('user.user_with_this_email_does_not_exist'),
        ];
    }
}
