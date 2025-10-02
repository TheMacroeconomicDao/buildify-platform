<?php

namespace App\Enums\Order;

enum ResponseStatus: int
{
    case Sent = 0; //-- Отправлен
    case Rejected = 1; //-- Отклонён
    case ContactReceived = 2; //-- Получен контакт заказчика
    case ContactOpenedByExecutor = 3; //-- Контакт открыт исполнителем (исполнитель отправил свои контакты)
    case OrderReceived = 4; //-- Получен заказ
    case TakenIntoWork = 5; //-- Взят в работу
    case Deleted = 6; //-- Удален

    public static function showContactData(): array
    {
        return [
            self::ContactReceived->value, self::ContactOpenedByExecutor->value,
            self::OrderReceived->value, self::TakenIntoWork->value,
        ];
    }

    public static function showExecutorContactData(): array
    {
        return [
            self::ContactOpenedByExecutor->value,
            self::OrderReceived->value, self::TakenIntoWork->value,
        ];
    }
}
