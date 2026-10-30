<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to {{ config('app.name', 'NestifyTech') }} Newsletter</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.6;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                    <!-- Brand Header -->
                    <tr>
                        <td style="padding: 28px 32px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); text-align: center; border-bottom: 3px solid #6366f1;">
                            <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">
                                {{ config('app.name', 'NestifyTech') }}
                            </h1>
                            <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">
                                Newsletter &amp; Updates
                            </p>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 36px 32px 24px;">
                            <h2 style="margin: 0 0 14px; font-size: 18px; font-weight: 700; color: #0f172a;">
                                🎉 Welcome aboard{{ $subscriber->name ? ', ' . $subscriber->name : '' }}!
                            </h2>
                            <p style="margin: 0 0 16px; font-size: 14px; color: #475569;">
                                You have successfully subscribed to the <strong>{{ config('app.name', 'NestifyTech') }}</strong> newsletter.
                                We're thrilled to have you with us!
                            </p>

                            <!-- Benefits Box -->
                            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 24px 0;">
                                <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; color: #64748b; margin-bottom: 14px;">
                                    What to Expect
                                </span>
                                <div style="font-size: 13px; color: #334155; margin-bottom: 10px; display: flex; align-items: flex-start; gap: 8px;">
                                    ✅ &nbsp;<span>Exclusive product launches and early-access deals</span>
                                </div>
                                <div style="font-size: 13px; color: #334155; margin-bottom: 10px;">
                                    ✅ &nbsp;<span>Flash sales, promotions &amp; discount coupon codes</span>
                                </div>
                                <div style="font-size: 13px; color: #334155;">
                                    ✅ &nbsp;<span>Latest news, blog articles &amp; industry updates</span>
                                </div>
                            </div>

                            <p style="margin: 0 0 16px; font-size: 13px; color: #64748b;">
                                You can unsubscribe at any time by clicking the link below.
                            </p>

                            @if($subscriber->token)
                            <p style="text-align: center; margin: 20px 0 0;">
                                <a href="{{ url('/newsletter/unsubscribe/' . $subscriber->token) }}"
                                   style="font-size: 11px; color: #94a3b8; text-decoration: underline;">
                                    Click here to unsubscribe
                                </a>
                            </p>
                            @endif
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                            <p style="margin: 0 0 6px; font-size: 12px; color: #64748b;">
                                Best regards,<br>
                                <strong>The {{ config('app.name', 'NestifyTech') }} Team</strong>
                            </p>
                            <p style="margin: 12px 0 0; font-size: 11px; color: #94a3b8;">
                                &copy; {{ date('Y') }} {{ config('app.name', 'NestifyTech') }}. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
