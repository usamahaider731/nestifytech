<?php

namespace App\Mail;

use App\Models\ContactInquiry;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContactInquiryAdminReplyMail extends Mailable
{
    use Queueable, SerializesModels;

    public ContactInquiry $inquiry;
    public string $replyText;
    public string $fromName;
    public string $fromAddress;

    public function __construct(ContactInquiry $inquiry, string $replyText, string $fromName = '', string $fromAddress = '')
    {
        $this->inquiry     = $inquiry;
        $this->replyText   = $replyText;
        $this->fromName    = $fromName ?: config('mail.from.name', 'NestifyTech Support');
        $this->fromAddress = $fromAddress ?: config('mail.from.address', 'noreply@nestifytech.com');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address($this->fromAddress, $this->fromName),
            subject: 'Re: ' . ($this->inquiry->subject ?: 'Your Inquiry – ' . $this->fromName),
            replyTo: [
                new Address($this->fromAddress, $this->fromName),
            ]
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.contact-inquiry-reply',
            with: [
                'inquiry'     => $this->inquiry,
                'replyText'   => $this->replyText,
                'fromName'    => $this->fromName,
                'fromAddress' => $this->fromAddress,
            ]
        );
    }

    public function attachments(): array
    {
        return [];
    }
}

