<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Stripe\PaymentIntent;
use Stripe\Stripe;

class GiftCardController extends Controller
{
    private array $stripeSettings = [];

    private function loadSettings(): array
    {
        if (!empty($this->stripeSettings)) {
            return $this->stripeSettings;
        }
        $settingFile = storage_path('app/data/setting.json');
        if (file_exists($settingFile)) {
            $this->stripeSettings = json_decode(file_get_contents($settingFile), true) ?: [];
        }
        return $this->stripeSettings;
    }

    private function setStripeKey(): void
    {
        $settings = $this->loadSettings();
        $secret = $settings['payment']['stripe_secret_key']['value'] 
            ?? $settings['stripe']['stripe_secret_key']['value'] 
            ?? env('STRIPE_SECRET');

        if (empty($secret)) {
            throw new \RuntimeException('Payment gateway is currently not configured.');
        }

        Stripe::setApiKey($secret);
    }

    private function getStripeCurrency(): string
    {
        $settings = $this->loadSettings();
        return strtolower(
            $settings['payment']['stripe_currency']['value'] ?? 
            $settings['stripe']['stripe_currency']['value'] ?? 
            'usd'
        );
    }

    /**
     * Display the Buy Gift Cards page
     */
    public function index()
    {
        // Fetch active cards available for purchase
        $availableCards = DB::table('gift_cards')
            ->where('status', 'active')
            ->where('is_for_sale', 1)
            ->whereNull('issued_to_user_id')
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->select('id', 'code', 'title', 'initial_balance', 'purchase_price', 'expires_at', 'note')
            ->orderBy('purchase_price', 'asc')
            ->get();

        // Standard tiered templates if no custom cards are seeded yet
        $defaultTiers = [
            [
                'id' => 'tier_1',
                'title' => 'Starter Gift Pass',
                'purchase_price' => 1000,
                'initial_balance' => 1100,
                'bonus' => 100,
                'note' => 'Pay PKR 1,000 & get PKR 1,100 shopping credit (+10% Bonus)',
            ],
            [
                'id' => 'tier_2',
                'title' => 'Silver Shopper Card',
                'purchase_price' => 2500,
                'initial_balance' => 2750,
                'bonus' => 250,
                'note' => 'Pay PKR 2,500 & get PKR 2,750 shopping credit (+10% Bonus)',
            ],
            [
                'id' => 'tier_3',
                'title' => 'Gold Value Voucher',
                'purchase_price' => 4000,
                'initial_balance' => 4250,
                'bonus' => 250,
                'popular' => true,
                'note' => 'Pay PKR 4,000 & get PKR 4,250 shopping credit (+Rs. 250 Extra Reward)',
            ],
            [
                'id' => 'tier_4',
                'title' => 'Platinum VIP Card',
                'purchase_price' => 10000,
                'initial_balance' => 11000,
                'bonus' => 1000,
                'note' => 'Pay PKR 10,000 & get PKR 11,000 shopping credit (+Rs. 1,000 Bonus)',
            ],
        ];

        // User's purchased gift cards if logged in
        $myGiftCards = [];
        if (Auth::check()) {
            $myGiftCards = DB::table('gift_cards')
                ->where('issued_to_user_id', Auth::id())
                ->orderByDesc('id')
                ->get();
        }

        return Inertia::render('Frontend/GiftCards/Index', [
            'availableCards' => $availableCards,
            'defaultTiers'   => $defaultTiers,
            'myGiftCards'    => $myGiftCards,
            'stripePublishableKey' => $this->getStripePublishableKey(),
            'stripeCurrency'      => $this->getStripeCurrency(),
        ]);
    }

    private function getStripePublishableKey(): ?string
    {
        $settings = $this->loadSettings();
        return $settings['payment']['stripe_publishable_key']['value'] 
            ?? $settings['stripe']['stripe_publishable_key']['value'] 
            ?? env('STRIPE_KEY');
    }

    /**
     * Create Stripe payment intent for gift card purchase
     */
    public function createPaymentIntent(Request $request)
    {
        $request->validate([
            'purchase_price'  => 'required|numeric|min:10',
            'initial_balance' => 'required|numeric|min:10',
            'title'           => 'nullable|string|max:100',
        ]);

        $this->setStripeKey();
        $currency = $this->getStripeCurrency();
        $amountInCents = (int) ($request->purchase_price * 100);

        try {
            $paymentIntent = PaymentIntent::create([
                'amount'   => $amountInCents,
                'currency' => $currency,
                'metadata' => [
                    'type'            => 'gift_card_purchase',
                    'user_id'         => Auth::id() ?? 0,
                    'user_email'      => Auth::user()?->email ?? $request->input('recipient_email', 'guest'),
                    'purchase_price'  => $request->purchase_price,
                    'initial_balance' => $request->initial_balance,
                    'title'           => $request->input('title', 'Promotional Gift Card'),
                ],
            ]);

            return response()->json([
                'clientSecret'    => $paymentIntent->client_secret,
                'paymentIntentId' => $paymentIntent->id,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Finalize gift card creation after payment confirmation
     */
    public function purchaseSuccess(Request $request)
    {
        $request->validate([
            'payment_intent_id' => 'required|string',
            'purchase_price'    => 'required|numeric',
            'initial_balance'   => 'required|numeric',
            'title'             => 'nullable|string',
        ]);

        $paymentIntentId = $request->payment_intent_id;

        // Verify with Stripe
        try {
            $this->setStripeKey();
            $intent = PaymentIntent::retrieve($paymentIntentId);
            if ($intent->status !== 'succeeded') {
                return response()->json(['success' => false, 'message' => 'Payment has not been completed.'], 400);
            }
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Unable to verify payment: ' . $e->getMessage()], 400);
        }

        // Prevent double generation for same payment intent
        $alreadyIssued = DB::table('gift_cards')->where('note', 'like', "%{$paymentIntentId}%")->first();
        if ($alreadyIssued) {
            return response()->json([
                'success' => true,
                'code'    => $alreadyIssued->code,
                'balance' => $alreadyIssued->initial_balance,
                'message' => 'Gift card already issued.',
            ]);
        }

        $code = 'GC-' . strtoupper(Str::random(4)) . '-' . strtoupper(Str::random(4));
        $now = now();
        $userId = Auth::id() ?: null;

        DB::table('gift_cards')->insert([
            'code'               => $code,
            'title'              => $request->input('title', 'Special Reward Gift Card'),
            'purchase_price'     => (float) $request->purchase_price,
            'initial_balance'    => (float) $request->initial_balance,
            'remaining_balance'  => (float) $request->initial_balance,
            'status'             => 'active',
            'is_for_sale'        => 0,
            'issued_to_user_id'  => $userId,
            'note'               => "Purchased online via Stripe. Intent: {$paymentIntentId}",
            'created_at'         => $now,
            'updated_at'         => $now,
        ]);

        return response()->json([
            'success'          => true,
            'code'             => $code,
            'purchase_price'   => $request->purchase_price,
            'initial_balance'  => $request->initial_balance,
            'bonus'            => (float) $request->initial_balance - (float) $request->purchase_price,
            'message'          => 'Gift card issued successfully! You can redeem it immediately on checkout.',
        ]);
    }
}
