<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Welcome to {{ config('app.name', 'NestifyTech') }} Newsletter</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:0;">
    <tr>
        <td align="center" style="padding:40px 16px 48px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

                <!-- Top accent bar -->
                <tr>
                    <td style="height:4px;background:linear-gradient(90deg,#f59e0b 0%,#ec4899 50%,#8b5cf6 100%);border-radius:12px 12px 0 0;"></td>
                </tr>

                <!-- Header -->
                <tr>
                    <td style="background:#1e293b;padding:36px 40px 28px;border-left:1px solid #334155;border-right:1px solid #334155;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td>
                                    <div style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#ec4899);border-radius:10px;padding:8px 14px;margin-bottom:16px;">
                                        <span style="font-size:12px;font-weight:700;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">🎉 Newsletter</span>
                                    </div>
                                    <h1 style="margin:0;font-size:26px;font-weight:800;color:#f1f5f9;line-height:1.2;letter-spacing:-0.5px;">{{ config('app.name', 'NestifyTech') }}</h1>
                                    <p style="margin:6px 0 0;font-size:13px;color:#64748b;">News, Deals & Exclusive Updates</p>
                                </td>
                                <td align="right" valign="top">
                                    <div style="width:48px;height:48px;background:linear-gradient(135deg,#f59e0b,#ec4899);border-radius:12px;text-align:center;line-height:48px;font-size:22px;">🎊</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- Body -->
                <tr>
                    <td style="background:#1e293b;padding:0 40px 36px;border-left:1px solid #334155;border-right:1px solid #334155;">

                        <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#f1f5f9;">Welcome aboard{{ $subscriber->name ? ', ' . $subscriber->name : '' }}! 🚀</p>
                        <p style="margin:0 0 28px;font-size:14px;color:#94a3b8;line-height:1.7;">
                            You've successfully subscribed to <strong style="color:#fcd34d;">{{ config('app.name', 'NestifyTech') }}</strong> newsletter. We're thrilled to have you in our community!
                        </p>

                        <!-- Benefits -->
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                            <tr>
                                <td style="background:#0f172a;border:1px solid #334155;border-radius:12px;padding:24px;">
                                    <span style="display:block;font-size:10px;text-transform:uppercase;letter-spacing:2px;font-weight:700;color:#475569;margin-bottom:16px;">What to Expect</span>

                                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td style="padding:10px 0;border-bottom:1px solid #1e293b;">
                                                <table role="presentation" cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td style="width:32px;height:32px;background:rgba(99,102,241,0.15);border-radius:8px;text-align:center;vertical-align:middle;font-size:16px;">🛍️</td>
                                                        <td style="padding-left:12px;font-size:13px;color:#cbd5e1;">Exclusive product launches and <strong style="color:#a5b4fc;">early-access deals</strong></td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding:10px 0;border-bottom:1px solid #1e293b;">
                                                <table role="presentation" cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td style="width:32px;height:32px;background:rgba(236,72,153,0.15);border-radius:8px;text-align:center;vertical-align:middle;font-size:16px;">⚡</td>
                                                        <td style="padding-left:12px;font-size:13px;color:#cbd5e1;">Flash sales, promotions & <strong style="color:#f9a8d4;">discount coupon codes</strong></td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding:10px 0;">
                                                <table role="presentation" cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td style="width:32px;height:32px;background:rgba(16,185,129,0.15);border-radius:8px;text-align:center;vertical-align:middle;font-size:16px;">📰</td>
                                                        <td style="padding-left:12px;font-size:13px;color:#cbd5e1;">Latest news, blog articles & <strong style="color:#6ee7b7;">industry updates</strong></td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>

                        @if($subscriber->token)
                        <p style="margin:0;font-size:12px;color:#475569;text-align:center;">
                            Don't want these emails? <a href="{{ url('/newsletter/unsubscribe/' . $subscriber->token) }}" style="color:#64748b;text-decoration:underline;">Unsubscribe here</a>
                        </p>
                        @endif
                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td style="background:#0f172a;border:1px solid #334155;border-top:none;border-radius:0 0 12px 12px;padding:24px 40px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td>
                                    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#94a3b8;">The {{ config('app.name', 'NestifyTech') }} Team</p>
                                    <p style="margin:0;font-size:12px;color:#475569;">© {{ date('Y') }} {{ config('app.name', 'NestifyTech') }}. All rights reserved.</p>
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
