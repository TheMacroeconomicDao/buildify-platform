<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;

class AdminNotificationEvent extends BaseNotificationEvent
{
    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin'),
        ];
    }
}
