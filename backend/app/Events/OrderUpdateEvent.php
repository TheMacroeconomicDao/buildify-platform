<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\PrivateChannel;

class OrderUpdateEvent extends BaseNotificationEvent
{
    public Order $order;

    /**
     * Create a new event instance.
     */
    public function __construct(Order $order, string $type, string $title, string $message, array $data = [])
    {
        $this->order = $order;
        parent::__construct($type, $title, $message, $data);
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('order.' . $this->order->id),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return array_merge(parent::broadcastWith(), [
            'order' => [
                'id' => $this->order->id,
                'status' => $this->order->status,
                'title' => $this->order->title,
                'updated_at' => $this->order->updated_at->toISOString(),
            ],
        ]);
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'order.updated';
    }
}
