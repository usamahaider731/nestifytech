<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Delivery OTP - {{ config('app.name', 'NestifyTech') }}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.6;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,.05); border: 1px solid #e2e8f0;">
                    <!-- Brand Header -->
                    <tr>
                        <td style="padding: 24px 32px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); text-align: center; border-bottom: 3px solid #10b981;">
                            <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">
                                {{ config('app.name', 'NestifyTech') }}
                            </h1>
                            <p style="margin: 4px 0 0; font-size: 12px; color: #10b981; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">
                                📦 Delivery Confirmation Code
                            </p>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 32px 32px 24px;">
                            <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 600; color: #0f172a;">
                                Hi {{ $order->customer_name ?? 'Valued Customer' }},
                            </h2>
                            <p style="margin: 0 0 18px; font-size: 14px; color: #475569;">
                                Your order <strong>#{{ $order->id }}</strong> is out for delivery! Our delivery rider is on the way with your package. Please <strong>inspect your items carefully</strong> before sharing the OTP below to confirm receipt.
                            </p>

                            <!-- Order Details -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">
                                        Order Number:
                                    </td>
                                    <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #0f172a; text-align: right;">
                                        #{{ $order->id }}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">
                                        Order Total:
                                    </td>
                                    <td style="padding: 12px 16px; font-size: 14px; font-weight: 700; color: #0f172a; text-align: right;">
                                        {{ $currency }} {{ number_format($order->total_price, 0) }}
                                    </td>
                                </tr>
                            </table>

                            <!-- OTP Code Block -->
                            <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #475569; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
                                Your Delivery OTP
                            </p>
                            <div style="text-align: center; margin-bottom: 24px;">
                                <div style="display: inline-block; background: linear-gradient(135deg, #ecfdf5, #d1fae5); border: 2px solid #10b981; border-radius: 12px; padding: 18px 36px;">
                                    <span style="font-size: 40px; font-weight: 800; font-family: 'Courier New', monospace; color: #065f46; letter-spacing: 8px;">{{ $otp }}</span>
                                </div>
                            </div>

                            <p style="margin: 0 0 8px; font-size: 13px; color: #475569; text-align: center;">
                                ⏱ This code expires in <strong>{{ $minutes }} minutes</strong>.
                            </p>

                            <!-- Warning Box -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffbeb; border-radius: 8px; border: 1px solid #fcd34d; margin-top: 20px;">
                                <tr>
                                    <td style="padding: 14px 16px; font-size: 12.5px; color: #92400e;">
                                        ⚠️ <strong>Important:</strong> Only share this OTP with the delivery rider <em>after</em> inspecting your package. Do not share it if you haven't received your items or are unsatisfied.
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                            <p style="margin: 0 0 4px; font-size: 12px; color: #94a3b8;">
                                © {{ date('Y') }} {{ config('app.name', 'NestifyTech') }}. All rights reserved.
                            </p>
                            <p style="margin: 0; font-size: 11px; color: #cbd5e1;">
                                If you did not place this order, please contact our support team immediately.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
