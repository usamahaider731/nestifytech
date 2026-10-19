<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OfficeSettlementOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public $order;
    public string $otp;
    public string $officeEmail;
    public ?string $riderName;
    public string $currency;
    public int $minutes;

    /**
     * Create a new message instance.
     */
    public function __construct($order, string $otp, string $officeEmail, ?string $riderName = null, string $currency = 'PKR', int $minutes = 30)
    {
        $this->order = $order;
        $this->otp = $otp;
        $this->officeEmail = $officeEmail;
        $this->riderName = $riderName;
        $this->currency = $currency;
        $this->minutes = $minutes;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "🔑 Office Settlement Authorization OTP for Order #{$this->order->id}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.office-settlement-otp',
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
