<?php

namespace App\Enums;

enum Language: string
{
    case En = 'en';
    case Ar = 'ar';
    /**
     * @return array
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
