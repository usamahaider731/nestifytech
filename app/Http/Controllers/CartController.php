<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\File;
use App\Mail\OrderConfirmationMail;
use Stripe\Stripe;
use Stripe\PaymentIntent;

class CartController extends Controller
{
    /**
     * Resolve the live price for an item from the database.
     * Priority: variation price → product sale_price → product price.
     * Returns null if the product/variation cannot be found.
     */
    private function resolveServerPrice(array $item): ?float
    {
        // Load the product with all meta/variation data so the rule accessor works
        $products = get_posts($this->productQuery([
            'limit' => 1,
            'id'    => $item['productId'],
        ]));

        $product = $products[0] ?? null;

        // ── 1. Variation combo price + the same product tax/discount rules ────
        if (!empty($item['colorId'])) {
            $variation = DB::table('post_variations')->where('id', $item['comboId'])->first();
            if ($variation) {
                $comboPrice = variation_selling_price($variation);
                if ($comboPrice > 0) {
                    if ($product) {
                        $priced = $product->applyPricingRules($comboPrice);
                        if ($priced !== null && $priced > 0) {
                            return (float) $priced;
                        }
                    }

                    return $comboPrice;
                }
            }
        }

        // ── 2. Apply promotion & tax rules via model accessor ────────────────
        if ($product) {
            $priceAfterRule = $product->real_price_after_rule;
            if ($priceAfterRule !== null && $priceAfterRule > 0) {
                return (float) $priceAfterRule;
            }
        }

        // ── 3. Fallback: raw meta prices (no active rules matched) ────────────
        $metas = DB::table('post_meta')
            ->where('post_id', $item['productId'])
            ->whereIn('key', ['second_price', 'first_price', 'sale_price', 'price'])
            ->pluck('value', 'key');

        $cleanPrice = function ($val) {
            if ($val === null || $val === '') return null;
            $num = (float) str_replace([',', ' '], '', (string) $val);
            return $num > 0 ? $num : null;
        };

        $secondPrice  = $cleanPrice($metas['second_price'] ?? null);
        $firstPrice   = $cleanPrice($metas['first_price']  ?? null);
        $salePrice    = $cleanPrice($metas['sale_price']   ?? null);
        $regularPrice = $cleanPrice($metas['price']        ?? null);

        if ($secondPrice !== null && $firstPrice !== null && $firstPrice > $secondPrice && $secondPrice > 0) {
            return $secondPrice;
        }
        if ($secondPrice !== null && $secondPrice > 0) {
            return $secondPrice;
        }
        if ($firstPrice !== null) {
            return $firstPrice;
        }
        if ($salePrice !== null) {
            return $salePrice;
        }
        if ($regularPrice !== null) {
            return $regularPrice;
        }

        return null;
    }

    /**
     * Calculate server-side flat shipping amount from settings.
     */
    private function resolveShippingAmount(float $itemsTotal): float
    {
        if ($itemsTotal <= 0) {
            return 0.0;
        }

        $settingFile = storage_path('app/data/setting.json');
        if (file_exists($settingFile)) {
            $settings = json_decode(file_get_contents($settingFile), true) ?: [];
            $flat = $settings['shipping']['flat_rate']['value'] ?? null;
            if ($flat !== null) {
                return (float) $flat;
            }
        }

        // Default flat rate — matches the frontend constant
        return 250.0;
    }

