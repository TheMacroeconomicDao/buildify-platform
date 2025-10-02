<?php

declare(strict_types=1);

namespace App\Orchid\Layouts\Notification;

use Orchid\Screen\Layouts\Table;
use Orchid\Screen\TD;

class NotificationListLayout extends Table
{
    /**
     * @var string
     */
    public $target = 'notifications';

    /**
     * @return TD[]
     */
    public function columns(): array
    {
        return [
            TD::make('id', 'ID'),
            TD::make('type', 'Type'),
            TD::make('title', 'Title'),
            TD::make('message', 'Message')->render(fn ($notification) => \Str::limit($notification->message, 50)),
            TD::make('created_at', 'Created'),
        ];
    }


}
