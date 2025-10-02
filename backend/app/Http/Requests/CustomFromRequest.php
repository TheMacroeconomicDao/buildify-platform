<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Validation\ValidationException;

class CustomFromRequest extends FormRequest
{
    protected function failedValidation(Validator $validator): void
    {
        $response = response()
            ->json(['success' => false, 'message' => $validator->errors()->messages()], 422);

        throw (new ValidationException($validator, $response))
            ->errorBag($this->errorBag)
            ->redirectTo($this->getRedirectUrl());
    }
}
