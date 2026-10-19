<?php

namespace App\Http\Controllers\Delivery;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\OfficeSettlementOtpMail;
use Inertia\Inertia;

class DeliveryPortalController extends Controller
{
    /**
     * Display the Delivery Boy portal dashboard and assigned orders.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return redirect()->route('login');
        }

        $userId = $user->id;
        $userRoles = is_array($user->user_role) ? $user->user_role : [];
        $isSuperAdmin = in_array('Administrator', $userRoles, true);

        $statusFilter = $request->input('status', 'active');
        $search = trim((string) $request->input('search', ''));

        // Base query for orders:
        // Delivery Boy only sees orders assigned to them (`delivery_boy_id = $userId`).
        // Administrators can view all orders or test their assigned orders.
        $query = DB::table('orders')
            ->leftJoin('users as customers', 'orders.user_id', '=', 'customers.id')
            ->leftJoin('users as riders', 'orders.delivery_boy_id', '=', 'riders.id')
            ->select([
                'orders.*',
                'customers.name as customer_name',
                'customers.email as customer_email',
                'riders.name as delivery_boy_name',
                'riders.email as delivery_boy_email',
            ]);

        // If not super admin with all_orders switch, scope strictly to this rider
        if (!$isSuperAdmin || $request->has('my_orders_only')) {
            $query->where('orders.delivery_boy_id', $userId);
        } else {
            // If superadmin, by default show orders assigned to them, or if none assigned show all assigned/unassigned with filter
            if ($request->has('delivery_boy_id')) {
                $query->where('orders.delivery_boy_id', $request->input('delivery_boy_id'));
            } else {
                // If this admin has assigned orders, prioritize their assigned orders or show rider's view
                $hasMyAssigned = DB::table('orders')->where('delivery_boy_id', $userId)->exists();
                if ($hasMyAssigned) {
                    $query->where('orders.delivery_boy_id', $userId);
                }
            }
        }

        // Apply Tab Filter
        if ($statusFilter === 'active') {
            $query->whereIn('orders.status', ['pending', 'processing', 'shipped', 'delivered']);
        } elseif ($statusFilter === 'completed') {
            $query->where('orders.status', 'completed');
        } elseif ($statusFilter === 'cancelled') {
            $query->where('orders.status', 'cancelled');
        }

        // Search by ID, tracking number, customer name, phone, or address
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('orders.id', 'like', "%{$search}%")
                    ->orWhere('orders.tracking_number', 'like', "%{$search}%")
                    ->orWhere('customers.name', 'like', "%{$search}%")
                    ->orWhere('orders.shipping_address', 'like', "%{$search}%")
                    ->orWhere('orders.shipping_city', 'like', "%{$search}%")
                    ->orWhere('orders.customer_notes', 'like', "%{$search}%");
            });
        }

        $orders = $query->orderBy('orders.id', 'desc')->paginate(15)->withQueryString();

        // Attach items for these orders
        $orderIds = collect($orders->items())->pluck('id')->toArray();
        $orderItems = DB::table('order_items')
            ->whereIn('order_id', $orderIds)
            ->get();

        $productIds = $orderItems->pluck('product_id')->filter()->unique()->toArray();
        $products = DB::table('posts')->whereIn('id', $productIds)->get()->keyBy('id');
        $productImages = DB::table('media')
            ->whereIn('parent_id', $productIds)
            ->where('type', 'product')
            ->get()
            ->keyBy('parent_id');

        $groupedItems = $orderItems->groupBy('order_id')->map(function ($items) use ($products, $productImages) {
            return $items->map(function ($item) use ($products, $productImages) {
                $product = $products->get($item->product_id);
                $img = $productImages->get($item->product_id);
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

        $transformed = collect($orders->items())->map(function ($ord) use ($groupedItems) {
            $ordItems = $groupedItems->get($ord->id) ?? collect([]);
            
            // Extract phone number from notes if available
            $extractedPhone = null;
            if (!empty($ord->customer_notes) && preg_match('/Contact Phone:\s*([+\d\s\-]+)/', $ord->customer_notes, $matches)) {
                $extractedPhone = trim($matches[1]);
            }

            return [
                'id'                         => $ord->id,
                'order_number'               => 'ORD-' . str_pad($ord->id, 5, '0', STR_PAD_LEFT),
                'user_id'                    => $ord->user_id,
                'customer_name'              => $ord->customer_name ?? 'Customer',
                'customer_email'             => $ord->customer_email ?? '',
                'customer_phone'             => $extractedPhone,
                'delivery_boy_id'            => $ord->delivery_boy_id,
                'delivery_boy_name'          => $ord->delivery_boy_name,
                'quantity'                   => (int) $ord->quantity,
                'total_price'                => (float) $ord->total_price,
                'status'                     => $ord->status ?? 'pending',
                'payment_method'             => ucfirst($ord->payment_method ?? 'cod'),
                'payment_status'             => $ord->payment_status ?? 'unpaid',
                'tracking_number'            => $ord->tracking_number,
                'shipping_carrier'           => $ord->shipping_carrier,
                'shipping_address'           => $ord->shipping_address,
                'shipping_city'              => $ord->shipping_city,
                'shipping_state'             => $ord->shipping_state,
                'shipping_country'           => $ord->shipping_country,
                'customer_notes'             => $ord->customer_notes,
                'admin_notes'                => $ord->admin_notes,
                'delivery_otp'               => app()->environment('local') ? $ord->delivery_otp : null,
                'has_active_otp'             => !empty($ord->delivery_otp),
                'delivery_otp_verified_at'   => $ord->delivery_otp_verified_at,
                'cod_collected_amount'       => (float) ($ord->cod_collected_amount ?? 0),
                'cod_collected_at'           => $ord->cod_collected_at,
                'office_settlement_status'   => $ord->office_settlement_status ?? 'unsettled',
                'office_settlement_at'       => $ord->office_settlement_at,
                'order_date'                 => $ord->order_date ?? $ord->created_at,
                'completed_date'             => $ord->completed_date,
                'shipped_date'               => $ord->shipped_date,
                'items'                      => $ordItems->values()->all(),
            ];
        });

        // Rider Financial and Delivery Stats
        $riderStatsQuery = DB::table('orders')->where('delivery_boy_id', $userId);
        
        $totalAssigned = (clone $riderStatsQuery)->count();
        $activeDeliveries = (clone $riderStatsQuery)->whereIn('status', ['pending', 'processing', 'shipped', 'delivered'])->count();
        $completedDeliveries = (clone $riderStatsQuery)->where('status', 'completed')->count();

        // Cash in Hand (collected COD cash not yet settled with office)
        $unsettledCashInHand = (clone $riderStatsQuery)
            ->where('status', 'completed')
            ->where(function ($q) {
                $q->where('payment_method', 'like', '%cod%')
                  ->orWhere('payment_method', 'like', '%cash%');
            })
            ->where(function ($q) {
                $q->whereNull('office_settlement_status')
                  ->orWhere('office_settlement_status', '!=', 'settled');
            })
            ->sum('cod_collected_amount');

        // Total Settled Cash Handed Over
        $settledCash = (clone $riderStatsQuery)
            ->where('office_settlement_status', 'settled')
            ->sum('cod_collected_amount');

        // Total Lifetime Collected
        $lifetimeCodCollected = (clone $riderStatsQuery)
            ->where('status', 'completed')
            ->sum('cod_collected_amount');

        return Inertia::render('Delivery/Orders', [
            'orders' => [
                'data'         => $transformed->all(),
                'total'        => $orders->total(),
                'per_page'     => $orders->perPage(),
                'current_page' => $orders->currentPage(),
                'last_page'    => $orders->lastPage(),
            ],
            'filters' => [
                'status' => $statusFilter,
                'search' => $search,
            ],
            'rider' => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
            ],
            'stats' => [
                'total_assigned'         => $totalAssigned,
                'active_deliveries'      => $activeDeliveries,
                'completed_deliveries'   => $completedDeliveries,
                'unsettled_cash_in_hand' => (float) $unsettledCashInHand,
                'settled_cash'           => (float) $settledCash,
                'lifetime_cod_collected' => (float) $lifetimeCodCollected,
            ],
        ]);
    }

    /**
     * Dispatch Customer Delivery OTP from rider's device.
     */
    public function sendDeliveryOtp(Request $request, int $id)
    {
        $user = Auth::user();
        $order = DB::table('orders')->where('id', $id)->first();
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Order not found.'], 404);
        }

