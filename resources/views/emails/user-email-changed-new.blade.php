<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Email Address Updated – {{ config('app.name', 'NestifyTech') }}</title>
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
                                        <span style="font-size:12px;font-weight:700;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">✅ Email Updated</span>
                                    </div>
                                    <h1 style="margin:0;font-size:26px;font-weight:800;color:#f1f5f9;line-height:1.2;letter-spacing:-0.5px;">{{ config('app.name', 'NestifyTech') }}</h1>
                                    <p style="margin:6px 0 0;font-size:13px;color:#64748b;">Account Security Notification</p>
                                </td>
                                <td align="right" valign="top">
                                    <div style="width:48px;height:48px;background:linear-gradient(135deg,#10b981,#06b6d4);border-radius:12px;text-align:center;line-height:48px;font-size:22px;">📧</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- Body -->
                <tr>
                    <td style="background:#1e293b;padding:0 40px 36px;border-left:1px solid #334155;border-right:1px solid #334155;">

                        <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#f1f5f9;">Hello, {{ $user->name ?? 'Valued Customer' }} 👋</p>
                        <p style="margin:0 0 28px;font-size:14px;color:#94a3b8;line-height:1.7;">
                            Your email address on <strong style="color:#6ee7b7;">{{ config('app.name', 'NestifyTech') }}</strong> has been <strong style="color:#f1f5f9;">successfully updated</strong>.
                        </p>

                        <!-- Change Details -->
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border:1px solid #334155;border-radius:12px;overflow:hidden;margin-bottom:24px;">
                            <tr>
                                <td style="padding:14px 20px;border-bottom:1px solid #1e293b;font-size:12px;color:#64748b;width:120px;">New Email</td>
                                <td style="padding:14px 20px;border-bottom:1px solid #1e293b;font-size:14px;font-weight:700;color:#34d399;font-family:monospace;">{{ $newEmail }}</td>
                            </tr>
                            <tr>
                                <td style="padding:14px 20px;border-bottom:1px solid #1e293b;font-size:12px;color:#64748b;">Previous</td>
                                <td style="padding:14px 20px;border-bottom:1px solid #1e293b;font-size:13px;color:#64748b;font-family:monospace;">{{ $oldEmail }}</td>
                            </tr>
                            <tr>
                                <td style="padding:14px 20px;font-size:12px;color:#64748b;">Updated On</td>
                                <td style="padding:14px 20px;font-size:13px;color:#94a3b8;">{{ now()->toDayDateTimeString() }}</td>
                            </tr>
                        </table>

                        <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;line-height:1.7;">
                            You can now use <strong style="color:#6ee7b7;">{{ $newEmail }}</strong> to sign in and receive all account, order, and security updates.
                        </p>

                        <!-- CTA -->
                        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                            <tr>
                                <td style="border-radius:10px;background:linear-gradient(135deg,#10b981,#06b6d4);">
                                    <a href="{{ route('profile.index') }}" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">
                                        View Your Profile →
                                    </a>
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
