<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UserOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public string $otp;
    public string $action;
    public int $minutes;

    /**
     * Create a new message instance.
     */
    public function __construct($user, string $otp, string $action = 'verification', int $minutes = 10)
    {
        $this->user = $user;
        $this->otp = $otp;
        $this->action = $action;
        $this->minutes = $minutes;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subjects = [
            'delete_account' => 'Verification Code: Confirm Account Deletion',
            'change_email'   => 'Verification Code: Confirm Email Update',
            'verification'   => 'Your Verification Code',
        ];

        return new Envelope(
            subject: $subjects[$this->action] ?? 'Your NestifyTech Verification Code',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.user-otp',
            with: [
                'user'    => $this->user,
                'otp'     => $this->otp,
                'action'  => $this->action,
                'minutes' => $this->minutes,
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
