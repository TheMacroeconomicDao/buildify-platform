<?php

namespace App\Http\Requests\User;

use App\Enums\Users\Type;
use App\Http\Requests\CustomFromRequest;
use App\Rules\PhoneNumberCheck;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class EditRequest extends CustomFromRequest
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
        $user = $this->user();

        if ($user->type === Type::Executor->value) {
            return [
                'name' => ['required', 'string'],
                'about_me' => ['nullable', 'string'],
                'email' => ['required', Rule::unique('users')->ignore($user->id)],
                'phone' => ['required', Rule::unique('users')->ignore($user->id), new PhoneNumberCheck],
                'telegram' => ['nullable', 'string'],
                'whatsApp' => ['nullable', 'string'],
                'facebook' => ['nullable', 'string'],
                'viber' => ['nullable', 'string'],
                'instagram_url' => ['nullable', 'url', 'max:500'],
                'work_experience' => ['nullable', 'integer', 'min:0', 'max:50'],
            ];
        } elseif ($user->type === Type::Customer->value) {
            return [
                'name' => ['required', 'string'],
                'email' => ['required', Rule::unique('users')->ignore($user->id)],
                'phone' => ['required', Rule::unique('users')->ignore($user->id), new PhoneNumberCheck],
                'telegram' => ['nullable', 'string'],
                'whatsApp' => ['nullable', new PhoneNumberCheck],
                'facebook' => ['nullable', 'string'],
                'viber' => ['nullable', 'string'],
                'instagram_url' => ['nullable', 'url', 'max:500'],
                'birth_date' => ['required', 'date', 'before:today'],
                'work_experience' => ['nullable', 'integer', 'min:0', 'max:50'],
            ];
        }

        throw new AccessDeniedHttpException(__('user.invalid_type_format'));
    }

    public function messages(): array
    {
        return [
            'email.required' => __('user.email_is_missing'),
            'email.unique' => __('user.user_with_this_email_already_exists'),

            'phone.required' => __('user.phone_is_missing'),
            'phone.unique' => __('user.user_with_this_phone_already_exists'),

            'name.required' => __('user.missing_name'),
            'name.string' => __('user.name_characters_only'),

            'about_me.string' => __('user.name_characters_only'),

            'telegram.string' => __('user.telegram_characters_only'),

            'whatsApp.string' => __('user.whatsApp_characters_only'),

            'facebook.string' => __('user.facebook_characters_only'),

            'viber.string' => __('user.viber_characters_only'),


            
            'birth_date.required' => __('user.birth_date_is_missing'),
            'birth_date.date' => __('user.invalid_birth_date_format'),
            'birth_date.before' => __('user.birth_date_must_be_in_past'),
            
            'work_experience.integer' => 'Стаж работы должен быть числом',
            'work_experience.min' => 'Стаж работы не может быть отрицательным',
            'work_experience.max' => 'Стаж работы не может превышать 50 лет',
        ];
    }
}
