<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Thank You for Contacting {{ config('app.name', 'NestifyTech') }}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:0;">
    <tr>
        <td align="center" style="padding:40px 16px 48px;">

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

                <!-- Top accent bar -->
                <tr>
                    <td style="height:4px;background:linear-gradient(90deg,#10b981 0%,#06b6d4 50%,#6366f1 100%);border-radius:12px 12px 0 0;"></td>
                </tr>

                <!-- Header -->
                <tr>
                    <td style="background:#1e293b;padding:36px 40px 28px;border-left:1px solid #334155;border-right:1px solid #334155;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td>
                                    <div style="display:inline-block;background:linear-gradient(135deg,#10b981,#06b6d4);border-radius:10px;padding:8px 14px;margin-bottom:16px;">
                                        <span style="font-size:12px;font-weight:700;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">Message Received</span>
                                    </div>
                                    <h1 style="margin:0;font-size:26px;font-weight:800;color:#f1f5f9;line-height:1.2;letter-spacing:-0.5px;">{{ config('app.name', 'NestifyTech') }}</h1>
                                    <p style="margin:6px 0 0;font-size:13px;color:#64748b;">Customer Support Center</p>
                                </td>
                                <td align="right" valign="top">
                                    <div style="width:48px;height:48px;background:linear-gradient(135deg,#10b981,#06b6d4);border-radius:12px;text-align:center;line-height:48px;font-size:22px;">✅</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- Body -->
                <tr>
                    <td style="background:#1e293b;padding:0 40px 36px;border-left:1px solid #334155;border-right:1px solid #334155;">

                        <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#f1f5f9;">Hello, {{ $inquiry->name }} 👋</p>
                        <p style="margin:0 0 20px;font-size:14px;color:#94a3b8;line-height:1.7;">
                            Thank you for reaching out! We've successfully received your message about <strong style="color:#6ee7b7;">"{{ $inquiry->subject ?: 'Your Inquiry' }}"</strong>.
                        </p>
                        <p style="margin:0 0 28px;font-size:14px;color:#94a3b8;line-height:1.7;">
                            A dedicated specialist from our team will carefully review your request and respond within <strong style="color:#f1f5f9;">12–24 business hours</strong>.
                        </p>

                        <!-- Summary box -->
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                            <tr>
                                <td style="background:#0f172a;border:1px solid #334155;border-radius:12px;padding:24px;">
                                    <span style="display:block;font-size:10px;text-transform:uppercase;letter-spacing:2px;font-weight:700;color:#475569;margin-bottom:16px;">Inquiry Summary</span>

                                    <!-- Ref ID -->
                                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                                        <tr>
                                            <td style="font-size:12px;color:#64748b;width:100px;vertical-align:top;padding-top:2px;">Reference</td>
                                            <td style="font-size:13px;font-weight:700;color:#a5b4fc;">#INQ-{{ str_pad($inquiry->id, 5, '0', STR_PAD_LEFT) }}</td>
                                        </tr>
                                    </table>

                                    <!-- Subject -->
                                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                                        <tr>
                                            <td style="font-size:12px;color:#64748b;width:100px;vertical-align:top;padding-top:2px;">Subject</td>
                                            <td style="font-size:13px;color:#cbd5e1;">{{ $inquiry->subject ?: 'General Request' }}</td>
                                        </tr>
                                    </table>

                                    <!-- Divider -->
                                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0;">
                                        <tr><td style="border-top:1px solid #1e293b;"></td></tr>
                                    </table>

                                    <!-- Message -->
                                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td style="font-size:12px;color:#64748b;width:100px;vertical-align:top;padding-top:2px;">Message</td>
                                            <td style="font-size:13px;color:#94a3b8;font-style:italic;line-height:1.6;">"{{ Str::limit($inquiry->message, 300) }}"</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>

                        <!-- Info tip -->
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                            <tr>
                                <td style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:8px;padding:14px 18px;">
                                    <p style="margin:0;font-size:13px;color:#6ee7b7;">
                                        💡 <strong>Tip:</strong> For urgent matters, reply directly to this email or contact us via WhatsApp for the fastest response.
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
                                    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#94a3b8;">{{ config('app.name', 'NestifyTech') }} Support Team</p>
                                    <p style="margin:0;font-size:12px;color:#475569;">© {{ date('Y') }} {{ config('app.name', 'NestifyTech') }}. All rights reserved.</p>
                                </td>
                                <td align="right">
                                    <p style="margin:0;font-size:11px;color:#334155;">We'll be in touch soon.<br>Keep this email for your records.</p>
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