    /**
     * Initialise the Stripe SDK from settings or env.
     */
    private function setStripeKey(): void
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
     * Place an order from the Redux cart payload.
     *
     * SECURITY HARDENING:
     *  - Prices are looked up from the DB; the client-supplied price is IGNORED.
     *  - Shipping is calculated server-side; client value is ignored.
     *  - For card payments the PaymentIntent is verified with Stripe before
     *    the order is marked paid (prevents free-order fraud).
     *  - 500 errors return a generic message; full details are logged server-side only.
     *
     * Expected JSON body:
     * {
     *   "items": [
     *     {
     *       "comboId":    3,
     *       "productId":  12,
     *       "colorId":    2,
     *       "color":      "Red",
     *       "attributes": [{"key":"Size","value":"XL"}],
     *       "qty":        2
     *     },
     *     ...
     *   ],
     *   "payment_method":   "cod|card|paypal|payoneer",
     *   "payment_intent_id": "pi_xxx",   // only for card
     *   "first_name": "...",
     *   "last_name":  "...",
     *   "email":      "...",
     *   "phone":      "...",
     *   "address":    "...",
     *   "city":       "...",
     *   "postal_code": "..."
     * }
     */
    public function placeOrder(Request $request)
    {
        $request->validate([
            'items'             => 'required|array|min:1',
            'items.*.comboId'   => 'required|integer',
            'items.*.productId' => 'required|integer',
            'items.*.colorId'   => 'nullable|integer',
            'items.*.qty'       => 'required|integer|min:1|max:999',
            // 'items.*.price' intentionally NOT validated — we look it up from the DB
            'payment_method'    => 'required|string|in:cod,card,paypal,payoneer',
            'payment_intent_id' => 'nullable|string|regex:/^pi_[A-Za-z0-9]+$/',
            'delivery_lat'      => 'nullable|numeric|between:-90,90',
            'delivery_lng'      => 'nullable|numeric|between:-180,180',
            'city_id'           => 'nullable|integer',
            'state_id'          => 'nullable|integer',
        ]);

        $items = $request->input('items');

        // ── Check if user account is blocked ──────────────────────────────────
        $currentUserId = Auth::id();
        if ($currentUserId) {
            $currentUser = DB::table('users')->where('id', $currentUserId)->first();
            if ($currentUser && !empty($currentUser->is_blocked)) {
                return response()->json([
                    'success' => false,
                    'message' => __("Your account has been suspended due to policy violations (multiple returns). You cannot place orders."),
                ], 403);
            }
        }

        // ── Prevent seller from buying their own product ──────────────────────
        if ($currentUserId) {
            $productIds = array_unique(array_filter(array_column($items, 'productId')));
            $ownedProduct = DB::table('posts')
                ->whereIn('id', $productIds)
                ->where('user_id', $currentUserId)
                ->first();

            if ($ownedProduct) {
                return response()->json([
                    'success' => false,
                    'message' => __("You cannot purchase your own product: \":title\".", ['title' => $ownedProduct->title]),
                ], 403);
            }
        }

        DB::beginTransaction();
        try {
            // ── 1. Resolve server-side prices & verify stock ─────────────────
            $resolvedItems = [];

            foreach ($items as $item) {
                // Resolve real price from DB — never trust the client
                $serverPrice = $this->resolveServerPrice($item);

                if ($serverPrice === null) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => "Product #{$item['productId']} could not be found or has no price set.",
                    ], 422);
                }

                // Stock check
                if (!empty($item['colorId'])) {
                    $variation = DB::table('post_variations')
                        ->where('id', $item['comboId'])
                        ->lockForUpdate()
                        ->first();

                    if (!$variation) {
                        DB::rollBack();
                        return response()->json([
                            'success' => false,
                            'message' => "Variation #{$item['comboId']} not found.",
                        ], 422);
                    }

                    if ((int) $variation->stock < (int) $item['qty']) {
                        DB::rollBack();
                        return response()->json([
                            'success' => false,
                            'message' => "Not enough stock for variation #{$item['comboId']}. Available: {$variation->stock}.",
                        ], 422);
                    }
                } else {
                    $stockMeta = DB::table('post_meta')
                        ->where('post_id', $item['productId'])
                        ->where('key', 'stock')
                        ->lockForUpdate()
                        ->first();

                    $stock = $stockMeta ? (int) $stockMeta->value : 0;

                    if ($stock < (int) $item['qty']) {
                        DB::rollBack();
                        return response()->json([
                            'success' => false,
                            'message' => "Not enough stock for product #{$item['productId']}. Available: {$stock}.",
                        ], 422);
                    }
                }

