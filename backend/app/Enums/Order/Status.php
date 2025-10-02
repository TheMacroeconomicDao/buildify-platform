<?php

namespace App\Enums\Order;

enum Status: int
{
    case SearchExecutor = 0; //-- Поиск исполнителя
    case Cancelled = 1; //-- Отменён
    case SelectingExecutor = 2; //-- Выбор исполнителя
    case ExecutorSelected = 3; //-- Исполнитель выбран
    case InWork = 4; //-- В работе
    case AwaitingConfirmation = 5; //-- Ждёт подтверждения
    case Rejected = 6; //-- Отклонён
    case Closed = 7; //-- Закрыт
    case Completed = 8; //-- Завершён
    case Deleted = 9; //-- Удалён
    
    // Статусы для workflow посредника
    case MediatorStep1 = 10; //-- Этап уточнения деталей (посредник)
    case MediatorStep2 = 11; //-- Поиск исполнителя (посредник)
    case MediatorStep3 = 12; //-- Реализация проекта (посредник)
    case MediatorArchived = 13; //-- Архивирован посредником

    public static function activeStatuses(): array
    {
        return [
            self::SearchExecutor->value, self::SelectingExecutor->value, self::ExecutorSelected->value,
            self::InWork->value, self::AwaitingConfirmation->value, self::Rejected->value,
            self::MediatorStep1->value, self::MediatorStep2->value, self::MediatorStep3->value,
        ];
    }
    
    public static function archivedStatuses(): array
    {
        return [
            self::Closed->value,
            self::Completed->value,
            self::Deleted->value,
            self::MediatorArchived->value,
        ];
    }
    
    public static function mediatorStatuses(): array
    {
        return [
            self::MediatorStep1->value, self::MediatorStep2->value, self::MediatorStep3->value,
            self::MediatorArchived->value,
        ];
    }
}
