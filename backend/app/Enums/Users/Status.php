<?php

namespace App\Enums\Users;

enum Status: int
{
    case Active = 0; //-- Активный
    case Inactive = 1; //-- Неактивный  
    case Deleted = 2; //-- Удаленный
}
