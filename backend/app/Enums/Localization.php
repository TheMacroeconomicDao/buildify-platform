<?php

namespace App\Enums;

enum Localization: string
{
    case En = 'en-US';
    case Ar = 'ar-SA';

    /**
     * @return array
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
