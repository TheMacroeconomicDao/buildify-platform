<?php

namespace App\Enums\Banner;

enum ForWhom: int
{
    case Executor = 0; //-- исполнитель
    case Customer = 1; //-- заказчик
}
