<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Order Confirmation #{{ $order->id ?? '' }} – {{ config('app.name', 'NestifyTech') }}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:0;">
    <tr>
        <td align="center" style="padding:40px 16px 48px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

                <!-- Top accent bar -->
                <tr>
                    <td style="height:4px;background:linear-gradient(90deg,#6366f1 0%,#8b5cf6 50%,#ec4899 100%);border-radius:12px 12px 0 0;"></td>
                </tr>

                <!-- Header -->
                <tr>
                    <td style="background:#1e293b;padding:36px 40px 28px;border-left:1px solid #334155;border-right:1px solid #334155;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td>
                                    <div style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:10px;padding:8px 14px;margin-bottom:16px;">
                                        <span style="font-size:12px;font-weight:700;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">
                                            @if(($recipientRole ?? '') === 'admin')
                                                🔔 ADMIN NOTIFICATION
                                            @else
                                                ✨ ORDER CONFIRMED
                                            @endif
                                        </span>
                                    </div>
                                    <h1 style="margin:0;font-size:26px;font-weight:800;color:#f1f5f9;line-height:1.2;letter-spacing:-0.5px;">{{ config('app.name', 'NestifyTech') }}</h1>
                                    <p style="margin:6px 0 0;font-size:13px;color:#64748b;">
                                        Order Receipt &amp; Summary • #{{ $order->id ?? '' }}
                                    </p>
                                </td>
                                <td align="right" valign="top">
                                    <div style="width:48px;height:48px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;text-align:center;line-height:48px;font-size:22px;">🛍️</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- Body -->
                <tr>
                    <td style="background:#1e293b;padding:0 40px 36px;border-left:1px solid #334155;border-right:1px solid #334155;">

                        <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#f1f5f9;">
                            @if(($recipientRole ?? '') === 'admin')
                                Hello Admin 👋
                            @else
                                Thank you for your purchase! 👋
                            @endif
                        </p>
                        <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;line-height:1.7;">
                            @if(($recipientRole ?? '') === 'admin')
                                A new order <strong style="color:#a5b4fc;">#{{ $order->id }}</strong> has been placed on the store. Below are the order details:
                            @else
                                We have successfully received your order <strong style="color:#a5b4fc;">#{{ $order->id }}</strong>. We are preparing your package and will notify you once dispatched.
                            @endif
                        </p>

                        <!-- Order Summary Card -->
                        <div style="background:#0f172a;border:1px solid #334155;border-radius:12px;padding:20px;margin-bottom:24px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding:6px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Order ID</td>
                                    <td align="right" style="padding:6px 0;font-size:14px;color:#a5b4fc;font-weight:700;font-family:monospace;">#{{ str_pad($order->id, 5, '0', STR_PAD_LEFT) }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:6px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Payment Method</td>
                                    <td align="right" style="padding:6px 0;font-size:13px;color:#f1f5f9;font-weight:600;text-transform:uppercase;">{{ $order->payment_method ?? 'COD' }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:6px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Payment Status</td>
                                    <td align="right" style="padding:6px 0;font-size:13px;color:{{ ($order->payment_status ?? '') === 'paid' ? '#34d399' : '#fbbf24' }};font-weight:700;text-transform:uppercase;">{{ $order->payment_status ?? 'UNPAID' }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:6px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Shipping Address</td>
                                    <td align="right" style="padding:6px 0;font-size:13px;color:#cbd5e1;max-width:260px;line-height:1.4;">{{ $order->shipping_address ?? 'Standard Delivery' }}</td>
                                </tr>
                            </table>
                        </div>

                        <!-- Purchased Items Table -->
                        @if(!empty($orderItems) && count($orderItems) > 0)
                        <div style="background:#0f172a;border:1px solid #334155;border-radius:12px;padding:20px;margin-bottom:24px;">
                            <div style="font-size:12px;color:#94a3b8;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;border-bottom:1px solid #1e293b;padding-bottom:8px;">
                                Items in this Order
                            </div>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                @foreach($orderItems as $item)
                                <tr>
                                    <td style="padding:8px 0;font-size:14px;color:#f1f5f9;font-weight:600;border-bottom:1px solid #1e293b;">
                                        {{ $item['title'] ?? ('Product #' . ($item['productId'] ?? '')) }}
                                        <div style="font-size:12px;color:#64748b;font-weight:400;margin-top:2px;">
                                            Qty: {{ $item['qty'] ?? 1 }}
                                            @if(!empty($item['color'])) • Variant: {{ $item['color'] }} @endif
                                        </div>
                                    </td>
                                    <td align="right" style="padding:8px 0;font-size:14px;color:#38bdf8;font-weight:700;font-family:monospace;border-bottom:1px solid #1e293b;">
                                        PKR {{ number_format(($item['serverPrice'] ?? 0) * ($item['qty'] ?? 1), 2) }}
                                    </td>
                                </tr>
                                @endforeach
                            </table>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">
                                <tr>
                                    <td style="font-size:14px;color:#f1f5f9;font-weight:700;">Grand Total:</td>
                                    <td align="right" style="font-size:18px;color:#34d399;font-weight:800;font-family:monospace;">
                                        PKR {{ number_format($order->total_price ?? 0, 2) }}
                                    </td>
                                </tr>
                            </table>
                        </div>
                        @endif

                        <!-- Action Button -->
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td align="center" style="padding:8px 0 24px;">
                                    <a href="{{ url('/orders') }}"
                                       style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;letter-spacing:0.5px;box-shadow:0 4px 14px rgba(99,102,241,0.4);">
                                        View Order Details →
                                    </a>
                                </td>
                            </tr>
                        </table>

                        <p style="margin:0;font-size:12px;color:#64748b;line-height:1.7;border-top:1px solid #334155;padding-top:20px;">
                            If you have questions about this order, simply reply to this email or contact support at <a href="mailto:{{ config('mail.from.address', 'info.nestifytech@gmail.com') }}" style="color:#818cf8;text-decoration:none;">{{ config('mail.from.address', 'info.nestifytech@gmail.com') }}</a>.
                        </p>

                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td style="background:#0f172a;border:1px solid #334155;border-top:none;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
                        <p style="margin:0 0 6px;font-size:12px;color:#475569;">
                            © {{ date('Y') }} {{ config('app.name', 'NestifyTech') }}. All rights reserved.
                        </p>
                        <p style="margin:0;font-size:11px;color:#334155;">
                            This automated message was sent for your recent transaction on NestifyTech.
                        </p>
                    </td>
                </tr>

            </table>
        </td>
    </tr>
</table>

</body>
</html>

