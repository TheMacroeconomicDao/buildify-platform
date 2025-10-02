<?php

namespace App\Http\Requests\Registration;

use App\Enums\Users\Type;
use App\Http\Requests\CustomFromRequest;
use App\Rules\PhoneNumberCheck;
use Illuminate\Validation\Rule;

class RegistrationEndRequest extends CustomFromRequest
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
        $rules = [
            'email' => ['required'],
            'name' => ['required'],
            'password' => ['required', 'min:8', 'regex:/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!$#%]).{8,}$/'],
            'confirmed_password' => ['required'],
            'promo_code' => ['nullable'],
            'partner_id' => ['nullable', 'string', 'exists:partners,partner_id'],
            'referral_source' => ['nullable', 'string', 'in:mobile_app,web,direct,ios,android'],
            'campaign' => ['nullable', 'string'],
            'device' => ['nullable', 'string'],
            'code' => ['required', 'integer'],
            'type' => ['required', Rule::in(Type::registrationTypes())],
            'phone' => ['required', new PhoneNumberCheck()],
        ];

        // Для заказчиков добавляем birth_date
        if ($this->type == Type::Customer->value) {
            $rules['birth_date'] = ['required', 'date', 'before:today'];
        }

        // Для исполнителей добавляем work_types
        if ($this->type == Type::Executor->value) {
            $rules['work_types'] = ['required', 'array', 'min:1'];
            $rules['work_types.*'] = ['required', 'string'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'email.required' => __('user.email_is_missing'),
            'email.unique' => __('user.user_with_this_email_already_exists'),
            'name.required' => __('user.missing_name'),
            'password.required' => __('user.password_is_missing'),
            'password.min' => __('user.minimum_password_length_8_characters'),
            'password.regex' => __('user.invalid_password_format'),
            'confirmed_password.required' => __('user.password_is_missing'),
            'code.required' => __('user.code_missing'),
            'code.integer' => __('user.invalid_code_format'),
            'phone.required' => __('user.missing_name'),
            'birth_date.required' => __('user.birth_date_is_missing'),
            'birth_date.date' => __('user.invalid_birth_date_format'),
            'birth_date.before' => __('user.birth_date_must_be_in_past'),
        ];
    }
}
