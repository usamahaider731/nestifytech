<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Delivery OTP – {{ config('app.name', 'NestifyTech') }}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:0;">
    <tr>
        <td align="center" style="padding:40px 16px 48px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

                <!-- Top accent bar -->
                <tr>
                    <td style="height:4px;background:linear-gradient(90deg,#10b981 0%,#06b6d4 100%);border-radius:12px 12px 0 0;"></td>
                </tr>

                <!-- Header -->
                <tr>
                    <td style="background:#1e293b;padding:36px 40px 28px;border-left:1px solid #334155;border-right:1px solid #334155;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td>
                                    <div style="display:inline-block;background:linear-gradient(135deg,#10b981,#06b6d4);border-radius:10px;padding:8px 14px;margin-bottom:16px;">
                                        <span style="font-size:12px;font-weight:700;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">📦 Delivery OTP</span>
                                    </div>
                                    <h1 style="margin:0;font-size:26px;font-weight:800;color:#f1f5f9;line-height:1.2;letter-spacing:-0.5px;">{{ config('app.name', 'NestifyTech') }}</h1>
                                    <p style="margin:6px 0 0;font-size:13px;color:#64748b;">Delivery Confirmation Code</p>
                                </td>
                                <td align="right" valign="top">
                                    <div style="width:48px;height:48px;background:linear-gradient(135deg,#10b981,#06b6d4);border-radius:12px;text-align:center;line-height:48px;font-size:22px;">🛵</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- Body -->
                <tr>
                    <td style="background:#1e293b;padding:0 40px 36px;border-left:1px solid #334155;border-right:1px solid #334155;">

                        <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#f1f5f9;">Hi, {{ $order->customer_name ?? 'Valued Customer' }} 👋</p>
                        <p style="margin:0 0 28px;font-size:14px;color:#94a3b8;line-height:1.7;">
                            Your order <strong style="color:#6ee7b7;">#{{ $order->id }}</strong> is <strong style="color:#f1f5f9;">out for delivery!</strong> Please inspect your items carefully before sharing the OTP with the delivery rider.
                        </p>

                        <!-- Order Details -->
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border:1px solid #334155;border-radius:12px;overflow:hidden;margin-bottom:24px;">
                            <tr>
                                <td style="padding:14px 20px;border-bottom:1px solid #1e293b;font-size:12px;color:#64748b;width:120px;">Order #</td>
                                <td style="padding:14px 20px;border-bottom:1px solid #1e293b;font-size:14px;font-weight:700;color:#f1f5f9;">#{{ $order->id }}</td>
                            </tr>
                            <tr>
                                <td style="padding:14px 20px;font-size:12px;color:#64748b;">Total</td>
                                <td style="padding:14px 20px;font-size:16px;font-weight:800;color:#34d399;">{{ $currency }} {{ number_format($order->total_price, 0) }}</td>
                            </tr>
                        </table>

                        <!-- OTP Code -->
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                            <tr>
                                <td style="background:#0f172a;border:2px dashed #10b981;border-radius:16px;padding:32px 24px;text-align:center;">
                                    <span style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:3px;font-weight:700;color:#059669;margin-bottom:16px;">Your Delivery OTP</span>
                                    <div style="font-size:48px;font-weight:900;letter-spacing:12px;color:#34d399;font-family:'Courier New',Courier,monospace;line-height:1;">{{ $otp }}</div>
                                    <span style="display:block;font-size:12px;color:#64748b;margin-top:16px;">
                                        Expires in <strong style="color:#94a3b8;">{{ $minutes }} minutes</strong>
                                    </span>
                                </td>
                            </tr>
                        </table>

                        <!-- Warning -->
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-left:4px solid #f59e0b;border-radius:0 10px 10px 0;padding:16px 20px;">
                                    <p style="margin:0;font-size:13px;color:#fde68a;line-height:1.6;">
                                        ⚠️ <strong>Important:</strong> Only share this OTP with the delivery rider <em>after</em> inspecting your package. Do not share it if you are unsatisfied or haven't received your items.
                                    </p>
                                </td>
                            </tr>
                        </table>

                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td style="background:#0f172a;border:1px solid #334155;border-top:none;border-radius:0 0 12px 12px;padding:24px 40px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td>
                                    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#94a3b8;">{{ config('app.name', 'NestifyTech') }}</p>
                                    <p style="margin:0;font-size:12px;color:#475569;">© {{ date('Y') }} All rights reserved.</p>
                                </td>
                                <td align="right">
                                    <p style="margin:0;font-size:11px;color:#334155;">If you didn't place this order,<br>contact support immediately.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

            </table>
        </td>
    </tr>
</table>

</body>
</html>
