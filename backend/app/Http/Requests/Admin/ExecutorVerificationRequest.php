<?php

namespace App\Http\Requests\Admin;

use App\Enums\Users\VerificationStatus;
use App\Http\Requests\CustomFromRequest;
use Illuminate\Validation\Rule;

class ExecutorVerificationRequest extends CustomFromRequest
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
            'executor_id' => ['required', 'integer', 'exists:users,id'],
            'status' => ['required', Rule::in([VerificationStatus::Approved->value, VerificationStatus::Rejected->value])],
            'comment' => ['nullable', 'string', 'max:500'],
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
            'executor_id.required' => 'ID исполнителя обязательно',
            'executor_id.integer' => 'ID исполнителя должно быть числом',
            'executor_id.exists' => 'Исполнитель не найден',
            'status.required' => 'Статус верификации обязателен',
            'status.in' => 'Недопустимый статус верификации',
            'comment.max' => 'Комментарий не должен превышать 500 символов',
        ];
    }
}