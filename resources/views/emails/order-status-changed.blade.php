<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Order Status Update #{{ $order->id ?? '' }} – {{ config('app.name', 'NestifyTech') }}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:0;">
    <tr>
        <td align="center" style="padding:40px 16px 48px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

                <!-- Top accent bar -->
                <tr>
                    <td style="height:4px;background:linear-gradient(90deg,#06b6d4 0%,#3b82f6 50%,#8b5cf6 100%);border-radius:12px 12px 0 0;"></td>
                </tr>

                <!-- Header -->
                <tr>
                    <td style="background:#1e293b;padding:36px 40px 28px;border-left:1px solid #334155;border-right:1px solid #334155;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td>
                                    <div style="display:inline-block;background:linear-gradient(135deg,#06b6d4,#3b82f6);border-radius:10px;padding:8px 14px;margin-bottom:16px;">
                                        <span style="font-size:12px;font-weight:700;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">📦 ORDER UPDATE</span>
                                    </div>
                                    <h1 style="margin:0;font-size:26px;font-weight:800;color:#f1f5f9;line-height:1.2;letter-spacing:-0.5px;">{{ config('app.name', 'NestifyTech') }}</h1>
                                    <p style="margin:6px 0 0;font-size:13px;color:#64748b;">
                                        Tracking Order #{{ $order->id ?? '' }}
                                    </p>
                                </td>
                                <td align="right" valign="top">
                                    <div style="width:48px;height:48px;background:linear-gradient(135deg,#06b6d4,#3b82f6);border-radius:12px;text-align:center;line-height:48px;font-size:22px;">
                                        @if($status === 'shipped') 🚚 @elseif($status === 'delivered' || $status === 'completed') ✅ @elseif($status === 'cancelled') ❌ @else 📦 @endif
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- Body -->
                <tr>
                    <td style="background:#1e293b;padding:0 40px 36px;border-left:1px solid #334155;border-right:1px solid #334155;">

                        <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#f1f5f9;">
                            Order Status: <span style="color:#38bdf8;text-transform:capitalize;">{{ $status }}</span>
                        </p>
                        <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;line-height:1.7;">
                            Your order <strong style="color:#f1f5f9;">#{{ $order->id ?? '' }}</strong> status has been updated to <strong style="color:#38bdf8;text-transform:uppercase;">{{ $status }}</strong>.
                        </p>

                        <!-- Status Badge Card -->
                        <div style="background:#0f172a;border:1px solid #334155;border-radius:12px;padding:20px;margin-bottom:24px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding:6px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Status</td>
                                    <td align="right" style="padding:6px 0;font-size:14px;font-weight:700;text-transform:uppercase;color:
                                        @if($status === 'completed' || $status === 'delivered') #34d399
                                        @elseif($status === 'cancelled') #f87171
                                        @elseif($status === 'shipped') #38bdf8
                                        @else #fbbf24
                                        @endif
                                    ;">{{ $status }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:6px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Total Amount</td>
                                    <td align="right" style="padding:6px 0;font-size:14px;color:#f1f5f9;font-weight:700;font-family:monospace;">PKR {{ number_format($order->total_price ?? 0, 2) }}</td>
                                </tr>
                                @if(!empty($order->tracking_number))
                                <tr>
                                    <td style="padding:6px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Tracking #</td>
                                    <td align="right" style="padding:6px 0;font-size:13px;color:#a5b4fc;font-weight:700;font-family:monospace;">{{ $order->tracking_number }}</td>
                                </tr>
                                @endif
                                @if(!empty($order->shipping_carrier))
                                <tr>
                                    <td style="padding:6px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Carrier</td>
                                    <td align="right" style="padding:6px 0;font-size:13px;color:#f1f5f9;font-weight:600;">{{ $order->shipping_carrier }}</td>
                                </tr>
                                @endif
                            </table>
                        </div>

                        <!-- Action Button -->
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td align="center" style="padding:8px 0 24px;">
                                    <a href="{{ url('/track-order/' . ($order->tracking_number ?? '')) }}"
                                       style="display:inline-block;background:linear-gradient(135deg,#06b6d4,#3b82f6);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;letter-spacing:0.5px;box-shadow:0 4px 14px rgba(6,182,212,0.4);">
                                        Track Your Package Live →
                                    </a>
                                </td>
                            </tr>
                        </table>

                        <p style="margin:0;font-size:12px;color:#64748b;line-height:1.7;border-top:1px solid #334155;padding-top:20px;">
                            Need help? Reach out to us at <a href="mailto:{{ config('mail.from.address', 'info.nestifytech@gmail.com') }}" style="color:#38bdf8;text-decoration:none;">{{ config('mail.from.address', 'info.nestifytech@gmail.com') }}</a>.
                        </p>

                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td style="background:#0f172a;border:1px solid #334155;border-top:none;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
                        <p style="margin:0 0 6px;font-size:12px;color:#475569;">
                            © {{ date('Y') }} {{ config('app.name', 'NestifyTech') }}. All rights reserved.
                        </p>
                    </td>
                </tr>

            </table>
        </td>
    </tr>
</table>

</body>
</html>
