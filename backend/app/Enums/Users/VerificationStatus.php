<?php

namespace App\Enums\Users;

enum VerificationStatus: int
{
    case Pending = 0;      // На рассмотрении
    case Approved = 1;     // Одобрен
    case Rejected = 2;     // Отклонен
    case NotRequired = 3;  // Не требуется (для заказчиков)

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match($this) {
            self::Pending => 'На рассмотрении',
            self::Approved => 'Одобрен',
            self::Rejected => 'Отклонен',
            self::NotRequired => 'Не требуется',
        };
    }
}