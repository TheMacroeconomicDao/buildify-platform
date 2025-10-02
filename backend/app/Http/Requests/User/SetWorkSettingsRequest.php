<?php

namespace App\Http\Requests\User;

use App\Http\Requests\CustomFromRequest;
use App\Services\WorkService;
use Illuminate\Validation\Rule;

class SetWorkSettingsRequest extends CustomFromRequest
{
    public function rules(): array
    {
        return [
            'work-settings' => ['required', 'array',],
            'work-settings.*.direction' => ['required', 'string', Rule::in(WorkService::getDirectionsForValidation()),],
            'work-settings.*.types' => ['required', 'array',],
            'work-settings.*.types.*' => ['required', 'string', Rule::in(WorkService::getWorksForValidation()),],
        ];
    }

    public function messages(): array
    {
        return [
            'work-settings.required' => __('work.validation.required'),
            'work-settings.array' => __('work.validation.array'),

            'work-settings.*.direction.required' => __('work.validation.*.direction.required'),
            'work-settings.*.direction.string' => __('work.validation.*.direction.string'),
            'work-settings.*.direction.in' => __('work.validation.*.direction.in'),

            'work-settings.*.types.required' => __('work.validation.*.types.required'),
            'work-settings.*.types.array' => __('work.validation.*.types.array'),

            'work-settings.*.types.*.required' => __('work.validation.*.types.*.required'),
            'work-settings.*.types.*.string' => __('work.validation.*.types.*.string'),
            'work-settings.*.types.*.in' => __('work.validation.*.types.*.in'),
        ];
    }
}
