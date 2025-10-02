<?php

namespace App\Http\Requests\User;

use App\Http\Requests\CustomFromRequest;

class UploadLicenseRequest extends CustomFromRequest
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
            'license_file' => [
                'required',
                'file',
                'max:10240' // 10MB - разрешаем любые типы файлов
            ]
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
            'license_file.required' => 'Файл лицензии обязателен',
            'license_file.file' => 'Необходимо загрузить файл',
            'license_file.max' => 'Размер файла не должен превышать 10MB',
        ];
    }
}