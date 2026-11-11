<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderStatusChangedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $order;
    public string $status;
    public string $statusNote;

    public function __construct($order, string $status, string $statusNote = '')
    {
        $this->order      = $order;
        $this->status     = $status;
        $this->statusNote = $statusNote;
    }

    public function envelope(): Envelope
    {
        $fromAddress = config('mail.from.address') ?: 'info.nestifytech@gmail.com';
        $fromName    = config('mail.from.name') ?: 'NestifyTech';

        $orderId = is_object($this->order) ? $this->order->id : ($this->order['id'] ?? '');
        $statusLabel = ucfirst($this->status);

        return new Envelope(
            from: new Address($fromAddress, $fromName),
            subject: "Update on Order #{$orderId}: {$statusLabel} – " . config('app.name', 'NestifyTech'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.order-status-changed',
            with: [
                'order'      => $this->order,
                'status'     => $this->status,
                'statusNote' => $this->statusNote,
            ]
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
