<?php

namespace App\Http\Requests;

use App\Models\Complaint;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreComplaintRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $reasons = array_keys(Complaint::getReasons());
        
        return [
            'reported_user_id' => [
                'required', 
                'integer', 
                'exists:users,id',
                function ($attribute, $value, $fail) {
                    if ($value == auth()->id()) {
                        $fail('Нельзя подать жалобу на самого себя');
                    }
                }
            ],
            'order_id' => ['nullable', 'integer', 'exists:orders,id'],
            'reason' => ['required', 'string', Rule::in($reasons)],
            'comment' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array
     */
    public function messages(): array
    {
        return [
            'reported_user_id.required' => 'Необходимо указать пользователя для жалобы',
            'reported_user_id.exists' => 'Указанный пользователь не найден',
            'reported_user_id.different' => 'Нельзя подать жалобу на самого себя',
            'reason.required' => 'Необходимо указать причину жалобы',
            'reason.in' => 'Указана некорректная причина жалобы',
            'comment.max' => 'Комментарий не должен превышать 1000 символов',
            'order_id.exists' => 'Указанный заказ не найден',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'complainant_id' => auth()->id(),
        ]);
    }
}
