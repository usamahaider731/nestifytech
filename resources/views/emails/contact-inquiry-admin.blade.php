<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>New Contact Inquiry – {{ config('app.name', 'NestifyTech') }}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:0;">
    <tr>
        <td align="center" style="padding:40px 16px 48px;">

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

                <!-- Top accent bar -->
                <tr>
                    <td style="height:4px;background:linear-gradient(90deg,#f59e0b 0%,#ef4444 50%,#ec4899 100%);border-radius:12px 12px 0 0;"></td>
                </tr>

                <!-- Header -->
                <tr>
                    <td style="background:#1e293b;padding:36px 40px 28px;border-left:1px solid #334155;border-right:1px solid #334155;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td>
                                    <div style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#ef4444);border-radius:10px;padding:8px 14px;margin-bottom:16px;">
                                        <span style="font-size:12px;font-weight:700;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">New Inquiry Alert</span>
                                    </div>
                                    <h1 style="margin:0;font-size:26px;font-weight:800;color:#f1f5f9;line-height:1.2;letter-spacing:-0.5px;">{{ config('app.name', 'NestifyTech') }}</h1>
                                    <p style="margin:6px 0 0;font-size:13px;color:#64748b;">Admin Notification · Contact Form</p>
                                </td>
                                <td align="right" valign="top">
                                    <div style="width:48px;height:48px;background:linear-gradient(135deg,#f59e0b,#ef4444);border-radius:12px;text-align:center;line-height:48px;font-size:22px;">📬</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- Alert Banner -->
                <tr>
                    <td style="background:rgba(245,158,11,0.08);border-left:1px solid #334155;border-right:1px solid #334155;border-top:1px solid rgba(245,158,11,0.2);padding:16px 40px;">
                        <p style="margin:0;font-size:14px;font-weight:600;color:#fbbf24;">
                            📋 A new client contact request has been submitted through the website form.
                        </p>
                    </td>
                </tr>

                <!-- Body -->
                <tr>
                    <td style="background:#1e293b;padding:28px 40px 36px;border-left:1px solid #334155;border-right:1px solid #334155;">

                        <!-- Client Details -->
                        <span style="display:block;font-size:10px;text-transform:uppercase;letter-spacing:2px;font-weight:700;color:#475569;margin-bottom:16px;">Client Information</span>

                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border:1px solid #334155;border-radius:12px;overflow:hidden;margin-bottom:24px;">
                            <!-- Name -->
                            <tr>
                                <td style="padding:14px 20px;border-bottom:1px solid #1e293b;font-size:12px;color:#64748b;width:120px;">Name</td>
                                <td style="padding:14px 20px;border-bottom:1px solid #1e293b;font-size:14px;font-weight:700;color:#f1f5f9;">{{ $inquiry->name }}</td>
                            </tr>
                            <!-- Email -->
                            <tr>
                                <td style="padding:14px 20px;border-bottom:1px solid #1e293b;font-size:12px;color:#64748b;">Email</td>
                                <td style="padding:14px 20px;border-bottom:1px solid #1e293b;">
                                    <a href="mailto:{{ $inquiry->email }}" style="font-size:14px;color:#818cf8;text-decoration:none;font-weight:500;">{{ $inquiry->email }}</a>
                                </td>
                            </tr>
                            @if(!empty($inquiry->phone))
                            <!-- Phone -->
                            <tr>
                                <td style="padding:14px 20px;border-bottom:1px solid #1e293b;font-size:12px;color:#64748b;">Phone</td>
                                <td style="padding:14px 20px;border-bottom:1px solid #1e293b;">
                                    <a href="tel:{{ $inquiry->phone }}" style="font-size:14px;color:#94a3b8;text-decoration:none;">{{ $inquiry->phone }}</a>
                                </td>
                            </tr>
                            @endif
                            <!-- Subject -->
                            <tr>
                                <td style="padding:14px 20px;border-bottom:1px solid #1e293b;font-size:12px;color:#64748b;">Subject</td>
                                <td style="padding:14px 20px;border-bottom:1px solid #1e293b;font-size:14px;font-weight:600;color:#f1f5f9;">{{ $inquiry->subject ?: 'General Inquiry' }}</td>
                            </tr>
                            <!-- Submitted At -->
                            <tr>
                                <td style="padding:14px 20px;font-size:12px;color:#64748b;">Submitted</td>
                                <td style="padding:14px 20px;font-size:13px;color:#94a3b8;">{{ $inquiry->created_at ? $inquiry->created_at->format('M d, Y · h:i A') : now()->format('M d, Y · h:i A') }}</td>
                            </tr>
                        </table>

                        <!-- Message -->
                        <span style="display:block;font-size:10px;text-transform:uppercase;letter-spacing:2px;font-weight:700;color:#475569;margin-bottom:12px;">Client Message</span>
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                            <tr>
                                <td style="background:#0f172a;border:1px solid #334155;border-left:4px solid #f59e0b;border-radius:0 10px 10px 0;padding:20px 24px;font-size:14px;color:#cbd5e1;line-height:1.8;white-space:pre-line;">{{ $inquiry->message }}</td>
                            </tr>
                        </table>

                        <!-- Action Buttons -->
                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                                <td align="center">
                                    <table role="presentation" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td style="border-radius:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);margin-right:8px;">
                                                <a href="mailto:{{ $inquiry->email }}?subject=Re:%20{{ urlencode($inquiry->subject ?: 'Your Inquiry at NestifyTech') }}" style="display:inline-block;padding:13px 28px;font-size:13px;font-weight:700;color:#ffffff;text-decoration:none;">
                                                    Reply to {{ $inquiry->name }} →
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>

                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td style="background:#0f172a;border:1px solid #334155;border-top:none;border-radius:0 0 12px 12px;padding:20px 40px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td>
                                    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#94a3b8;">{{ config('app.name', 'NestifyTech') }}</p>
                                    <p style="margin:0;font-size:11px;color:#475569;">© {{ date('Y') }} All rights reserved.</p>
                                </td>
                                <td align="right">
                                    <p style="margin:0;font-size:11px;color:#334155;">Automated · Support Desk<br>IP: {{ $inquiry->ip_address ?? 'N/A' }}</p>
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
