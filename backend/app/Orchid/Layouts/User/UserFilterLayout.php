<?php

namespace App\Orchid\Layouts\User;

use App\Orchid\Filters\UserSearchFilter;
use App\Orchid\Filters\UserTypeFilter;
use App\Orchid\Filters\UserStatusFilter;
use Orchid\Screen\Layouts\Selection;

class UserFilterLayout extends Selection
{
    /**
     * Get the filters elements to be displayed.
     */
    public function filters(): iterable
    {
        return [
            UserSearchFilter::class,
            UserTypeFilter::class,
            UserStatusFilter::class,
        ];
    }
}
