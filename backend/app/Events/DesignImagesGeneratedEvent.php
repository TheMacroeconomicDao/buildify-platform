<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DesignImagesGeneratedEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $userId;
    public string $generationId;
    public array $images;
    public ?string $error;

    /**
     * Create a new event instance.
     */
    public function __construct(int $userId, string $generationId, array $images, ?string $error = null)
    {
        $this->userId = $userId;
        $this->generationId = $generationId;
        $this->images = $images;
        $this->error = $error;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->userId)
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'design.images.generated';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'generation_id' => $this->generationId,
            'images' => $this->images,
            'error' => $this->error,
            'status' => $this->error ? 'failed' : 'completed',
            'timestamp' => now()->toISOString()
        ];
    }
}
