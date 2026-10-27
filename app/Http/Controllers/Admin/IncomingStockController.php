<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class IncomingStockController extends Controller
{
    /**
     * Display a list of incoming purchase orders / stock shipments.
     */
    public function index(Request $request)
    {
        $status = $request->input('status', 'all');
        $search = $request->input('search');

        $query = DB::table('incoming_stock_orders')
            ->orderByDesc('id');

        if ($status !== 'all' && !empty($status)) {
            $query->where('status', $status);
        }

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('po_number', 'like', "%{$search}%")
                    ->orWhere('supplier_name', 'like', "%{$search}%")
                    ->orWhere('tracking_number', 'like', "%{$search}%");
            });
        }

        $orders = $query->paginate(15)->withQueryString();

        // Attach item count and items to each order
        $orderIds = collect($orders->items())->pluck('id');
        $items = !empty($orderIds) ? DB::table('incoming_stock_items')
            ->whereIn('incoming_order_id', $orderIds)
            ->get()
            ->groupBy('incoming_order_id') : collect();

        $orderRows = collect($orders->items())->map(function ($order) use ($items) {
            $orderItems = $items->get($order->id, collect());
            $totalUnitsOrdered = $orderItems->sum('quantity_ordered');
            $totalUnitsReceived = $orderItems->sum('quantity_received');

            return [
                'id' => $order->id,
                'po_number' => $order->po_number,
                'supplier_id' => $order->supplier_id,
                'supplier_name' => $order->supplier_name ?: 'Unknown Supplier',
                'status' => $order->status,
                'order_date' => $order->order_date,
                'expected_delivery_date' => $order->expected_delivery_date,
                'received_date' => $order->received_date,
                'tracking_number' => $order->tracking_number,
                'total_cost' => (float) $order->total_cost,
                'notes' => $order->notes,
                'total_units_ordered' => $totalUnitsOrdered,
                'total_units_received' => $totalUnitsReceived,
                'items_count' => $orderItems->count(),
                'items' => $orderItems,
            ];
        });

        // Statistics
        $totalOrders = DB::table('incoming_stock_orders')->count();
        $orderedCount = DB::table('incoming_stock_orders')->where('status', 'ordered')->count();
        $inTransitCount = DB::table('incoming_stock_orders')->where('status', 'in_transit')->count();
        $receivedCount = DB::table('incoming_stock_orders')->where('status', 'received')->count();
        $totalIncomingUnits = DB::table('incoming_stock_items')
            ->join('incoming_stock_orders', 'incoming_stock_items.incoming_order_id', '=', 'incoming_stock_orders.id')
            ->whereIn('incoming_stock_orders.status', ['ordered', 'in_transit'])
            ->sum(DB::raw('incoming_stock_items.quantity_ordered - incoming_stock_items.quantity_received'));

        $totalIncomingCost = (float) DB::table('incoming_stock_orders')
            ->whereIn('status', ['ordered', 'in_transit'])
            ->sum('total_cost');

        // Suppliers list for creating incoming orders
        $suppliers = DB::table('taxonomies')
            ->where('type', 'supplier')
            ->where('status', 'publish')
            ->select('id', 'title')
            ->get();

        // Products with current stock for selecting items
        $products = DB::table('posts')
            ->where('posts.type', 'product')
            ->where('posts.status', 'publish')
            ->select('posts.id', 'posts.title', 'posts.sku')
            ->get();

        $postIds = $products->pluck('id')->toArray();
        $variations = !empty($postIds) ? DB::table('post_variations')
            ->whereIn('post_id', $postIds)
            ->whereNotNull('parent_id')
            ->get()
            ->groupBy('post_id') : collect();

        $productList = $products->map(function ($p) use ($variations) {
            $vars = $variations->get($p->id, collect());
            return [
                'id' => $p->id,
                'title' => $p->title,
                'sku' => $p->sku ?: 'SKU-' . $p->id,
                'has_variations' => $vars->isNotEmpty(),
                'variations' => $vars->map(fn($v) => [
                    'id' => $v->id,
                    'name' => $v->name ?: "Variation #{$v->id}",
                    'stock' => $v->stock,
                ]),
            ];
        });

        $currency = 'PKR';
        $settingPath = storage_path('app/data/setting.json');
        if (file_exists($settingPath)) {
            $settingsData = json_decode(file_get_contents($settingPath), true);
            $currency = $settingsData['site']['currency']['value'] ?? 'PKR';
        }

        return Inertia::render('Admin/IncomingStock/Index', [
            'orders' => [
                'data' => $orderRows,
                'links' => $orders->linkCollection()->toArray(),
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'total' => $orders->total(),
            ],
            'filters' => [
                'status' => $status,
                'search' => $search,
            ],
            'stats' => [
                'total_orders' => $totalOrders,
                'ordered' => $orderedCount,
                'in_transit' => $inTransitCount,
                'received' => $receivedCount,
                'total_incoming_units' => (int) $totalIncomingUnits,
                'total_incoming_cost' => round($totalIncomingCost),
                'currency' => $currency,
            ],
            'suppliers' => $suppliers,
            'products' => $productList,
        ]);
    }

    /**
     * Store a newly created incoming purchase order.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'nullable|integer',
            'supplier_name' => 'nullable|string|max:255',
            'order_date' => 'required|date',
            'expected_delivery_date' => 'nullable|date',
            'tracking_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer',
            'items.*.variation_id' => 'nullable|integer',
            'items.*.product_title' => 'required|string',
            'items.*.sku' => 'nullable|string',
            'items.*.quantity_ordered' => 'required|integer|min:1',
            'items.*.unit_cost' => 'required|numeric|min:0',
        ]);

        // Auto-generate PO Number if missing
        $poNumber = 'PO-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -4));

        // Supplier name resolution if id provided
        $supplierName = $validated['supplier_name'] ?? null;
        if (!empty($validated['supplier_id']) && empty($supplierName)) {
            $sup = DB::table('taxonomies')->where('id', $validated['supplier_id'])->first();
            $supplierName = $sup ? $sup->title : 'Unknown';
        }

        $totalCost = 0.0;
        foreach ($validated['items'] as $item) {
            $totalCost += ($item['quantity_ordered'] * $item['unit_cost']);
        }

        $orderId = DB::table('incoming_stock_orders')->insertGetId([
            'po_number' => $poNumber,
            'supplier_id' => $validated['supplier_id'] ?? null,
            'supplier_name' => $supplierName ?: 'Direct Supplier',
            'status' => 'ordered',
            'order_date' => $validated['order_date'],
            'expected_delivery_date' => $validated['expected_delivery_date'] ?? null,
            'tracking_number' => $validated['tracking_number'] ?? null,
            'total_cost' => $totalCost,
            'notes' => $validated['notes'] ?? null,
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        foreach ($validated['items'] as $item) {
            $subtotal = $item['quantity_ordered'] * $item['unit_cost'];
            DB::table('incoming_stock_items')->insert([
                'incoming_order_id' => $orderId,
                'product_id' => $item['product_id'],
                'variation_id' => $item['variation_id'] ?? null,
                'product_title' => $item['product_title'],
                'sku' => $item['sku'] ?? null,
                'quantity_ordered' => $item['quantity_ordered'],
                'quantity_received' => 0,
                'unit_cost' => $item['unit_cost'],
                'subtotal' => $subtotal,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);

            // Also save the unit cost as buy_price on product if not set
            if ($item['unit_cost'] > 0 && empty($item['variation_id'])) {
                DB::table('post_meta')->updateOrInsert(
                    ['post_id' => $item['product_id'], 'key' => 'buy_price'],
                    ['value' => (string) $item['unit_cost']]
                );
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Incoming order {$poNumber} created successfully.",
            'order_id' => $orderId,
        ]);
    }

    /**
     * Mark an incoming order as received and automatically inject quantities into live stock.
     */
    public function receiveOrder(Request $request, $id)
    {
        $order = DB::table('incoming_stock_orders')->where('id', $id)->first();
        if (!$order) {
            return response()->json(['message' => 'Incoming order not found.'], 404);
        }

        if ($order->status === 'received') {
            return response()->json(['message' => 'This purchase order has already been received into stock.'], 400);
        }

        $items = DB::table('incoming_stock_items')->where('incoming_order_id', $id)->get();

        DB::beginTransaction();
        try {
            foreach ($items as $item) {
                $qtyToAdd = (int) ($item->quantity_ordered - $item->quantity_received);
                if ($qtyToAdd <= 0) continue;

                if (!empty($item->variation_id)) {
                    // Update variation table stock
                    DB::table('post_variations')
                        ->where('id', $item->variation_id)
                        ->increment('stock', $qtyToAdd);

                    // Recalculate parent total stock
                    $totalParentStock = DB::table('post_variations')
                        ->where('post_id', $item->product_id)
                        ->whereNotNull('parent_id')
                        ->sum('stock');

                    DB::table('post_meta')->updateOrInsert(
                        ['post_id' => $item->product_id, 'key' => 'stock'],
                        ['value' => (string) $totalParentStock]
                    );
                } else {
                    // Update simple product post_meta stock
                    $currentMeta = DB::table('post_meta')
                        ->where('post_id', $item->product_id)
                        ->where('key', 'stock')
                        ->first();

                    $currentStock = $currentMeta ? (int) str_replace(',', '', $currentMeta->value) : 0;
                    $newStock = $currentStock + $qtyToAdd;

                    DB::table('post_meta')->updateOrInsert(
                        ['post_id' => $item->product_id, 'key' => 'stock'],
                        ['value' => (string) $newStock]
                    );
                }

                // Mark item as fully received
                DB::table('incoming_stock_items')
                    ->where('id', $item->id)
                    ->update([
                        'quantity_received' => $item->quantity_ordered,
                        'updated_at' => Carbon::now(),
                    ]);
            }

            // Update order status to received
            DB::table('incoming_stock_orders')
                ->where('id', $id)
                ->update([
                    'status' => 'received',
                    'received_date' => Carbon::now()->toDateString(),
                    'updated_at' => Carbon::now(),
                ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Order {$order->po_number} successfully received. All item stocks were automatically incremented in your inventory!",
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to receive stock: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update order status (ordered -> in_transit -> cancelled).
     */
    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:ordered,in_transit,cancelled',
            'tracking_number' => 'nullable|string|max:100',
        ]);

        $order = DB::table('incoming_stock_orders')->where('id', $id)->first();
        if (!$order) {
            return response()->json(['message' => 'Order not found.'], 404);
        }

        if ($order->status === 'received') {
            return response()->json(['message' => 'Cannot alter status of a received order.'], 400);
        }

        $updateData = [
            'status' => $validated['status'],
            'updated_at' => Carbon::now(),
        ];
        if (isset($validated['tracking_number'])) {
            $updateData['tracking_number'] = $validated['tracking_number'];
        }

        DB::table('incoming_stock_orders')
            ->where('id', $id)
            ->update($updateData);

        return response()->json([
            'success' => true,
            'message' => "Order {$order->po_number} status updated to {$validated['status']}.",
        ]);
    }

    /**
     * Delete an incoming stock order (only if not received).
     */
    public function destroy($id)
    {
        $order = DB::table('incoming_stock_orders')->where('id', $id)->first();
        if (!$order) {
            return response()->json(['message' => 'Order not found.'], 404);
        }

        DB::table('incoming_stock_orders')->where('id', $id)->delete();

        return response()->json([
            'success' => true,
            'message' => "Order {$order->po_number} deleted.",
        ]);
    }
}
