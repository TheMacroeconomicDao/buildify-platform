<?php

namespace App\Mail;

use App\Models\Order;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ExecutorOrderNotification extends Mailable
{
    use Queueable, SerializesModels;

    private Order $order;
    private User $executor;

    /**
     * Create a new message instance.
     */
    public function __construct(Order $order, User $executor)
    {
        $this->order = $order;
        $this->executor = $executor;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: __('order.executor.selected_notification_subject'),
            from: config('mail.executor_notification.address', config('mail.from.address')),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'email.executor_order_notification',
            with: [
                'order' => $this->order,
                'executor' => $this->executor,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
