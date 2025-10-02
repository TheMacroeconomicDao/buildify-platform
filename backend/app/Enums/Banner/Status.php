<?php

namespace App\Enums\Banner;

enum Status: int
{
    case InActive = 0;
    case Active = 1;
    case Deleted = 2;
}
