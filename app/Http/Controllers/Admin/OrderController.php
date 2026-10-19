<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Mail\OfficeSettlementOtpMail;

class OrderController extends Controller
{
    /**
     * Display a listing of orders with filters, search, and statistics.
     */
    public function index(Request $request)
    {
        $status = $request->input('status', 'all');
        $search = $request->input('search');

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
        $usersQuery = DB::table('users')->select('id', 'name', 'email', 'roles')->orderBy('name');
        if (!empty($selectedRoleId)) {
            $usersList = $usersQuery->where(function ($q) use ($selectedRoleId) {
                $q->where('roles', 'like', "%\"{$selectedRoleId}\"%")
                  ->orWhere('roles', 'like', "%[{$selectedRoleId}]%")
                  ->orWhere('roles', 'like', "%{$selectedRoleId}%");
            })->get();
        } else {
            $usersList = $usersQuery->get();
        }

        $transformed = collect($orders->items())->map(function ($ord) use ($groupedItems) {
            $ordItems = $groupedItems->get($ord->id) ?? collect([]);
            return [
                'id'                         => $ord->id,
                'order_number'               => 'ORD-' . str_pad($ord->id, 5, '0', STR_PAD_LEFT),
                'user_id'                    => $ord->user_id,
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

        // Statistics across all orders
        $totalOrders      = DB::table('orders')->count();
        $pendingOrders    = DB::table('orders')->where('status', 'pending')->count();
        $processingOrders = DB::table('orders')->where('status', 'processing')->count();
        $shippedOrders    = DB::table('orders')->where('status', 'shipped')->count();
        $deliveredOrders  = DB::table('orders')->where('status', 'delivered')->count();
        $completedOrders  = DB::table('orders')->where('status', 'completed')->count();
        $cancelledOrders  = DB::table('orders')->where('status', 'cancelled')->count();
        $totalRevenue     = DB::table('orders')->whereIn('status', ['processing', 'shipped', 'delivered', 'completed'])->sum('total_price');
        $codCollected     = DB::table('orders')->where('payment_method', 'cod')->sum('cod_collected_amount');
        $pendingSettlement= DB::table('orders')->where('payment_method', 'cod')->where('cod_collected_amount', '>', 0)->where('office_settlement_status', 'unsettled')->sum('cod_collected_amount');

        return Inertia::render('Admin/Orders/Index', [
            'orders' => [
                'data'         => $transformed,
                'current_page' => $orders->currentPage(),
                'last_page'    => $orders->lastPage(),
                'per_page'     => $orders->perPage(),
                'total'        => $orders->total(),
            ],
            'deliveryBoys' => $usersList,
            'filters' => [
                'status' => $status,
                'search' => $search,
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
     * Send Customer WhatsApp OTP for delivery confirmation / completion.
     */
    public function sendDeliveryOtp(Request $request, int $id)
    {
        $order = DB::table('orders')->where('id', $id)->first();
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Order not found.'], 404);
        }

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
            $requestPhone = $request->input('phone');
            if ($requestPhone) {
                $phone = $requestPhone;
            }
        }

        if (empty($phone)) {
            return response()->json([
                'success' => false,
                'needs_phone' => true,
                'message' => 'Customer phone number not found. Please specify customer phone number to send WhatsApp OTP.',
            ], 422);
        }

        // Generate 6-digit numeric OTP
        $otp = (string) random_int(100000, 999999);
        $expiresAt = now()->addMinutes(30);

        DB::table('orders')->where('id', $id)->update([
            'delivery_otp'            => $otp,
            'delivery_otp_expires_at' => $expiresAt,
            'updated_at'              => now(),
        ]);

        // Dispatch via WhatsApp (Facebook Graph API / configured provider)
        $dispatchResult = $this->dispatchWhatsAppOtpWithDetails($phone, $otp, $order->id, (float) $order->total_price);
        $waSent = $dispatchResult['success'] ?? false;
        $apiError = $dispatchResult['error'] ?? null;

        return response()->json([
            'success' => true,
            'message' => $waSent
                ? "Delivery confirmation OTP sent to customer's WhatsApp ({$phone})!"
                : "WhatsApp delivery failed" . ($apiError ? " ({$apiError})" : "") . ". Please check customer WhatsApp or re-send.",
            'api_sent'  => $waSent,
            'api_error' => $apiError,
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

        return response()->json([
            'success' => true,
            'message' => "Order #{$id} status updated to " . ucfirst($request->status) . '.',
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

        DB::table('order_items')->where('order_id', $id)->delete();
        DB::table('orders')->where('id', $id)->delete();

        return response()->json([
            'success' => true,
            'message' => "Order #{$id} deleted successfully.",
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