                $resolvedItems[] = array_merge($item, ['serverPrice' => $serverPrice]);
            }

            // ── 2. Calculate totals server-side ──────────────────────────────
            $itemsTotal = collect($resolvedItems)->sum(fn($i) => $i['serverPrice'] * (int) $i['qty']);
            $shippingAmount = $this->resolveShippingAmount($itemsTotal);
            $grossTotal = $itemsTotal + $shippingAmount;

            // ── 2b. Gift card verification & deduction ────────────────────────
            $giftCardCode = strtoupper(trim((string) $request->input('gift_card_code', '')));
            $giftCardDiscount = 0;
            $appliedGiftCard = null;

            if (!empty($giftCardCode)) {
                $appliedGiftCard = DB::table('gift_cards')
                    ->where('code', $giftCardCode)
                    ->lockForUpdate()
                    ->first();

                if ($appliedGiftCard && $appliedGiftCard->status === 'active') {
                    $isExpired = $appliedGiftCard->expires_at && now()->gt($appliedGiftCard->expires_at);
                    $isOwnerMismatch = $appliedGiftCard->issued_to_user_id && $currentUserId && $appliedGiftCard->issued_to_user_id != $currentUserId;

                    if (!$isExpired && !$isOwnerMismatch) {
                        $availableBal = (float) $appliedGiftCard->remaining_balance;
                        $giftCardDiscount = min($availableBal, $grossTotal);
                    }
                }
            }

            $total = max(0, $grossTotal - $giftCardDiscount);

            // ── 3. Verify Stripe PaymentIntent before marking order paid ──────
            $paymentMethod   = $request->input('payment_method', 'cod');
            $paymentIntentId = $request->input('payment_intent_id');
            $paymentStatus   = 'unpaid';

            if ($paymentMethod === 'card') {
                if (empty($paymentIntentId)) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'Payment intent ID is required for card payments.',
                    ], 422);
                }

                $this->setStripeKey();

                try {
                    $intent = PaymentIntent::retrieve($paymentIntentId);
                } catch (\Exception $e) {
                    DB::rollBack();
                    Log::warning('Stripe PaymentIntent retrieval failed on order placement', [
                        'payment_intent_id' => $paymentIntentId,
                        'error' => $e->getMessage(),
                    ]);
                    return response()->json([
                        'success' => false,
                        'message' => 'Could not verify payment. Please try again.',
                    ], 422);
                }

                if ($intent->status !== 'succeeded') {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'Payment has not been completed. Please complete payment before placing the order.',
                    ], 402);
                }

                // Verify the charged amount matches our server-calculated total
                $expectedCents = (int) round($total * 100);
                if ($intent->amount !== $expectedCents) {
                    DB::rollBack();
                    Log::warning('Stripe amount mismatch on order placement', [
                        'expected_cents'    => $expectedCents,
                        'intent_cents'      => $intent->amount,
                        'payment_intent_id' => $intent->id,
                        'user_id'           => $currentUserId,
                    ]);
                    return response()->json([
                        'success' => false,
                        'message' => 'Payment amount does not match order total.',
                    ], 422);
                }

                $paymentStatus   = 'paid';
                $paymentIntentId = $intent->id; // use the verified ID from Stripe
            }

            // ── 4. Build customer info ────────────────────────────────────────
            $firstName       = $request->input('first_name', '');
            $lastName        = $request->input('last_name', '');
            $fullName        = trim("{$firstName} {$lastName}") ?: optional(Auth::user())->name;
            $customerPhone   = $request->input('phone', '') ?: (optional(Auth::user())->meta ? optional(Auth::user())->meta->phone : '');
            $shippingAddress = $request->input('address', '');

            // Resolve city / state / country from IDs (taxonomy table)
            $cityId   = $request->input('city_id');
            $stateId  = $request->input('state_id');

            $cityRow  = $cityId  && is_numeric($cityId)  ? DB::table('taxonomies')->where('id', (int) $cityId)->first()  : null;
            $stateRow = $stateId && is_numeric($stateId) ? DB::table('taxonomies')->where('id', (int) $stateId)->first() : null;
            $countryRow = $stateRow && $stateRow->parent_id ? DB::table('taxonomies')->where('id', (int) $stateRow->parent_id)->first() : null;

            $shippingCity    = $cityRow  ? $cityRow->title  : ($request->input('city', ''));
            $shippingState   = $stateRow ? $stateRow->title : '';
            $shippingCountry = $countryRow ? $countryRow->title : '';

            // Fallback: if city was sent as plain text (old flow)
            if (!$cityRow && !empty($request->input('city', ''))) {
                $shippingCity = $request->input('city', '');
            }

            $shippingPostal = $request->input('postal_code', '');
            $deliveryLat    = $request->input('delivery_lat') !== null ? (float) $request->input('delivery_lat') : null;
            $deliveryLng    = $request->input('delivery_lng') !== null ? (float) $request->input('delivery_lng') : null;
            $customerNotes  = [];
            if ($customerPhone)    $customerNotes[] = "Contact Phone: {$customerPhone}";
            if ($shippingPostal)   $customerNotes[] = "Postal Code: {$shippingPostal}";
            if ($shippingState)    $customerNotes[] = "State: {$shippingState}";
            if ($shippingCountry)  $customerNotes[] = "Country: {$shippingCountry}";
            if ($shippingAmount > 0) $customerNotes[] = "Shipping: {$shippingAmount}";
            if ($giftCardDiscount > 0 && $appliedGiftCard) {
                $customerNotes[] = "Gift Card Used: {$appliedGiftCard->code} (-PKR {$giftCardDiscount})";
            }
            if ($deliveryLat && $deliveryLng) {
                $customerNotes[] = "Delivery GPS: {$deliveryLat},{$deliveryLng}";
            }
            $notesString = !empty($customerNotes) ? implode(' | ', $customerNotes) : null;

            // ── 5. Insert order ───────────────────────────────────────────────
            $userId  = Auth::id();
            $orderId = DB::table('orders')->insertGetId([
                'product_id'               => $resolvedItems[0]['productId'],
                'user_id'                  => $userId,
                'quantity'                 => collect($resolvedItems)->sum('qty'),
                'price'                    => $resolvedItems[0]['serverPrice'],
                'total_price'              => $total,
                'status'                   => 'pending',
                'shipping_address'         => $shippingAddress,
                'shipping_city'            => $shippingCity,
                'shipping_state'           => $shippingState,
                'shipping_country'         => $shippingCountry,
                'delivery_lat'             => $deliveryLat,
                'delivery_lng'             => $deliveryLng,
                'customer_notes'           => $notesString,
                'payment_method'           => $paymentMethod,
                'payment_status'           => $paymentStatus,
                'stripe_payment_intent_id' => $paymentIntentId,
                'order_date'               => now(),
                'completed_date'           => null,
            ]);

            // ── 6. Insert order_items and decrement stock ─────────────────────
            foreach ($resolvedItems as $item) {
                DB::table('order_items')->insert([
                    'order_id'    => $orderId,
                    'product_id'  => $item['productId'],
                    'variation_id' => $item['colorId'] ?? null,
                    'combo_id'    => $item['comboId'],
                    'color'       => $item['color'] ?? null,
                    'attributes'  => json_encode($item['attributes'] ?? []),
                    'quantity'    => $item['qty'],
                    'unit_price'  => $item['serverPrice'],
                    'subtotal'    => $item['serverPrice'] * $item['qty'],
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);

                if (!empty($item['colorId'])) {
                    DB::table('post_variations')
                        ->where('id', $item['comboId'])
                        ->decrement('stock', $item['qty']);
                } else {
                    $stockMeta = DB::table('post_meta')
                        ->where('post_id', $item['productId'])
                        ->where('key', 'stock')
                        ->first();

                    if ($stockMeta) {
                        $newStock = max(0, (int) $stockMeta->value - $item['qty']);
                        DB::table('post_meta')
                            ->where('post_id', $item['productId'])
                            ->where('key', 'stock')
                            ->update(['value' => (string) $newStock]);
                    }
                }
            }

            // ── 7. Deduct Gift Card balance & record usage ────────────────────
            if ($appliedGiftCard && $giftCardDiscount > 0) {
                $newRemaining = max(0, (float) $appliedGiftCard->remaining_balance - $giftCardDiscount);
                $newStatus = $newRemaining <= 0 ? 'exhausted' : $appliedGiftCard->status;

                DB::table('gift_cards')->where('id', $appliedGiftCard->id)->update([
                    'remaining_balance' => $newRemaining,
                    'status'            => $newStatus,
                    'updated_at'        => now(),
                ]);

                DB::table('gift_card_usages')->insert([
                    'gift_card_id' => $appliedGiftCard->id,
                    'order_id'     => $orderId,
                    'user_id'      => $userId,
                    'amount_used'  => $giftCardDiscount,
                    'created_at'   => now(),
                ]);
            }

            DB::commit();

            if ($userId) {
                record_user_activity('order_placed', [
                    'title'    => 'Placed an order',
                    'category' => 'order',
                    'detail'   => 'Placed order #' . $orderId,
                    'order_id' => $orderId,
                    'total'    => $total,
                ], (int) $userId);
            }

            // ── 8. Dispatch Order Confirmation Email ──────────────────────────
            try {
                $settingFile = storage_path('app/data/setting.json');
                $settings    = File::exists($settingFile) ? json_decode(File::get($settingFile), true) : [];
                $mailEnabled = filter_var($settings['mail']['mail_enabled']['value'] ?? true, FILTER_VALIDATE_BOOLEAN);

                if ($mailEnabled) {
                    $orderRecord = DB::table('orders')->where('id', $orderId)->first();
                    $customerUser = $userId ? DB::table('users')->where('id', $userId)->first() : null;
                    $recipientEmail = $customerUser->email ?? $request->input('email') ?? $request->input('customer_email');

                    // Purge stale mailer connection instance
                    app()->forgetInstance('mailer');
                    Mail::clearResolvedInstances();

                    // Send confirmation receipt to customer
                    if (!empty($recipientEmail)) {
                        Mail::mailer('smtp')->to($recipientEmail)->send(
                            new OrderConfirmationMail($orderRecord, $resolvedItems, 'customer')
                        );
                    }

                    // Also send new order alert to store admin/owner
                    $adminEmail = $settings['mail']['contact_recipient_email']['value']
                        ?? $settings['mail']['mail_from_address']['value']
                        ?? 'info.nestifytech@gmail.com';

                    if (!empty($adminEmail) && $adminEmail !== $recipientEmail) {
                        Mail::mailer('smtp')->to($adminEmail)->send(
                            new OrderConfirmationMail($orderRecord, $resolvedItems, 'admin')
                        );
                    }
                }
            } catch (\Throwable $mailErr) {
                Log::error("Failed to send order confirmation email for order #{$orderId}: " . $mailErr->getMessage());
            }

            return response()->json([
                'success'  => true,
                'message'  => 'Order placed successfully.',
                'order_id' => $orderId,
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            report($e);
            // Generic message — full details are in the Laravel log, not exposed to client
            return response()->json([
                'success' => false,
                'message' => 'Failed to place order. Please try again.',
            ], 500);
        }
    }

    /**
     * Check current live stock for a list of combo IDs.
     * Used by the frontend to refresh stock after it has been stale.
     *
     * GET /api/cart/stock?ids=1,2,3
     */
    public function checkStock(Request $request)
    {
        $ids = array_filter(explode(',', $request->query('ids', '')));

        if (empty($ids)) {
            return response()->json([]);
        }

        $rows = DB::table('post_variations')
            ->whereIn('id', $ids)
            ->select('id', 'stock')
            ->get()
            ->keyBy('id');

        return response()->json($rows);
    }
    private function productQuery(array $extra = []): array
    {
        return array_merge([
            'type' => 'product',
            'image' => true,
            'meta' => true,
            'category' => true,
            'brand' => true,
            'tags' => true,
            'gallery' => true,
            'parent' => true,
            'variation' => true,
            'address' => true,
        ], $extra);
    }
    /**
     * Return live server-side prices for a list of cart items.
     * The frontend calls this on checkout mount to detect stale localStorage prices.
     *
     * POST /api/cart/prices
     * Body: { "items": [{ "comboId": 3, "productId": 12, "colorId": 2 }, ...] }
     * Response: { "3": 49.99, "5": 129.00 }  (keyed by comboId)
     */
    public function checkPrices(Request $request)
    {
        $validated = $request->validate([
            'items'             => 'required|array|min:1|max:100',
            'items.*.comboId'   => 'required|integer',
            'items.*.productId' => 'required|integer',
            'items.*.colorId'   => 'nullable|integer',
        ]);
        $items = $request->items;


        $result = [];

        foreach ($request->input('items') as $item) {

            $price = $this->resolveServerPrice($item);
            $result[(string) $item['comboId']] = $price;
        }

        return response()->json($result);
    }
}
