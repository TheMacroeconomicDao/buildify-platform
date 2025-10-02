<?php

namespace App\Enums\Users;

enum Type: int
{
    case Executor = 0; //-- исполнитель
    case Customer = 1; //-- заказчик
    case Mediator = 2; //-- посредник
    case Admin = 99; //-- Администратор

    public static function registrationTypes(): array
    {
        return [self::Executor->value, self::Customer->value, self::Mediator->value];
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
