<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UserEmailChangedNewMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public string $oldEmail;
    public string $newEmail;

    /**
     * Create a new message instance.
     */
    public function __construct($user, string $oldEmail, string $newEmail)
    {
        $this->user = $user;
        $this->oldEmail = $oldEmail;
        $this->newEmail = $newEmail;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Confirmation: Your New Email Address Has Been Updated',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.user-email-changed-new',
            with: [
                'user'     => $this->user,
                'oldEmail' => $this->oldEmail,
                'newEmail' => $this->newEmail,
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
