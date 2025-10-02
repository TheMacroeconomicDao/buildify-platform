<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Authentication Language Lines
    |--------------------------------------------------------------------------
    |
    | The following language lines are used during authentication for various
    | messages that we need to display to the user. You are free to modify
    | these language lines according to your application's requirements.
    |
    */

    'user_not_found' => 'User not found', //Пользователь не найден
    'executor_not_found' => 'Executor not found', //Исполнитель не найден
    'passwords_dont_match' => 'Passwords don\'t match', //Пароли не совпадают
    'registration_code_sent_by_email' => 'Registration code sent by email', //Регистрационный код отправлен по электронной почте
    'invalid_password' => 'Invalid password', //Неверный пароль
    'email_is_missing' => 'Email is missing', //Отсутствует email
    'phone_is_missing' => 'Phone is missing', //Отсутствует телефон
    'password_is_missing' => 'Password is missing', //Отсутствует пароль
    'user_with_this_email_already_exists' => 'A user with this email already exists', //Пользователь с таким email уже существует
    'user_with_this_phone_already_exists' => 'A user with this phone already exists', //Пользователь с таким телефоном уже существует
    'missing_name' => 'Missing name', //Отсутствует имя
    'code_missing' => 'Code missing', //Отсутствует код
    'invalid_code_format' => 'Invalid code format', //Неверный формат кода
    'invalid_password_format' => 'Invalid password format (The password must preserve uppercase and lowercase letters, numbers, and special characters. !, $, #, or %)', //Неверный формат пароля
    'minimum_password_length_8_characters' => 'Minimum password length 8 characters', //Минимальная длинна пароля 8 символов
    'verification_code' => 'Verification code', //Код верификации
    'an_error_occurred_please_try_later' => 'An error occurred, please try later', //Произошла ошибка попробуйте позднее
    'invalid_verification_code' => 'Invalid verification code', //Неверный код верификации
    'maximum_number_of_water_codes_has_been_exceeded' => 'The maximum number of water codes has been exceeded', //Превышено максимальное количество вода кода
    'error_during_registration' => 'Error during registration', //Ошибка при регистрации
    'password_recovery_code_sent_by_email' => 'Password recovery code sent by email', //Код для восстановления пароля отправлен по электронной почте
    'user_with_this_email_does_not_exist' => 'User with this email does not exist', //Пользователь с таким email не существует
    'password_changed_successfully' => 'Password changed successfully', //Пароль успешно изменено
    'failed_to_change_password' => 'Failed to change password', //Не удалось сменить пароль
    'you_are_not_authorize' => 'You are not authorized', //Вы не авторизованы
    'failed_to_delete_account' => 'Failed to delete account', //Не удалось удалить аккаунт
    'account_deleted_successfully' => 'Account deleted successfully', //Аккаунт успешно удален
    'user_data_has_been_successfully_updated' => 'User data has been successfully updated', //Данные пользователя успешно обновлены
    'failed_to_update_user_data' => 'Failed to update user data', //Не удалось обновить данные пользователя
    'invalid_email_format' => 'Invalid email format', //неверный формат email
    'invalid_ids_format' => 'Invalid ids format', //Неверный формат ids
    'invalid_type_format' => 'Invalid type format', //Неверный формат type
    'invalid_direction_id_format' => 'Invalid direction_id format', //Неверный формат direction_id
    'this_direction_does_not_exist' => 'This direction does not exist', //Данное направление не существует
    'invalid_level_format' => 'Invalid level format', //Неверный формат level
    'invalid_name_format' => 'Invalid name format', //Неверный формат name
    'invalid_id_format' => 'Invalid id format', //Неверный формат id
    'this_training_does_not_exist' => 'This training does not exist', //Данная тренировка не существует
    'available_only_to_executor' => 'Available only to executor', //Доступно только исполнителю
    'birth_date_is_missing' => 'Birth date is missing', //Отсутствует дата рождения
    'invalid_birth_date_format' => 'Invalid birth date format', //Неверный формат даты рождения
    'birth_date_must_be_in_past' => 'Birth date must be in the past', //Дата рождения должна быть в прошлом
    'password_change_code_sent_by_email' => 'Password change code sent by email', //Код для смены пароля отправлен на email
    'password_changed_successfully_logout_required' => 'Password changed successfully. Re-authentication required', //Пароль успешно изменен. Требуется повторная авторизация
    'status' => [
        'Active' => 'Active',
        'Deleted' => 'Deleted',
    ],
    'must_be_executor' => 'User must be an executor',
    'executor_id' => [
        'required' => 'Executor ID is required',
    ],
    'executor' => [
        'not_found' => 'Executor not found',
    ],
    'portfolio' => [
        'name' => [
            'required' => 'Portfolio name is required',
            'max' => 'Portfolio name must not exceed 255 characters',
        ],
        'description' => [
            'max' => 'Description must not exceed 2000 characters',
        ],
        'type' => [
            'required' => 'Portfolio type is required',
            'invalid' => 'Invalid portfolio type',
        ],
        'external_url' => [
            'required_for_link' => 'URL is required for link type',
            'invalid' => 'Invalid URL format',
            'max' => 'URL must not exceed 500 characters',
        ],
        'files' => [
            'required_for_media' => 'Files are required for media type',
            'max_count' => 'Maximum number of files: 10',
            'invalid' => 'One or more files not found',
        ],
        'only_executor_can_create' => 'Only executors can create portfolio',
        'license_verification_required' => 'License verification required to create portfolio',
        'unauthorized' => 'Unauthorized to create portfolio',
    ],
];
