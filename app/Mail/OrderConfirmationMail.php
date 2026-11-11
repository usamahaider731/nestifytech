<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $order;
    public $orderItems;
    public $recipientRole; // 'customer' or 'admin'

    public function __construct($order, $orderItems = [], string $recipientRole = 'customer')
    {
        $this->order         = $order;
        $this->orderItems    = $orderItems;
        $this->recipientRole = $recipientRole;
    }

    public function envelope(): Envelope
    {
        $fromAddress = config('mail.from.address') ?: 'info.nestifytech@gmail.com';
        $fromName    = config('mail.from.name') ?: 'NestifyTech';

        $orderId = is_object($this->order) ? $this->order->id : ($this->order['id'] ?? '');
        $subject = $this->recipientRole === 'admin'
            ? "New Order Received #{$orderId} – " . config('app.name', 'NestifyTech')
            : "Order Confirmed #{$orderId} – Thank you for your purchase!";

        return new Envelope(
            from: new Address($fromAddress, $fromName),
            subject: $subject,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.order-confirmation',
            with: [
                'order'         => $this->order,
                'orderItems'    => $this->orderItems,
                'recipientRole' => $this->recipientRole,
            ]
        );
    }

    public function attachments(): array
    {
        return [];
    }
}

