<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Stripe\Stripe;
use Stripe\PaymentIntent;
use Stripe\Refund;

class StripeController extends Controller
{
    private function setApiKey(): void
    {
        $secret = null;
        $settingFile = storage_path('app/data/setting.json');
        if (file_exists($settingFile)) {
            $settings = json_decode(file_get_contents($settingFile), true) ?: [];
            $secret = $settings['payment']['stripe_secret_key']['value'] 
                ?? $settings['stripe']['stripe_secret_key']['value'] 
                ?? null;
        }

        if (empty($secret)) {
            $secret = env('STRIPE_SECRET');
        }

        if (empty($secret)) {
            throw new \RuntimeException('Stripe secret key is not configured.');
        }

        Stripe::setApiKey($secret);
    }

    /**
     * Create a Stripe PaymentIntent when the user proceeds to pay.
     */
    public function createPaymentIntent(Request $request)
    {
        $request->validate([
            'amount'   => 'required|numeric|min:1',
            'currency' => 'required|string',
        ]);

        $this->setApiKey();
        $amountInCents = (int) ($request->amount * 100);

        try {
            $paymentIntent = PaymentIntent::create([
                'amount'   => $amountInCents,
                'currency' => $request->currency,
            ]);

            return response()->json([
                'clientSecret'      => $paymentIntent->client_secret,
                'paymentIntentId'   => $paymentIntent->id,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Cancel an order. If the order was paid by card (Stripe), issue a refund.
     *
     * POST /api/orders/{orderId}/cancel
     */
    public function cancelOrder(Request $request, int $orderId)
    {
        $order = DB::table('orders')->where('id', $orderId)->first();

        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Order not found.'], 404);
        }
        if ((int) $order->user_id !== (int) \Illuminate\Support\Facades\Auth::id()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }
        if ($order->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => "Order cannot be cancelled. Current status: {$order->status}.",
            ], 422);
        }
        $cancellationFeePercent = 5.0; // default 5%
        $settingFile = storage_path('app/data/setting.json');
        if (file_exists($settingFile)) {
            $settings = json_decode(file_get_contents($settingFile), true) ?: [];
            if (isset($settings['site']['order_cancellation_fee']['value'])) {
                $cancellationFeePercent = (float) $settings['site']['order_cancellation_fee']['value'];
            }
        }

        $totalPrice = (float) $order->total_price;
        $cancellationDeduction = 0.0;
        $refundAmount = 0.0;
        $refundId     = null;
        $refundStatus = null;

        // If the order was already paid, calculate deduction and return remainder
        $isPaid = ($order->payment_status === 'paid' || $order->payment_method === 'card');

        if ($isPaid && $totalPrice > 0) {
            $cancellationDeduction = round(($totalPrice * ($cancellationFeePercent / 100)), 2);
            $refundAmount = max(0, round($totalPrice - $cancellationDeduction, 2));

            // If paid via Stripe card, issue partial refund for the net amount
            if ($order->payment_method === 'card' && $order->stripe_payment_intent_id && $refundAmount > 0) {
                $this->setApiKey();

                try {
                    $refundParams = [
                        'payment_intent' => $order->stripe_payment_intent_id,
                        'amount'         => (int) round($refundAmount * 100), // Stripe expects amount in cents
                    ];

                    $refund = Refund::create($refundParams);

                    $refundId     = $refund->id;
                    $refundStatus = $refund->status; // 'succeeded', 'pending', etc.
                } catch (\Exception $e) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Stripe refund processing failed: ' . $e->getMessage(),
                    ], 500);
                }
            } else {
                $refundStatus = 'processed';
            }
        }

        // Restore stock for each order item
        $orderItems = DB::table('order_items')->where('order_id', $orderId)->get();
        foreach ($orderItems as $item) {
            if (!empty($item->combo_id)) {
                DB::table('post_variations')
                    ->where('id', $item->combo_id)
                    ->increment('stock', $item->quantity);
            } else if (!empty($item->product_id)) {
                $stockMeta = DB::table('post_meta')
                    ->where('post_id', $item->product_id)
                    ->where('key', 'stock')
                    ->first();
                if ($stockMeta) {
                    DB::table('post_meta')
                        ->where('post_id', $item->product_id)
                        ->where('key', 'stock')
                        ->update(['value' => (string) ((int) $stockMeta->value + $item->quantity)]);
                }
            }
        }

        // Update order record with deduction and net refund amount
        DB::table('orders')->where('id', $orderId)->update([
            'status'                      => 'cancelled',
            'cancellation_fee_percentage' => $cancellationFeePercent,
            'cancellation_deduction'      => $cancellationDeduction,
            'refund_amount'               => $refundAmount,
            'refund_id'                   => $refundId,
            'refund_status'               => $refundStatus,
            'cancelled_date'              => now(),
            'updated_at'                  => now(),
        ]);

        if (!empty($order->user_id)) {
            record_user_activity('order_cancelled', [
                'title' => "Cancelled order #{$orderId}",
                'category' => 'order',
                'detail' => $isPaid
                    ? "Order #{$orderId} cancelled. Deducted {$cancellationFeePercent}% (PKR " . number_format($cancellationDeduction, 2) . ") fee. Refunded PKR " . number_format($refundAmount, 2) . " back to account."
                    : "Order #{$orderId} cancelled.",
                'order_id' => $orderId,
            ], (int) $order->user_id);
        }

        $message = 'Order cancelled successfully.';
        if ($isPaid) {
            $message = "Order cancelled. A cancellation fee of {$cancellationFeePercent}% (PKR " . number_format($cancellationDeduction, 2) . ") was deducted. Remaining amount of PKR " . number_format($refundAmount, 2) . " has been refunded back.";
        }

        return response()->json([
            'success'                     => true,
            'message'                     => $message,
            'cancellation_fee_percentage' => $cancellationFeePercent,
            'cancellation_deduction'      => $cancellationDeduction,
            'refund_amount'               => $refundAmount,
            'refund_id'                   => $refundId,
            'refund_status'               => $refundStatus,
        ]);
    }

    /**
     * Store the PaymentIntent ID on the order after successful payment.
     * Called from the frontend after stripe.confirmCardPayment() succeeds.
     *
     * POST /api/orders/{orderId}/attach-payment
     *
     * SECURITY: We never trust the client's claim that payment succeeded.
     * We retrieve the PaymentIntent directly from Stripe and verify:
     *   1. It exists and its status is "succeeded".
     *   2. Its charged amount matches the order total (prevents partial-payment fraud).
     *   3. The authenticated user owns the order (prevents IDOR).
     */
    public function attachPaymentIntent(Request $request, int $orderId)
    {
        $request->validate([
            'payment_intent_id' => 'required|string|regex:/^pi_[A-Za-z0-9]+$/',
        ]);

        // 1. Load order
        $order = DB::table('orders')->where('id', $orderId)->first();

        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Order not found.'], 404);
        }

        // 2. Ownership check — prevent IDOR
        if ((int) $order->user_id !== (int) \Illuminate\Support\Facades\Auth::id()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        // 3. Guard against double-payment (already marked paid)
        if ($order->payment_status === 'paid') {
            return response()->json(['success' => false, 'message' => 'Order is already marked as paid.'], 422);
        }

        // 4. Verify PaymentIntent with Stripe — NEVER trust the client
        $this->setApiKey();

        try {
            $intent = PaymentIntent::retrieve($request->payment_intent_id);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not verify payment with Stripe: ' . $e->getMessage(),
            ], 422);
        }

        // 5. Confirm the intent actually succeeded
        if ($intent->status !== 'succeeded') {
            return response()->json([
                'success' => false,
                'message' => "Payment not completed. Stripe status: {$intent->status}.",
            ], 422);
        }

        // 6. Confirm the charged amount matches the order total (prevents partial-payment fraud)
        //    Stripe stores amounts in the smallest currency unit (e.g. cents/paisa).
        $expectedAmountCents = (int) round((float) $order->total_price * 100);
        if ($intent->amount !== $expectedAmountCents) {
            \Illuminate\Support\Facades\Log::warning('Stripe amount mismatch on order payment attach', [
                'order_id'              => $orderId,
                'order_total_cents'     => $expectedAmountCents,
                'intent_amount_cents'   => $intent->amount,
                'payment_intent_id'     => $intent->id,
                'user_id'               => $order->user_id,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Payment amount does not match order total.',
            ], 422);
        }

        // 7. All checks passed — mark the order paid
        DB::table('orders')->where('id', $orderId)->update([
            'stripe_payment_intent_id' => $intent->id,
            'payment_status'           => 'paid',
            'updated_at'               => now(),
        ]);

        return response()->json(['success' => true]);
    }
}
