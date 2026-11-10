<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Response to Your Inquiry – {{ $fromName }}</title>
    <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:0;">
    <tr>
        <td align="center" style="padding:40px 16px 48px;">

            <!-- Card -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

                <!-- Top accent bar -->
                <tr>
                    <td style="height:4px;background:linear-gradient(90deg,#6366f1 0%,#8b5cf6 50%,#06b6d4 100%);border-radius:12px 12px 0 0;"></td>
                </tr>

                <!-- Header -->
                <tr>
                    <td style="background:#1e293b;padding:36px 40px 28px;border-left:1px solid #334155;border-right:1px solid #334155;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td>
                                    <div style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:10px;padding:8px 14px;margin-bottom:16px;">
                                        <span style="font-size:12px;font-weight:700;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">Support Reply</span>
                                    </div>
                                    <h1 style="margin:0;font-size:26px;font-weight:800;color:#f1f5f9;line-height:1.2;letter-spacing:-0.5px;">{{ $fromName }}</h1>
                                    <p style="margin:6px 0 0;font-size:13px;color:#64748b;">We've reviewed your inquiry and have a response for you.</p>
                                </td>
                                <td align="right" valign="top">
                                    <div style="width:48px;height:48px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;text-align:center;line-height:48px;font-size:22px;">✉️</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- Body -->
                <tr>
                    <td style="background:#1e293b;padding:0 40px 36px;border-left:1px solid #334155;border-right:1px solid #334155;">

                        <!-- Greeting -->
                        <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#f1f5f9;">Hello, {{ $inquiry->name }} 👋</p>
                        <p style="margin:0 0 28px;font-size:14px;color:#94a3b8;line-height:1.7;">
                            Our team has reviewed your inquiry about <strong style="color:#c7d2fe;">"{{ $inquiry->subject ?: 'General Request' }}"</strong>. Here is our official response:
                        </p>

                        <!-- Reply Message Box -->
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                            <tr>
                                <td style="background:#0f172a;border:1px solid #334155;border-left:4px solid #6366f1;border-radius:0 10px 10px 0;padding:24px;">
                                    <span style="display:block;font-size:10px;text-transform:uppercase;letter-spacing:2px;font-weight:700;color:#6366f1;margin-bottom:12px;">Message from Support Team</span>
                                    <div style="font-size:14px;color:#cbd5e1;line-height:1.8;white-space:pre-line;">{!! nl2br(e($replyText)) !!}</div>
                                </td>
                            </tr>
                        </table>

                        <!-- Divider -->
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                            <tr>
                                <td style="border-top:1px solid #334155;"></td>
                            </tr>
                        </table>

                        <!-- Original message reference -->
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                            <tr>
                                <td style="background:#0f172a;border:1px solid #334155;border-radius:10px;padding:18px 20px;">
                                    <span style="display:block;font-size:10px;text-transform:uppercase;letter-spacing:2px;font-weight:700;color:#475569;margin-bottom:10px;">
                                        Your Original Inquiry · Ref #INQ-{{ str_pad($inquiry->id, 5, '0', STR_PAD_LEFT) }}
                                    </span>
                                    <p style="margin:0;font-size:13px;color:#64748b;font-style:italic;line-height:1.6;">"{{ Str::limit($inquiry->message, 250) }}"</p>
                                </td>
                            </tr>
                        </table>

                        <!-- CTA -->
                        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                            <tr>
                                <td style="border-radius:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);">
                                    <a href="mailto:{{ $fromAddress }}?subject=Re:%20{{ urlencode($inquiry->subject ?: 'Your Inquiry') }}" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
                                        Reply to This Email →
                                    </a>
                                </td>
                            </tr>
                        </table>

                        <p style="margin:24px 0 0;font-size:13px;color:#475569;text-align:center;">Need more help? Simply reply to this email and we'll be happy to assist you further.</p>
                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td style="background:#0f172a;border:1px solid #334155;border-top:none;border-radius:0 0 12px 12px;padding:24px 40px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td>
                                    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#94a3b8;">{{ $fromName }}</p>
                                    <p style="margin:0;font-size:12px;color:#475569;">© {{ date('Y') }} {{ $fromName }}. All rights reserved.</p>
                                </td>
                                <td align="right">
                                    <p style="margin:0;font-size:11px;color:#334155;">This is an official support reply.<br>Please do not share your inquiry reference.</p>
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
