<?php

namespace App\Http\Requests\Portfolio;

use App\Enums\Users\Type;
use App\Enums\Users\VerificationStatus;
use App\Http\Requests\CustomFromRequest;
use App\Models\ExecutorPortfolio;

class StoreRequest extends CustomFromRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = auth()->user();
        
        // Только исполнители могут создавать портфолио
        if ($user->type !== Type::Executor->value) {
            return false;
        }
        
        // Лицензия должна быть проверена
        if ($user->verification_status !== VerificationStatus::Approved->value) {
            return false;
        }
        
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
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'type' => 'required|in:' . ExecutorPortfolio::TYPE_MEDIA . ',' . ExecutorPortfolio::TYPE_LINK,
            
            // Для типа "ссылка"
            'external_url' => 'required_if:type,' . ExecutorPortfolio::TYPE_LINK . '|nullable|url|max:500',
            
            // Для типа "медиа"
            'files' => 'required_if:type,' . ExecutorPortfolio::TYPE_MEDIA . '|nullable|array|max:10',
            'files.*' => 'exists:files,id',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => __('portfolio.name.required'),
            'name.max' => __('portfolio.name.max'),
            'description.max' => __('portfolio.description.max'),
            'type.required' => __('portfolio.type.required'),
            'type.in' => __('portfolio.type.invalid'),
            'external_url.required_if' => __('portfolio.external_url.required_for_link'),
            'external_url.url' => __('portfolio.external_url.invalid'),
            'external_url.max' => __('portfolio.external_url.max'),
            'files.required_if' => __('portfolio.files.required_for_media'),
            'files.max' => __('portfolio.files.max_count'),
            'files.*.exists' => __('portfolio.files.invalid'),
        ];
    }

    /**
     * Handle a failed authorization attempt.
     *
     * @return void
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    protected function failedAuthorization()
    {
        $user = auth()->user();
        
        if ($user->type !== Type::Executor->value) {
            throw new \Illuminate\Auth\Access\AuthorizationException(__('portfolio.only_executor_can_create'));
        }
        
        if ($user->verification_status !== VerificationStatus::Approved->value) {
            throw new \Illuminate\Auth\Access\AuthorizationException(__('portfolio.license_verification_required'));
        }
        
        throw new \Illuminate\Auth\Access\AuthorizationException(__('portfolio.unauthorized'));
    }
}