        // Security check: Rider can only send OTP for their assigned order (or superadmin)
        $userRoles = is_array($user->user_role) ? $user->user_role : [];
        $isSuperAdmin = in_array('Administrator', $userRoles, true);

        if (!$isSuperAdmin && (int) $order->delivery_boy_id !== (int) $user->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized. This order is not assigned to you.'], 403);
        }

        // Forward to Admin OrderController logic or run directly
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
                'success'     => false,
                'needs_phone' => true,
                'message'     => 'Customer phone number missing. Please input phone number to dispatch WhatsApp OTP.',
            ], 422);
        }

        $otp = (string) random_int(100000, 999999);
        $expiresAt = now()->addMinutes(30);

        DB::table('orders')->where('id', $id)->update([
            'delivery_otp'            => $otp,
            'delivery_otp_expires_at' => $expiresAt,
            'updated_at'              => now(),
        ]);

        $dispatchResult = $this->dispatchWhatsAppOtpWithDetails($phone, $otp, $order->id, (float) $order->total_price);
        $waSent = $dispatchResult['success'] ?? false;
        $apiError = $dispatchResult['error'] ?? null;

        return response()->json([
            'success'   => true,
            'message'   => $waSent
                ? "Delivery confirmation OTP successfully sent to customer's WhatsApp ({$phone})!"
                : "WhatsApp delivery failed" . ($apiError ? " ({$apiError})" : "") . ". Please check customer WhatsApp or re-send.",
            'api_sent'  => $waSent,
            'api_error' => $apiError,
        ]);
    }

    /**
     * Verify Customer Delivery OTP and complete the order.
     * Automatically logs collected COD cash into the rider's record.
     */
    public function verifyDeliveryOtp(Request $request, int $id)
    {
        $request->validate([
            'otp' => 'required|string',
        ]);

        $user = Auth::user();
        $order = DB::table('orders')->where('id', $id)->first();
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Order not found.'], 404);
        }

        $userRoles = is_array($user->user_role) ? $user->user_role : [];
        $isSuperAdmin = in_array('Administrator', $userRoles, true);

        if (!$isSuperAdmin && (int) $order->delivery_boy_id !== (int) $user->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized. This order is not assigned to you.'], 403);
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

        // Ensure assigned delivery boy is recorded
        if (empty($order->delivery_boy_id)) {
            $update['delivery_boy_id'] = $user->id;
        }

        // If Cash On Delivery: credit the cash to the Delivery Boy's record as unsettled in hand
        $isCod = str_contains(strtolower($order->payment_method ?? 'cod'), 'cod') || str_contains(strtolower($order->payment_method ?? ''), 'cash');
        if ($isCod) {
            $update['cod_collected_amount']     = $order->total_price;
            $update['cod_collected_at']         = $now;
            $update['payment_status']           = 'paid';
            $update['office_settlement_status'] = 'unsettled';
        }

        DB::table('orders')->where('id', $id)->update($update);

        return response()->json([
            'success' => true,
            'message' => 'Order successfully marked as Completed! ' .
                ($isCod ? "Cash of {$order->total_price} added to your unsettled cash in hand." : ''),
        ]);
    }

    /**
     * Dispatch WhatsApp OTP.
     */
    protected function dispatchWhatsAppOtpWithDetails(string $phone, string $otp, int $orderId, float $total): array
    {
        $waApiKey = null;
        $waEndpoint = null;
        $phoneNumberId = null;

        $settingFile = storage_path('app/data/setting.json');
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
            $phoneId = $phoneNumberId ?? env('FACEBOOK_WHATSAPP_PHONE_NUMBER_ID', '1368734399657650');
            $waEndpoint = "https://graph.facebook.com/v20.0/{$phoneId}/messages";
        }

        if (empty($waApiKey)) {
            return ['success' => false, 'error' => 'WhatsApp API token is not configured in settings or .env.'];
        }

        $cleanDigits = preg_replace('/[^\d]/', '', $phone);
        if (str_starts_with($cleanDigits, '03')) {
            $cleanDigits = '92' . substr($cleanDigits, 1);
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
     * Delivery Boy requests Office Settlement OTP when returning to office with cash.
     * The OTP is sent directly to the official office email address.
     */
    public function generateOfficeSettlementOtp(Request $request, int $id)
    {
        $user = Auth::user();
        $order = DB::table('orders')->where('id', $id)->first();
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Order not found.'], 404);
        }

        $userRoles = is_array($user->user_role) ? $user->user_role : [];
        $isSuperAdmin = in_array('Administrator', $userRoles, true);

        if (!$isSuperAdmin && (int) $order->delivery_boy_id !== (int) $user->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized. This order is not assigned to you.'], 403);
        }

        if ($order->office_settlement_status === 'settled') {
            return response()->json(['success' => false, 'message' => 'Order cash has already been settled with the office.'], 422);
        }

        $otp = (string) random_int(100000, 999999);
        DB::table('orders')->where('id', $id)->update([
            'office_settlement_otp' => $otp,
            'updated_at'            => now(),
        ]);

        // Office email and currency from setting.json
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

        $riderName = $user->name;
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
            'office_email'   => $officeEmail,
            'email_sent'     => $emailSent,
            'message'        => $emailSent
                ? "Settlement request sent! Authorization OTP was sent to office email ({$officeEmail})."
                : "Settlement request generated. Ask the office manager for the authorization code.",
        ]);
    }

    /**
     * Verify office settlement OTP to mark cash handoff as Settled.
     */
    public function settleOfficePayment(Request $request, int $id)
    {
        $request->validate([
            'settlement_otp' => 'required|string',
        ]);

        $user = Auth::user();
        $order = DB::table('orders')->where('id', $id)->first();
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Order not found.'], 404);
        }

        $userRoles = is_array($user->user_role) ? $user->user_role : [];
        $isSuperAdmin = in_array('Administrator', $userRoles, true);

        if (!$isSuperAdmin && (int) $order->delivery_boy_id !== (int) $user->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized. This order is not assigned to you.'], 403);
        }

        if (empty($order->office_settlement_otp) || $order->office_settlement_otp !== trim($request->settlement_otp)) {
            return response()->json(['success' => false, 'message' => 'Invalid office authorization OTP code.'], 422);
        }

        DB::table('orders')->where('id', $id)->update([
            'office_settlement_status' => 'settled',
            'office_settlement_at'     => now(),
            'office_settlement_otp'    => null,
            'updated_at'               => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Cash of {$order->cod_collected_amount} successfully handed over and settled with the office!",
        ]);
    }
}
