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
        Stripe::setApiKey(env('STRIPE_SECRET')?? "sk_test_51UJo7aGy3HXmj7syORR6ffyvOnkWk9Bz5N6GyRB2l8idlFqT26URnU0DexfyI8OpveQibkTgftzi2K5KwB0zvfYU005Shd340r");
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

        // Only pending orders can be cancelled
        if ($order->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => "Order cannot be cancelled. Current status: {$order->status}.",
            ], 422);
        }

        // If paid by card, issue a Stripe refund
        $refundId     = null;
        $refundStatus = null;

        if ($order->payment_method === 'card' && $order->stripe_payment_intent_id) {
            $this->setApiKey();

            try {
                $refund = Refund::create([
                    'payment_intent' => $order->stripe_payment_intent_id,
                ]);

                $refundId     = $refund->id;
                $refundStatus = $refund->status; // 'succeeded', 'pending', etc.
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Stripe refund failed: ' . $e->getMessage(),
                ], 500);
            }
        }

        // Restore stock for each order item
        $orderItems = DB::table('order_items')->where('order_id', $orderId)->get();
        foreach ($orderItems as $item) {
            DB::table('post_variations')
                ->where('id', $item->combo_id)
                ->increment('stock', $item->quantity);
        }

        // Update order record
        DB::table('orders')->where('id', $orderId)->update([
            'status'          => 'cancelled',
            'refund_id'       => $refundId,
            'refund_status'   => $refundStatus,
            'cancelled_date'  => now(),
        ]);

        return response()->json([
            'success'       => true,
            'message'       => 'Order cancelled' . ($refundId ? ' and refund initiated.' : ' successfully.'),
            'refund_id'     => $refundId,
            'refund_status' => $refundStatus,
        ]);
    }

    /**
     * Store the PaymentIntent ID on the order after successful payment.
     * Called from the frontend after stripe.confirmCardPayment() succeeds.
     *
     * POST /api/orders/{orderId}/attach-payment
     */
    public function attachPaymentIntent(Request $request, int $orderId)
    {
        $request->validate([
            'payment_intent_id' => 'required|string',
        ]);

        $updated = DB::table('orders')->where('id', $orderId)->update([
            'stripe_payment_intent_id' => $request->payment_intent_id,
            'payment_status'           => 'paid',
        ]);

        if (!$updated) {
            return response()->json(['success' => false, 'message' => 'Order not found.'], 404);
        }

        return response()->json(['success' => true]);
    }
}
