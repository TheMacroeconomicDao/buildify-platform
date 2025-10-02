<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;

class UserNotificationEvent extends BaseNotificationEvent
{
    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->userId),
        ];
    }
}
