<?php

namespace App\Orchid\Layouts\Complaint;

use Orchid\Filters\Filter;
use Orchid\Screen\Layouts\Selection;

class FilterLayout extends Selection
{
    /**
     * @return Filter[]
     */
    public function filters(): iterable
    {
        return [
            // Keep empty for now to avoid errors
        ];
    }
}
