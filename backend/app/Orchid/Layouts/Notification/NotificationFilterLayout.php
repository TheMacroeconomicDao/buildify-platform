<?php

declare(strict_types=1);

namespace App\Orchid\Layouts\Notification;

use App\Orchid\Filters\NotificationTypeFilter;
use App\Orchid\Filters\NotificationStatusFilter;
use Orchid\Screen\Layouts\Selection;

class NotificationFilterLayout extends Selection
{
    /**
     * The screen's layout elements.
     */
    public function filters(): iterable
    {
        return [
            NotificationTypeFilter::class,
            NotificationStatusFilter::class,
        ];
    }
}
