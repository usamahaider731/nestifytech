<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class CartController extends Controller
{
    /**
     * Place an order from the Redux cart payload.
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
     *       "price":      49.99,
     *       "qty":        2,
     *       "maxStock":   10
     *     },
     *     ...
     *   ]
     * }
     */
    public function placeOrder(Request $request)
    {
        
        $request->validate([
            'items'                  => 'required|array|min:1',
            'items.*.comboId'        => 'required|integer',
            'items.*.productId'      => 'required|integer',
            'items.*.colorId'        => 'nullable|integer',
            'items.*.qty'            => 'required|integer|min:1',
            'items.*.price'          => 'required|numeric|min:0',
        ]);

        $items = $request->input('items');

        DB::beginTransaction();
        try {
            // 1. Verify stock is available for every combo before touching anything
            foreach ($items as $item) {
                if (!empty($item['colorId'])) {
                    $variation = DB::table('post_variations')->where('id', $item['comboId'])->lockForUpdate()->first();

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
            }

            // 2. Calculate order totals
            $total = collect($items)->sum(fn($i) => $i['price'] * $i['qty']);

            // 3. Create the parent order record
            $paymentMethod = $request->input('payment_method', 'cod');
            $paymentStatus = $paymentMethod === 'card' ? 'paid' : 'unpaid';
            $paymentIntentId = $request->input('payment_intent_id');
            
            // Get user id, checking web guard if default api guard is empty
            $userId = Auth::id() ?? Auth::guard('web')->id() ?? 0;

            $orderId = DB::table('orders')->insertGetId([
                'product_id'     => $items[0]['productId'],   // primary product (first item)
                'user_id'        => $userId,
                'quantity'       => collect($items)->sum('qty'),
                'price'          => $items[0]['price'],
                'total_price'    => $total,
                'status'         => 'pending',
                'payment_method' => $paymentMethod,
                'payment_status' => $paymentStatus,
                'stripe_payment_intent_id' => $paymentIntentId,
                'order_date'     => now(),
                'completed_date' => null,
            ]);

            // 4. Create order_items rows and decrement stock
            foreach ($items as $item) {
                DB::table('order_items')->insert([
                    'order_id'   => $orderId,
                    'product_id' => $item['productId'],
                    'variation_id' => $item['colorId'],
                    'combo_id'   => $item['comboId'],
                    'color'      => $item['color'] ?? null,
                    'attributes' => json_encode($item['attributes'] ?? []),
                    'quantity'   => $item['qty'],
                    'unit_price' => $item['price'],
                    'subtotal'   => $item['price'] * $item['qty'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                if (!empty($item['colorId'])) {
                    // Decrement stock on the child variation (combo)
                    DB::table('post_variations')
                        ->where('id', $item['comboId'])
                        ->decrement('stock', $item['qty']);
                } else {
                    // Decrement stock on the simple product
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

            DB::commit();

            return response()->json([
                'success'  => true,
                'message'  => 'Order placed successfully.',
                'order_id' => $orderId,
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            report($e);
            return response()->json([
                'success' => false,
                'message' => 'Failed to place order: ' . $e->getMessage(),
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
}
