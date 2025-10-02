<?php

namespace App\Orchid\Layouts\Customer;

use Orchid\Filters\Filter;
use Orchid\Screen\Layouts\Selection;

class FilterLayout extends Selection
{
    /**
     * @return Filter[]
     */
    public function filters(): iterable
    {
        return [];
    }
}

