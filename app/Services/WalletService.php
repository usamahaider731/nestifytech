<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class WalletService
{
    /**
     * Credit a user's wallet and record the transaction.
     * Uses a DB lock to prevent race conditions.
     *
     * @return array{new_balance: float, transaction_id: int}
     */
    public static function credit(
        int     $userId,
        float   $amount,
        string  $reason    = 'credit',
        ?int    $orderId   = null,
        ?string $reference = null,
        ?string $note      = null
    ): array {
        if ($amount <= 0) {
            return ['new_balance' => (float) DB::table('users')->where('id', $userId)->value('wallet_balance'), 'transaction_id' => 0];
        }

        return DB::transaction(function () use ($userId, $amount, $reason, $orderId, $reference, $note) {
            // Lock the user row so concurrent requests don't race
            $user = DB::table('users')->where('id', $userId)->lockForUpdate()->first();
            if (!$user) {
                throw new \RuntimeException("User #{$userId} not found for wallet credit.");
            }

            $newBalance = round((float) $user->wallet_balance + $amount, 2);

            DB::table('users')->where('id', $userId)->update([
                'wallet_balance' => $newBalance,
                'updated_at'     => now(),
            ]);

            $txId = DB::table('wallet_transactions')->insertGetId([
                'user_id'      => $userId,
                'type'         => 'credit',
                'amount'       => $amount,
                'balance_after'=> $newBalance,
                'reason'       => $reason,
                'order_id'     => $orderId,
                'reference'    => $reference,
                'note'         => $note,
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);

            // Try sending email notification
            try {
                $currency = 'PKR';
                $settingFile = storage_path('app/data/setting.json');
                if (file_exists($settingFile)) {
                    $settings = json_decode(file_get_contents($settingFile), true) ?: [];
                    $currency = $settings['site']['currency']['value'] ?? $currency;
                }

                $userEmail = $user->email ?? null;
                if ($userEmail) {
                    $orderRef = $orderId ? " for Order #" . str_pad($orderId, 5, '0', STR_PAD_LEFT) : '';
                    Mail::raw(
                        "Hi {$user->name},\n\n" .
                        "Great news! Your wallet has been credited with {$currency} " . number_format($amount, 2) . "{$orderRef}.\n\n" .
                        "Reason: " . ucwords(str_replace('_', ' ', $reason)) . "\n" .
                        ($note ? "Note: {$note}\n" : '') .
                        "\nYour new wallet balance is: {$currency} " . number_format($newBalance, 2) . "\n\n" .
                        "You can use this balance on your next purchase.\n\n" .
                        "Thank you for shopping with us!",
                        function ($m) use ($userEmail, $user) {
                            $m->to($userEmail, $user->name)->subject('💰 Wallet Credited — Refund Received');
                        }
                    );
                }
            } catch (\Throwable $e) {
                Log::warning("WalletService: failed to send credit email to user #{$userId}: " . $e->getMessage());
            }

            return ['new_balance' => $newBalance, 'transaction_id' => $txId];
        });
    }

    /**
     * Restore stock for all items of an order.
     * Safe to call multiple times — checks each item type.
     */
    public static function restoreOrderStock(int $orderId): void
    {
        $orderItems = DB::table('order_items')->where('order_id', $orderId)->get();

        foreach ($orderItems as $item) {
            if (!empty($item->combo_id)) {
                // Variation / combo stock
                DB::table('post_variations')
                    ->where('id', $item->combo_id)
                    ->increment('stock', $item->quantity);
            } elseif (!empty($item->product_id)) {
                // Simple product stock in post_meta
                $stockMeta = DB::table('post_meta')
                    ->where('post_id', $item->product_id)
                    ->where('key', 'stock')
                    ->first();

                if ($stockMeta) {
                    DB::table('post_meta')
                        ->where('post_id', $item->product_id)
                        ->where('key', 'stock')
                        ->update(['value' => (string) ((int) $stockMeta->value + (int) $item->quantity)]);
                }
            }
        }
    }
}
