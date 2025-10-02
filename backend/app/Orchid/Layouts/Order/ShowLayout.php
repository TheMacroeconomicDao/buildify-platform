<?php

namespace App\Orchid\Layouts\Order;

use App\Models\Order;
use Orchid\Screen\Layouts\Legend;
use Orchid\Screen\Sight;

class ShowLayout extends Legend
{
    protected $target = 'order';

    /**
     * @return iterable
     */
    protected function columns(): iterable
    {
        return [
            Sight::make('id', 'ID'),
            Sight::make('title', 'Title'),
            Sight::make('status', 'Status'),
        ];
    }
}
