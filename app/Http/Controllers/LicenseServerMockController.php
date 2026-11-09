<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;

class LicenseServerMockController extends Controller
{
    /**
     * Get product pricing & enabled payment methods
     * GET /api/license-server/pricing
     */
    public function getPricing(Request $request)
    {
        return response()->json([
            'success'      => true,
            'product_name' => 'NestifyTech - E-Commerce Platform License',
            'product_sku'  => 'nestify-pro',
            'version'      => '2.0.0',
            'price'        => 49.00,
            'currency'     => 'USD',
            'currency_symbol' => '$',
            'methods'      => [
                [
                    'id'          => 'card',
                    'name'        => 'Credit / Debit Card',
                    'icon'        => 'ri-bank-card-line',
                    'description' => 'Pay securely with Visa, Mastercard, or American Express',
                    'requires'    => ['card_number', 'card_exp', 'card_cvc'],
                ],
                [
                    'id'          => 'paypal',
                    'name'        => 'PayPal Express',
                    'icon'        => 'ri-paypal-line',
                    'description' => 'Instant checkout with PayPal balance or linked card',
                    'requires'    => ['paypal_email'],
                ],
                [
                    'id'          => 'license_key',
                    'name'        => 'Existing License Key',
                    'icon'        => 'ri-key-2-line',
                    'description' => 'Already purchased? Enter your activation license key',
                    'requires'    => ['license_key'],
                ],
                [
                    'id'          => 'bank_transfer',
                    'name'        => 'Direct Bank / Wire Transfer',
                    'icon'        => 'ri-bank-line',
                    'description' => 'HBL / Meezan Bank Transfer (Reference transaction ID)',
                    'requires'    => ['transaction_reference'],
                ],
            ],
        ]);
    }

    /**
     * Process & Verify Payment on the Central License Server
     * POST /api/license-server/pay
     */
    public function processPayment(Request $request)
    {
        $validated = $request->validate([
            'method'     => 'required|string',
            'buyer_name' => 'required|string|max:100',
            'buyer_email'=> 'required|email',
            'domain'     => 'nullable|string',
            // Payload based on method
            'card_number'=> 'nullable|string',
            'card_exp'   => 'nullable|string',
            'card_cvc'   => 'nullable|string',
            'paypal_email'=> 'nullable|email',
            'license_key'=> 'nullable|string',
            'transaction_reference' => 'nullable|string',
        ]);

        $method = $validated['method'];

        // If user provided existing license key
        if ($method === 'license_key') {
            $key = strtoupper(trim($validated['license_key'] ?? ''));
            if (empty($key) || strlen($key) < 8) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or unrecognized license key format.',
                ], 422);
            }

            return response()->json([
                'success'        => true,
                'message'        => 'License verified successfully!',
                'license_key'    => $key,
                'transaction_id' => 'LIC-' . strtoupper(Str::random(10)),
                'amount_paid'    => 49.00,
                'currency'       => 'USD',
                'status'         => 'active',
                'buyer_email'    => $validated['buyer_email'],
            ]);
        }

        // Card validation
        if ($method === 'card') {
            $cardNum = preg_replace('/\s+/', '', (string)($validated['card_number'] ?? ''));
            if (strlen($cardNum) < 12) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid card number entered.',
                ], 422);
            }
        }

        // Generate verified license token
        $generatedLicenseKey = 'NESTIFY-' . strtoupper(Str::random(4)) . '-' . strtoupper(Str::random(4)) . '-' . strtoupper(Str::random(4)) . '-PRO';
        $transactionId = 'TXN-' . strtoupper(Str::random(12));

        return response()->json([
            'success'        => true,
            'message'        => 'Payment approved! License issued successfully.',
            'license_key'    => $generatedLicenseKey,
            'transaction_id' => $transactionId,
            'amount_paid'    => 49.00,
            'currency'       => 'USD',
            'payment_method' => $method,
            'buyer_name'     => $validated['buyer_name'],
            'buyer_email'    => $validated['buyer_email'],
            'status'         => 'active',
            'issued_at'      => now()->toIso8601String(),
        ]);
    }
}

