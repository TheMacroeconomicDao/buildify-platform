<?php

namespace App\Enums;

enum Currency: string
{
    case Aed = 'aed';
    /**
     * @return array
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
