<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Office Settlement Code - {{ config('app.name', 'NestifyTech') }}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.6;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0;">
                    <!-- Brand Header -->
                    <tr>
                        <td style="padding: 24px 32px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); text-align: center; border-bottom: 3px solid #f59e0b;">
                            <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">
                                {{ config('app.name', 'NestifyTech') }}
                            </h1>
                            <p style="margin: 4px 0 0; font-size: 12px; color: #f59e0b; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">
                                Cash on Delivery Office Settlement
                            </p>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 32px 32px 24px;">
                            <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 600; color: #0f172a;">
                                Office Cash Settlement Request
                            </h2>
                            <p style="margin: 0 0 18px; font-size: 14px; color: #475569;">
                                A settlement verification code has been generated for order <strong>#{{ $order->id }}</strong>. Enter this code to confirm that the delivery rider has handed over the collected Cash on Delivery funds to the office.
                            </p>

                            <!-- Order Details Box -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">
                                        Order Number:
                                    </td>
                                    <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #0f172a; text-align: right;">
                                        #{{ $order->id }} {{ !empty($order->tracking_number) ? "({$order->tracking_number})" : '' }}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">
                                        Collected COD Cash:
                                    </td>
                                    <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; font-weight: 700; color: #16a34a; text-align: right;">
                                        {{ $currency ?? 'PKR' }} {{ number_format($order->cod_collected_amount ?: $order->total_price, 2) }}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">
                                        Delivery Rider:
                                    </td>
                                    <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #0f172a; text-align: right;">
                                        {{ $riderName ?? 'Assigned Rider' }}
                                    </td>
                                </tr>
                            </table>

                            <!-- OTP Box -->
                            <div style="background: linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%); border: 2px dashed #f59e0b; border-radius: 10px; padding: 22px 16px; text-align: center; margin: 20px 0;">
                                <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; color: #b45309; margin-bottom: 8px;">
                                    Office Authorization Code
                                </span>
                                <div style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #78350f; font-family: 'Courier New', Courier, monospace;">
                                    {{ $otp }}
                                </div>
                                <span style="display: block; font-size: 12px; color: #92400e; margin-top: 10px;">
                                    Valid for <strong>{{ $minutes ?? 30 }} minutes</strong>
                                </span>
                            </div>

                            <div style="background-color: #f1f5f9; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin: 18px 0;">
                                <p style="margin: 0; font-size: 12px; color: #334155;">
                                    🔒 <strong>Confidential:</strong> This code is sent only to the official office email (<strong>{{ $officeEmail }}</strong>). Do not disclose this code until the physical cash has been counted and verified by office accounts.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                            <p style="margin: 0 0 4px; font-size: 11px; color: #94a3b8;">
                                Automated notification generated by {{ config('app.name', 'NestifyTech') }} Administrative System.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
