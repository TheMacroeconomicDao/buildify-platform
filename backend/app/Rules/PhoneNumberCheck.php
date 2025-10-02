<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

class PhoneNumberCheck implements Rule
{
    /**
     * Determine if the validation rule passes.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     * @return bool
     */
    public function passes($attribute, $value): bool
    {
        // Валидация международного формата номера телефона
        // Начинается с +, затем код страны (1-4 цифры, первая не 0), затем национальный номер
        // Общая длина номера от 7 до 15 цифр (включая код страны) согласно ITU-T E.164
        return preg_match('/^\+[1-9]\d{6,14}$/', $value);
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message(): string
    {
        return 'Неверный формат телефона. Используйте международный формат: +[код страны][номер] (от 7 до 15 цифр)';
    }
}
