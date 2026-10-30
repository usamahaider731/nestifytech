<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DeliveryOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public $order;
    public string $otp;
    public string $currency;
    public int $minutes;

    /**
     * Create a new message instance.
     */
    public function __construct($order, string $otp, string $currency = 'PKR', int $minutes = 30)
    {
        $this->order    = $order;
        $this->otp      = $otp;
        $this->currency = $currency;
        $this->minutes  = $minutes;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "📦 Your Delivery OTP for Order #{$this->order->id} — NestifyTech",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.delivery-otp',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
