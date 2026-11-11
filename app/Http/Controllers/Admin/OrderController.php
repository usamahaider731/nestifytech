<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Mail\OfficeSettlementOtpMail;
use App\Mail\DeliveryOtpMail;
use App\Services\WalletService;
use Stripe\Stripe;
use Stripe\Refund;

class OrderController extends Controller
{
    /**
     * Display a listing of orders with filters, search, and statistics.
     */
    public function index(Request $request)
    {
        $status      = $request->input('status', 'all');
        $search      = $request->input('search');
        $storeFilter = $request->input('store'); // e.g. store ID
        $currentUser = $request->user();

        // ── Store Manager Scoping ──────────────────────────────────────────
        // Check if the logged-in user is restricted to a specific store
        $assignedStoreId = null;
        if ($currentUser) {
            $userMetaStore = DB::table('user_meta')
                ->where('user_id', $currentUser->id)
                ->whereIn('key', ['store_id', 'assigned_store', 'store'])
                ->value('value');
            if (!empty($userMetaStore)) {
                $assignedStoreId = $userMetaStore;
            }
        }

        // Active store scope: assigned store takes precedence, then explicit filter
        $activeStoreId = $assignedStoreId ?: ($storeFilter && $storeFilter !== 'all' ? $storeFilter : null);

        // Fetch all published stores for dropdown
        $allStores = DB::table('posts')
            ->where('type', 'store')
            ->where('status', 'publish')
            ->select('id', 'title')
            ->orderBy('title')
            ->get();

        // Helper to get order IDs matching a store
        $storeOrderIds = null;
        if (!empty($activeStoreId)) {
            // Find products assigned to this store via post_meta
            $storeProductIds = DB::table('post_meta')
                ->where('key', 'store')
                ->where('value', $activeStoreId)
                ->pluck('post_id')
                ->toArray();

            // Find order IDs that contain any of these products
            $storeOrderIds = DB::table('order_items')
                ->whereIn('product_id', $storeProductIds)
                ->pluck('order_id')
                ->unique()
                ->toArray();
        }

        $query = DB::table('orders')
            ->leftJoin('users as customer', 'orders.user_id', '=', 'customer.id')
            ->leftJoin('users as rider', 'orders.delivery_boy_id', '=', 'rider.id')
            ->select([
                'orders.*',
                'customer.name as customer_name',
                'customer.email as customer_email',
                'rider.name as delivery_boy_name',
                'rider.email as delivery_boy_email',
            ])
            ->orderByDesc('orders.id');

        if (!empty($activeStoreId)) {
            $query->whereIn('orders.id', $storeOrderIds ?: [0]);
        }

        if ($status !== 'all' && !empty($status)) {
            $query->where('orders.status', $status);
        }

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('orders.id', 'like', "%{$search}%")
                    ->orWhere('customer.name', 'like', "%{$search}%")
                    ->orWhere('customer.email', 'like', "%{$search}%")
                    ->orWhere('rider.name', 'like', "%{$search}%")
                    ->orWhere('orders.tracking_number', 'like', "%{$search}%")
                    ->orWhere('orders.payment_method', 'like', "%{$search}%");
            });
        }

        $orders = $query->paginate(15)->withQueryString();

        // Attach items and primary image for each order
        $orderIds = collect($orders->items())->pluck('id');
        $items = DB::table('order_items')
            ->whereIn('order_id', $orderIds)
            ->get();

        $productIds = $items->pluck('product_id')->unique();
        $products = DB::table('posts')
            ->whereIn('id', $productIds)
            ->select('id', 'title', 'sku')
            ->get()
            ->keyBy('id');

        $media = DB::table('media')
            ->whereIn('parent_id', $productIds)
            ->where('type', 'post')
            ->get()
            ->keyBy('parent_id');

        $groupedItems = $items->groupBy('order_id')->map(function ($orderItems) use ($products, $media) {
            return $orderItems->map(function ($item) use ($products, $media) {
                $product = $products->get($item->product_id);
                $img = $media->get($item->product_id);
                return [
                    'id'            => $item->id,
                    'product_id'    => $item->product_id,
                    'product_title' => $product ? $product->title : 'Product #' . $item->product_id,
                    'product_sku'   => $product ? $product->sku : '',
                    'image'         => $img && $img->filename ? asset('storage/uploads/image/' . $img->filename) : null,
                    'quantity'      => (int) $item->quantity,
                    'unit_price'    => (float) $item->unit_price,
                    'subtotal'      => (float) $item->subtotal,
                    'color'         => $item->color,
                    'attributes'    => is_string($item->attributes) ? json_decode($item->attributes, true) : $item->attributes,
                ];
            });
        });

        // Collect all product IDs in these orders to find their assigned stores
        $storeByProductId = DB::table('post_meta')
            ->whereIn('post_id', $productIds)
            ->whereIn('key', ['store', 'store_id'])
            ->pluck('value', 'post_id')
            ->toArray();

        // Map orderId -> primary store_id
        $storeByOrderId = [];
        foreach ($items as $item) {
            if (!isset($storeByOrderId[$item->order_id]) && isset($storeByProductId[$item->product_id])) {
                $storeByOrderId[$item->order_id] = (string) $storeByProductId[$item->product_id];
            }
        }

        // Read selected delivery role from site settings or find Delivery Boy role
        $selectedRoleId = null;
        $settingFile = storage_path('app/data/setting.json');
        if (file_exists($settingFile)) {
            $settingsData = json_decode(file_get_contents($settingFile), true) ?: [];
            $selectedRoleId = $settingsData['site']['delivery_role']['value'] ?? null;
        }

        if (empty($selectedRoleId)) {
            $deliveryBoyRole = DB::table('roles')
                ->where(function ($q) {
                    $q->where('title', 'like', '%delivery%')
                        ->orWhere('title', 'like', '%rider%');
                })
                ->first();
            $selectedRoleId = $deliveryBoyRole ? (string) $deliveryBoyRole->id : null;
        } else {
            $selectedRoleId = (string) $selectedRoleId;
        }

        // Fetch only users who have the selected delivery role assigned
        $usersQuery = DB::table('users')->select('id', 'name', 'email', 'roles', 'last_seen_at')->orderBy('name');
        if (!empty($selectedRoleId)) {
            $usersList = $usersQuery->where(function ($q) use ($selectedRoleId) {
                $q->where('roles', 'like', "%\"{$selectedRoleId}\"%")
                    ->orWhere('roles', 'like', "%[{$selectedRoleId}]%")
                    ->orWhere('roles', 'like', "%{$selectedRoleId}%");
            })->get();
        } else {
            $usersList = $usersQuery->get();
        }

        // Attach assigned store_id and store title to each delivery boy
        $deliveryBoyIds = $usersList->pluck('id')->toArray();
        $riderStores = DB::table('user_meta')
            ->whereIn('user_id', $deliveryBoyIds)
            ->whereIn('key', ['store_id', 'assigned_store', 'store'])
            ->pluck('value', 'user_id')
            ->toArray();

        $storesMap = $allStores->pluck('title', 'id')->toArray();

        $usersList = $usersList->map(function ($u) use ($riderStores, $storesMap) {
            $sId = $riderStores[$u->id] ?? null;
            $u->store_id = $sId ? (string) $sId : null;
            $u->store_title = $sId && isset($storesMap[$sId]) ? $storesMap[$sId] : null;
            return $u;
        });

        $transformed = collect($orders->items())->map(function ($ord) use ($groupedItems, $storeByOrderId, $storesMap) {
            $ordItems = $groupedItems->get($ord->id) ?? collect([]);
            $orderStoreId = $storeByOrderId[$ord->id] ?? null;
            return [
                'id'                         => $ord->id,
                'order_number'               => 'ORD-' . str_pad($ord->id, 5, '0', STR_PAD_LEFT),
                'user_id'                    => $ord->user_id,
                'store_id'                   => $orderStoreId,
                'store_title'                => $orderStoreId && isset($storesMap[$orderStoreId]) ? $storesMap[$orderStoreId] : null,
                'customer_name'              => $ord->customer_name ?? 'Guest',
                'customer_email'             => $ord->customer_email ?? '—',
                'delivery_boy_id'            => $ord->delivery_boy_id,
                'delivery_boy_name'          => $ord->delivery_boy_name,
                'quantity'                   => (int) $ord->quantity,
                'total_price'                => (float) $ord->total_price,
                'cancellation_deduction'     => (float) ($ord->cancellation_deduction ?? 0),
                'refund_amount'              => (float) ($ord->refund_amount ?? 0),
                'status'                     => $ord->status ?? 'pending',
                'payment_method'             => ucfirst($ord->payment_method ?? 'cod'),
                'payment_status'             => ucfirst($ord->payment_status ?? 'unpaid'),
                'tracking_number'            => $ord->tracking_number,
                'shipping_carrier'           => $ord->shipping_carrier,
                'shipping_address'           => $ord->shipping_address,
                'shipping_city'              => $ord->shipping_city,
                'shipping_state'             => $ord->shipping_state,
                'shipping_country'           => $ord->shipping_country,
                'customer_notes'             => $ord->customer_notes,
                'admin_notes'                => $ord->admin_notes,
                'delivery_otp'               => $ord->delivery_otp,
                'delivery_otp_verified_at'   => $ord->delivery_otp_verified_at ? Carbon::parse($ord->delivery_otp_verified_at)->format('M d, Y h:i A') : null,
                'cod_collected_amount'       => (float) ($ord->cod_collected_amount ?? 0),
                'cod_collected_at'           => $ord->cod_collected_at ? Carbon::parse($ord->cod_collected_at)->format('M d, Y h:i A') : null,
                'office_settlement_status'   => $ord->office_settlement_status ?? 'unsettled',
                'office_settlement_at'       => $ord->office_settlement_at ? Carbon::parse($ord->office_settlement_at)->format('M d, Y h:i A') : null,
                'order_date'                 => $ord->order_date ? Carbon::parse($ord->order_date)->format('M d, Y h:i A') : ($ord->created_at ? Carbon::parse($ord->created_at)->format('M d, Y h:i A') : 'N/A'),
                'completed_date'             => $ord->completed_date ? Carbon::parse($ord->completed_date)->format('M d, Y h:i A') : null,
                'shipped_date'               => $ord->shipped_date ? Carbon::parse($ord->shipped_date)->format('M d, Y h:i A') : null,
                'cancelled_date'             => $ord->cancelled_date ? Carbon::parse($ord->cancelled_date)->format('M d, Y h:i A') : null,
                'items_count'                => $ordItems->count(),
                'items'                      => $ordItems,
            ];
        });

        // Statistics scoped to the active store (if applicable)
        $statsBaseQuery = DB::table('orders');
        if (!empty($activeStoreId)) {
            $statsBaseQuery->whereIn('id', $storeOrderIds ?: [0]);
        }

        $totalOrders       = (clone $statsBaseQuery)->count();
        $pendingOrders     = (clone $statsBaseQuery)->where('status', 'pending')->count();
        $processingOrders  = (clone $statsBaseQuery)->where('status', 'processing')->count();
        $shippedOrders     = (clone $statsBaseQuery)->where('status', 'shipped')->count();
        $deliveredOrders   = (clone $statsBaseQuery)->where('status', 'delivered')->count();
        $completedOrders   = (clone $statsBaseQuery)->where('status', 'completed')->count();
        $cancelledOrders   = (clone $statsBaseQuery)->where('status', 'cancelled')->count();
        $totalRevenue      = (clone $statsBaseQuery)->whereIn('status', ['processing', 'shipped', 'delivered', 'completed'])->sum('total_price');
        $codCollected      = (clone $statsBaseQuery)->where('payment_method', 'cod')->sum('cod_collected_amount');
        $pendingSettlement = (clone $statsBaseQuery)->where('payment_method', 'cod')->where('cod_collected_amount', '>', 0)->where('office_settlement_status', 'unsettled')->sum('cod_collected_amount');
        $riderPerformance = collect($usersList)->map(function ($rider) {
            $riderId = $rider->id;
            $riderOrders = DB::table('orders')->where('delivery_boy_id', $riderId)->get();

            $totalAssigned = $riderOrders->count();
            $deliveredOrders = $riderOrders->whereIn('status', ['delivered', 'completed']);
            $deliveredCount = $deliveredOrders->count();
            $activeCount = $riderOrders->whereIn('status', ['pending', 'processing', 'shipped'])->count();
            $cancelledCount = $riderOrders->where('status', 'cancelled')->count();
            $codCollected = (float) $riderOrders->sum('cod_collected_amount');
            $codSettled = (float) $riderOrders->where('office_settlement_status', 'settled')->sum('cod_collected_amount');
            $codInHand = (float) $riderOrders->where('status', 'completed')
                ->where(function ($o) {
                    return empty($o->office_settlement_status) || $o->office_settlement_status !== 'settled';
                })
                ->sum('cod_collected_amount');
            $deliveryDurations = [];
            foreach ($deliveredOrders as $ord) {
                $start = $ord->shipped_date ? Carbon::parse($ord->shipped_date) : ($ord->order_date ? Carbon::parse($ord->order_date) : ($ord->created_at ? Carbon::parse($ord->created_at) : null));
                $end = $ord->delivery_otp_verified_at ? Carbon::parse($ord->delivery_otp_verified_at) : ($ord->completed_date ? Carbon::parse($ord->completed_date) : null);

                if ($start && $end && $end->greaterThanOrEqualTo($start)) {
                    $deliveryDurations[] = $start->diffInMinutes($end);
                }
            }

            $avgDurationMinutes = count($deliveryDurations) > 0 ? (int) round(array_sum($deliveryDurations) / count($deliveryDurations)) : null;

            // Live location check
            $cachedLoc = \Illuminate\Support\Facades\Cache::get("rider_location_{$riderId}");
            if (!$cachedLoc) {
                $meta = DB::table('user_meta')->where('user_id', $riderId)->where('key', 'rider_live_location')->value('value');
                if ($meta) {
                    $cachedLoc = json_decode($meta, true);
                }
            }

            $lastActive = null;
            if (!empty($rider->last_seen_at)) {
                try {
                    $lastActive = Carbon::parse($rider->last_seen_at)->diffForHumans();
                } catch (\Throwable $e) {
                    $lastActive = null;
                }
            }

            return [
                'id'                   => $rider->id,
                'name'                 => $rider->name,
                'email'                => $rider->email,
                'total_assigned'       => $totalAssigned,
                'delivered_count'      => $deliveredCount,
                'active_count'         => $activeCount,
                'cancelled_count'      => $cancelledCount,
                'completion_rate'      => $totalAssigned > 0 ? round(($deliveredCount / $totalAssigned) * 100, 1) : 0,
                'avg_delivery_minutes' => $avgDurationMinutes,
                'cod_collected'        => $codCollected,
                'cod_settled'          => $codSettled,
                'cod_in_hand'          => $codInHand,
                'live_location'        => $cachedLoc,
                'last_active'          => $lastActive,
            ];
        })->values();

        return Inertia::render('Admin/Orders/Index', [
            'orders' => [
                'data'         => $transformed,
                'current_page' => $orders->currentPage(),
                'last_page'    => $orders->lastPage(),
                'per_page'     => $orders->perPage(),
                'total'        => $orders->total(),
            ],
            'stores'            => $allStores,
            'assignedStoreId'   => $assignedStoreId,
            'deliveryBoys'      => $usersList,
            'riderPerformance'  => $riderPerformance,
            'filters' => [
                'status' => $status,
                'search' => $search,
                'store'  => $activeStoreId,
            ],
            'stats' => [
                'total'              => $totalOrders,
                'pending'            => $pendingOrders,
                'processing'         => $processingOrders,
                'shipped'            => $shippedOrders,
                'delivered'          => $deliveredOrders,
                'completed'          => $completedOrders,
                'cancelled'          => $cancelledOrders,
                'revenue'            => (float) $totalRevenue,
                'cod_collected'      => (float) $codCollected,
                'pending_settlement' => (float) $pendingSettlement,
            ],
        ]);
    }

    /**
     * Auto-generate a high-entropy unique tracking number.
     */
    public function generateTrackingNumber(Request $request)
    {
        $prefix = strtoupper($request->input('prefix', 'NST'));
        do {
            $candidate = $prefix . '-' . date('ym') . '-' . strtoupper(Str::random(6));
        } while (DB::table('orders')->where('tracking_number', $candidate)->exists());

        return response()->json([
            'success' => true,
            'tracking_number' => $candidate,
        ]);
    }

    /**
     * Send Customer OTP for delivery confirmation via WhatsApp or Email.
     * channel: 'whatsapp' (default) | 'email'
     */
    public function sendDeliveryOtp(Request $request, int $id)
    {
        $order = DB::table('orders')->where('id', $id)->first();
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Order not found.'], 404);
        }

        $channel = $request->input('channel', 'whatsapp'); // 'whatsapp' or 'email'

        // Generate 6-digit numeric OTP
        $otp = (string) random_int(100000, 999999);
        $expiresAt = now()->addMinutes(30);

        DB::table('orders')->where('id', $id)->update([
            'delivery_otp'            => $otp,
            'delivery_otp_expires_at' => $expiresAt,
            'updated_at'              => now(),
        ]);

        // Load settings for currency
        $currency = 'PKR';
        $settingFile = storage_path('app/data/setting.json');
        if (file_exists($settingFile)) {
            $settings = json_decode(file_get_contents($settingFile), true) ?: [];
            $currency = $settings['site']['currency']['value'] ?? $currency;
        }

        /* ── EMAIL CHANNEL ── */
        if ($channel === 'email') {
            // Resolve customer email
            $customerEmail = null;
            if ($order->user_id) {
                $user = DB::table('users')->where('id', $order->user_id)->first();
                $customerEmail = $user ? $user->email : null;
            }

            // Try extracting from customer notes as fallback
            if (empty($customerEmail) && !empty($order->customer_notes) && preg_match('/Contact Email:\s*([\w.+@\-]+)/', $order->customer_notes, $matches)) {
                $customerEmail = trim($matches[1]);
            }

            // Allow admin to pass email explicitly
            if (empty($customerEmail)) {
                $customerEmail = $request->input('email');
            }

            if (empty($customerEmail)) {
                return response()->json([
                    'success'     => false,
                    'needs_email' => true,
                    'message'     => 'Customer email not found. Please provide the customer email to send OTP.',
                ], 422);
            }

            $emailSent = false;
            $emailError = null;
            try {
                $settingFile = storage_path('app/data/setting.json');
                if (File::exists($settingFile)) {
                    $settings = json_decode(File::get($settingFile), true);
                    if (!empty($settings['mail']['mail_host']['value'])) {
                        config([
                            'mail.default' => 'smtp',
                            'mail.mailers.smtp.host' => $settings['mail']['mail_host']['value'],
                            'mail.mailers.smtp.port' => (int) ($settings['mail']['mail_port']['value'] ?? 587),
                            'mail.mailers.smtp.username' => $settings['mail']['mail_username']['value'] ?? '',
                            'mail.mailers.smtp.password' => $settings['mail']['mail_password']['value'] ?? '',
                            'mail.mailers.smtp.encryption' => ($settings['mail']['mail_encryption']['value'] ?? 'tls') === 'none' ? null : ($settings['mail']['mail_encryption']['value'] ?? 'tls'),
                            'mail.from.address' => $settings['mail']['mail_from_address']['value'] ?? config('mail.from.address'),
                            'mail.from.name' => $settings['mail']['mail_from_name']['value'] ?? config('mail.from.name'),
                        ]);
                    }
                }
                try {
                    app()->forgetInstance('mailer');
                    Mail::clearResolvedInstances();
                } catch (\Throwable $e) {}

                Mail::mailer('smtp')->to($customerEmail)->send(new DeliveryOtpMail($order, $otp, $currency, 30));
                $emailSent = true;
            } catch (\Throwable $e) {
                $emailError = $e->getMessage();
                Log::error("Failed to send delivery OTP email to {$customerEmail}: " . $emailError);
            }

            return response()->json([
                'success'    => true,
                'channel'    => 'email',
                'api_sent'   => $emailSent,
                'api_error'  => $emailError,
                'message'    => $emailSent
                    ? "Delivery OTP sent to customer's email ({$customerEmail})!"
                    : "Email delivery failed" . ($emailError ? " ({$emailError})" : "") . ". Please check SMTP settings or use WhatsApp.",
            ]);
        }

        /* ── WHATSAPP CHANNEL (default) ── */
        // Get customer phone number from user_meta or notes
        $phone = null;
        if ($order->user_id) {
            $userMeta = DB::table('user_meta')->where('user_id', $order->user_id)->pluck('value', 'key');
            $phone = $userMeta['phone'] ?? null;
        }

        if (empty($phone) && !empty($order->customer_notes) && preg_match('/Contact Phone:\s*([+\d\s\-]+)/', $order->customer_notes, $matches)) {
            $phone = trim($matches[1]);
        }

        if (empty($phone)) {
            $phone = $request->input('phone');
        }

        if (empty($phone)) {
            return response()->json([
                'success'    => false,
                'channel'    => 'whatsapp',
                'needs_phone' => true,
                'message'    => 'Customer phone number not found. Please enter the WhatsApp number to send OTP.',
            ], 422);
        }

        $dispatchResult = $this->dispatchWhatsAppOtpWithDetails($phone, $otp, $order->id, (float) $order->total_price);
        $waSent  = $dispatchResult['success'] ?? false;
        $apiError = $dispatchResult['error'] ?? null;

        return response()->json([
            'success'   => true,
            'channel'   => 'whatsapp',
            'api_sent'  => $waSent,
            'api_error' => $apiError,
            'message'   => $waSent
                ? "Delivery OTP sent to customer's WhatsApp ({$phone})!"
                : "WhatsApp delivery failed" . ($apiError ? " ({$apiError})" : "") . ". Try Email OTP instead.",
        ]);
    }

    /**
     * Confirm delivery with customer OTP (called by Delivery Boy / Admin on delivery device).
     * If COD, automatically records collected cash into delivery boy's balance.
     */
    public function verifyDeliveryOtp(Request $request, int $id)
    {
        $request->validate([
            'otp'             => 'required|string',
            'delivery_boy_id' => 'nullable|integer',
        ]);

        $order = DB::table('orders')->where('id', $id)->first();
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Order not found.'], 404);
        }

        if (empty($order->delivery_otp)) {
            return response()->json(['success' => false, 'message' => 'No delivery OTP generated for this order yet.'], 422);
        }

        if ($order->delivery_otp !== trim($request->otp)) {
            return response()->json(['success' => false, 'message' => 'Invalid OTP code entered.'], 422);
        }

        $now = now();
        $update = [
            'status'                   => 'completed',
            'completed_date'           => $now,
            'delivery_otp_verified_at' => $now,
            'delivery_otp'             => null, // Clear used OTP
            'updated_at'               => $now,
        ];

        if ($request->has('delivery_boy_id') && !empty($request->delivery_boy_id)) {
            $update['delivery_boy_id'] = $request->delivery_boy_id;
        }

        // If Cash On Delivery: credit the cash to the Delivery Boy's record
        if (strtolower($order->payment_method) === 'cod') {
            $update['cod_collected_amount']     = $order->total_price;
            $update['cod_collected_at']         = $now;
            $update['payment_status']           = 'paid';
            $update['office_settlement_status'] = 'unsettled';
        }

        DB::table('orders')->where('id', $id)->update($update);

        return response()->json([
            'success' => true,
            'message' => 'Delivery successfully confirmed and completed! ' .
                (strtolower($order->payment_method) === 'cod' ? "Cash of {$order->total_price} credited to delivery boy balance." : ''),
        ]);
    }

    /**
     * Office Cash Settlement: Generates OTP and sends it directly to the office email from site setting.
     */
    public function generateOfficeSettlementOtp(Request $request, int $id)
    {
        $order = DB::table('orders')->where('id', $id)->first();
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Order not found.'], 404);
        }

        if ($order->office_settlement_status === 'settled') {
            return response()->json(['success' => false, 'message' => 'Order cash has already been settled with the office.'], 422);
        }

        $otp = (string) random_int(100000, 999999);
        DB::table('orders')->where('id', $id)->update([
            'office_settlement_otp' => $otp,
            'updated_at'            => now(),
        ]);

        // Get office email & currency from setting.json
        $officeEmail = null;
        $currency = 'PKR';
        $settingFile = storage_path('app/data/setting.json');
        if (file_exists($settingFile)) {
            $settings = json_decode(file_get_contents($settingFile), true) ?: [];
            $officeEmail = $settings['site']['email']['value'] ?? null;
            $currency = $settings['site']['currency']['value'] ?? $currency;
        }

        if (empty($officeEmail)) {
            $officeEmail = config('mail.from.address', env('MAIL_FROM_ADDRESS', 'info@nestifytech.com'));
        }

        // Get assigned rider name if any
        $riderName = null;
        if (!empty($order->delivery_boy_id)) {
            $rider = DB::table('users')->where('id', $order->delivery_boy_id)->first();
            $riderName = $rider ? $rider->name : null;
        }

        $emailSent = false;
        $emailError = null;
        try {
            Mail::to($officeEmail)->send(new OfficeSettlementOtpMail(
                $order,
                $otp,
                $officeEmail,
                $riderName,
                $currency,
                30
            ));
            $emailSent = true;
        } catch (\Throwable $e) {
            $emailError = $e->getMessage();
            Log::error("Failed to send office settlement OTP to {$officeEmail}: " . $emailError);
        }

        return response()->json([
            'success'        => true,
            'settlement_otp' => $otp,
            'office_email'   => $officeEmail,
            'email_sent'     => $emailSent,
            'message'        => $emailSent
                ? "Office settlement OTP sent directly to office email ({$officeEmail})!"
                : "Office settlement OTP generated. (Email notice: " . ($emailError ? 'SMTP pending' : 'Sent') . ")",
        ]);
    }

    /**
     * Office Cash Settlement: Delivery boy / Office verifies settlement OTP to finalize cash handoff.
     */
    public function settleOfficePayment(Request $request, int $id)
    {
        $request->validate([
            'settlement_otp' => 'required|string',
        ]);

        $order = DB::table('orders')->where('id', $id)->first();
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Order not found.'], 404);
        }

        if (empty($order->office_settlement_otp) || $order->office_settlement_otp !== trim($request->settlement_otp)) {
            return response()->json(['success' => false, 'message' => 'Invalid office settlement OTP code.'], 422);
        }

        DB::table('orders')->where('id', $id)->update([
            'office_settlement_status' => 'settled',
            'office_settlement_at'     => now(),
            'office_settlement_otp'    => null, // Clear used OTP
            'updated_at'               => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Cash of {$order->cod_collected_amount} successfully settled and received by the office!",
        ]);
    }

    /**
     * Update order status and processing details.
     */
    public function updateStatus(Request $request, int $id)
    {
        $request->validate([
            'status'           => 'required|in:pending,processing,shipped,delivered,completed,cancelled',
            'payment_status'   => 'nullable|string|in:paid,unpaid,refunded',
            'tracking_number'  => 'nullable|string|max:100',
            'shipping_carrier' => 'nullable|string|max:100',
            'delivery_boy_id'  => 'nullable|integer',
            'admin_notes'      => 'nullable|string|max:1000',
        ]);

        $order = DB::table('orders')->where('id', $id)->first();
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Order not found.'], 404);
        }

        $update = [
            'status'     => $request->status,
            'updated_at' => now(),
        ];

        if ($request->has('payment_status') && !empty($request->payment_status)) {
            $update['payment_status'] = $request->payment_status;
        }

        if ($request->has('delivery_boy_id')) {
            $update['delivery_boy_id'] = $request->delivery_boy_id;
        }

        if ($request->has('tracking_number')) {
            $update['tracking_number'] = $request->tracking_number;
        }

        if ($request->has('shipping_carrier')) {
            $update['shipping_carrier'] = $request->shipping_carrier;
        }

        if ($request->has('admin_notes')) {
            $update['admin_notes'] = $request->admin_notes;
        }

        if ($request->status === 'completed' && empty($order->completed_date)) {
            $update['completed_date'] = now();
        }

        if ($request->status === 'shipped' && empty($order->shipped_date)) {
            $update['shipped_date'] = now();
        }

        if ($request->status === 'cancelled' && empty($order->cancelled_date)) {
            $update['cancelled_date'] = now();
        }

        DB::table('orders')->where('id', $id)->update($update);

        // ── On cancellation: restore stock + refund ──────────────────────────
        $refundIssued  = false;
        $refundableAmt = 0;

        if ($request->status === 'cancelled' && $order->status !== 'cancelled') {
            // Restore inventory
            WalletService::restoreOrderStock($id);

            $wasPaid     = strtolower($order->payment_status ?? '') === 'paid';
            $isStripe    = strtolower($order->payment_method ?? '') === 'card'
                           && !empty($order->stripe_payment_intent_id);

            if ($wasPaid && !empty($order->user_id)) {
                $refundableAmt = (float) $order->total_price;

                if ($isStripe && $refundableAmt > 0) {
                    // ── Stripe card refund ──────────────────────────────────
                    try {
                        $settings  = json_decode(File::get(storage_path('app/data/setting.json')), true) ?? [];
                        $stripeKey = $settings['payment']['stripe_secret_key']['value'] ?? null;
                        if ($stripeKey) {
                            Stripe::setApiKey($stripeKey);
                            $stripeRefund = Refund::create([
                                'payment_intent' => $order->stripe_payment_intent_id,
                                'amount'         => (int) round($refundableAmt * 100),
                            ]);
                            DB::table('orders')->where('id', $id)->update([
                                'payment_status' => 'refunded',
                                'refund_amount'  => $refundableAmt,
                                'refund_id'      => $stripeRefund->id,
                                'refund_status'  => $stripeRefund->status,
                            ]);
                            $refundIssued = true;
                            Log::info("Stripe refund issued for order #{$id}: {$stripeRefund->id}");
                        }
                    } catch (\Exception $e) {
                        Log::error("Stripe refund failed for order #{$id}: " . $e->getMessage());
                    }
                } elseif (!$isStripe && $refundableAmt > 0) {
                    // ── Wallet credit for non-Stripe paid orders ────────────
                    WalletService::credit(
                        (int) $order->user_id,
                        $refundableAmt,
                        'order_refund',
                        $id,
                        null,
                        "Admin cancelled order #" . str_pad($id, 5, '0', STR_PAD_LEFT) . " — full refund credited to wallet."
                    );
                    DB::table('orders')->where('id', $id)->update([
                        'payment_status' => 'refunded',
                        'refund_amount'  => $refundableAmt,
                        'refund_status'  => 'wallet_credited',
                    ]);
                    $refundIssued = true;
                }
            }
        }

        return response()->json([
            'success'       => true,
            'message'       => "Order #{$id} status updated to " . ucfirst($request->status) . '.',
            'refunded'      => $refundIssued,
            'refund_amount' => $refundableAmt,
        ]);
    }

    /**
     * Delete an order.
     */
    public function destroy(int $id)
    {
        $order = DB::table('orders')->where('id', $id)->first();
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Order not found.'], 404);
        }

        $isActive = !in_array($order->status, ['delivered', 'completed', 'cancelled']);

        // Restore stock for non-delivered/non-cancelled orders
        if ($isActive) {
            WalletService::restoreOrderStock($id);
        }

        // ── Refund if the order was paid and not yet delivered/cancelled ──────
        $deleteRefundIssued = false;
        $deleteRefundAmt    = 0;

        if ($isActive && !empty($order->user_id)) {
            $wasPaid  = strtolower($order->payment_status ?? '') === 'paid';
            $isStripe = strtolower($order->payment_method ?? '') === 'card'
                        && !empty($order->stripe_payment_intent_id);

            if ($wasPaid) {
                $deleteRefundAmt = (float) $order->total_price;

                if ($isStripe && $deleteRefundAmt > 0) {
                    // ── Stripe card refund ──────────────────────────────────
                    try {
                        $settings  = json_decode(File::get(storage_path('app/data/setting.json')), true) ?? [];
                        $stripeKey = $settings['payment']['stripe_secret_key']['value'] ?? null;
                        if ($stripeKey) {
                            Stripe::setApiKey($stripeKey);
                            $stripeRefund = Refund::create([
                                'payment_intent' => $order->stripe_payment_intent_id,
                                'amount'         => (int) round($deleteRefundAmt * 100),
                            ]);
                            // Update payment status before deleting (for audit logs if any)
                            DB::table('orders')->where('id', $id)->update([
                                'payment_status' => 'refunded',
                                'refund_amount'  => $deleteRefundAmt,
                                'refund_id'      => $stripeRefund->id,
                                'refund_status'  => $stripeRefund->status,
                            ]);
                            $deleteRefundIssued = true;
                            Log::info("Stripe refund issued on delete for order #{$id}: {$stripeRefund->id}");
                        }
                    } catch (\Exception $e) {
                        Log::error("Stripe refund failed on delete for order #{$id}: " . $e->getMessage());
                    }
                } elseif (!$isStripe && $deleteRefundAmt > 0) {
                    // ── Wallet credit for non-Stripe paid orders ────────────
                    WalletService::credit(
                        (int) $order->user_id,
                        $deleteRefundAmt,
                        'order_deleted_refund',
                        $id,
                        null,
                        "Order #" . str_pad($id, 5, '0', STR_PAD_LEFT) . " was deleted by admin — full refund credited to wallet."
                    );
                    $deleteRefundIssued = true;
                }
            }
        }

        DB::table('order_items')->where('order_id', $id)->delete();
        DB::table('orders')->where('id', $id)->delete();

        return response()->json([
            'success'       => true,
            'message'       => "Order #{$id} deleted successfully.",
            'refunded'      => $deleteRefundIssued,
            'refund_amount' => $deleteRefundAmt,
        ]);
    }

    /**
     * Helper to send WhatsApp message via Facebook Graph API with full error diagnostics.
     */
    protected function dispatchWhatsAppOtpWithDetails(string $phone, string $otp, int $orderId, float $total): array
    {
        $cleanDigits = preg_replace('/[^\d]/', '', $phone);
        $settingFile = storage_path('app/data/setting.json');
        $waApiKey = null;
        $waEndpoint = null;
        $phoneNumberId = null;

        if (file_exists($settingFile)) {
            $settings = json_decode(file_get_contents($settingFile), true) ?: [];
            $waApiKey = $settings['whatsapp']['api_key']['value'] ?? null;
            $waEndpoint = $settings['whatsapp']['api_endpoint']['value'] ?? null;
            $phoneNumberId = $settings['whatsapp']['phone_number_id']['value'] ?? null;
        }

        if (empty($waApiKey)) {
            $waApiKey = env('FACEBOOK_WHATSAPP_ACCESS_TOKEN') ?: env('WASENDERAPI_API_KEY');
        }

        if (empty($waEndpoint)) {
            $phoneId = $phoneNumberId ?? env('FACEBOOK_WHATSAPP_PHONE_NUMBER_ID', '1396790376847486');
            $waEndpoint = "https://graph.facebook.com/v20.0/{$phoneId}/messages";
        }

        if (empty($waApiKey)) {
            return ['success' => false, 'error' => 'No access token configured.'];
        }

        $currency = $settings['site']['currency']['value'] ?? 'PKR';

        $message = "📦 *NestifyTech Order #{$orderId} Delivery Confirmation*\n\n" .
            "Your delivery verification OTP code is: *{$otp}*\n" .
            "Order Total: *{$currency} {$total}*\n\n" .
            "Please share this OTP with the delivery rider upon inspecting your package to complete the delivery.\n\n" .
            "Thank you for shopping with NestifyTech!";

        try {
            $isFacebookGraph = str_contains($waEndpoint, 'graph.facebook.com');

            if ($isFacebookGraph) {
                $payload = [
                    'messaging_product' => 'whatsapp',
                    'recipient_type'    => 'individual',
                    'to'                => $cleanDigits,
                    'type'              => 'text',
                    'text'              => [
                        'preview_url' => false,
                        'body'        => $message,
                    ],
                ];
            } else {
                $payload = [
                    'to'   => '+' . $cleanDigits,
                    'text' => $message,
                ];
            }

            $response = Http::timeout(10)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $waApiKey,
                    'Content-Type'  => 'application/json',
                ])
                ->post($waEndpoint, $payload);

            if ($response->successful()) {
                return ['success' => true, 'error' => null];
            }

            $resJson = $response->json();
            $errorMsg = $resJson['error']['message'] ?? ($resJson['message'] ?? 'Delivery failed (HTTP ' . $response->status() . ')');
            return ['success' => false, 'error' => $errorMsg];
        } catch (\Throwable $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Backward-compatible boolean helper.
     */
    protected function dispatchWhatsAppOtp(string $phone, string $otp, int $orderId, float $total): bool
    {
        $res = $this->dispatchWhatsAppOtpWithDetails($phone, $otp, $orderId, $total);
        return $res['success'] ?? false;
    }
}
