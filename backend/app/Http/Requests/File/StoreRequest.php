<?php

namespace App\Http\Requests\File;

use App\Http\Requests\CustomFromRequest;
use Illuminate\Validation\Rule;

class StoreRequest extends CustomFromRequest
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
            'file' => 'required|mimes:jpeg,jpg,png,webp,mp4,mov,avi,pdf,word,xlsx,doc,docx|max:51200', // 50MB
        ];
    }

    public function messages()
    {
        return [
        ];
    }
}
