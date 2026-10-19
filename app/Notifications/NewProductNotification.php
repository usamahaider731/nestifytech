<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;

class NewProductNotification extends Notification
{
    use Queueable;

    protected $productName;
    protected $productUrl;

    /**
     * Create a new notification instance.
     */
    public function __construct(string $productName, string $productUrl)
    {
        $this->productName = $productName;
        $this->productUrl = $productUrl;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast']; // store in DB and broadcast via websockets
    }

    /**
     * Get the representation of the notification that will be stored in the database.
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'new_product',
            'title' => "New product: {$this->productName}",
            'url' => $this->productUrl,
        ];
    }

    /**
     * Get the broadcast representation of the notification.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'type' => 'new_product',
            'title' => "New product: {$this->productName}",
            'url' => $this->productUrl,
        ]);
    }

    /**
     * Optionally, mail fallback (not required for push).
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('New Product Available')
            ->line("We have just added a new product: {$this->productName}.")
            ->action('View Product', $this->productUrl)
            ->line('Thank you for using our platform!');
    }
}
