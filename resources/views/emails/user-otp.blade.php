<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Verification Code – {{ config('app.name', 'NestifyTech') }}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:0;">
    <tr>
        <td align="center" style="padding:40px 16px 48px;">

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

                <!-- Top accent bar -->
                <tr>
                    @if($action === 'delete_account')
                    <td style="height:4px;background:linear-gradient(90deg,#ef4444 0%,#f97316 100%);border-radius:12px 12px 0 0;"></td>
                    @else
                    <td style="height:4px;background:linear-gradient(90deg,#6366f1 0%,#06b6d4 100%);border-radius:12px 12px 0 0;"></td>
                    @endif
                </tr>

                <!-- Header -->
                <tr>
                    <td style="background:#1e293b;padding:36px 40px 28px;border-left:1px solid #334155;border-right:1px solid #334155;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td>
                                    @if($action === 'delete_account')
                                    <div style="display:inline-block;background:linear-gradient(135deg,#ef4444,#f97316);border-radius:10px;padding:8px 14px;margin-bottom:16px;">
                                        <span style="font-size:12px;font-weight:700;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">⚠️ Account Deletion</span>
                                    </div>
                                    @elseif($action === 'change_email')
                                    <div style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#6366f1);border-radius:10px;padding:8px 14px;margin-bottom:16px;">
                                        <span style="font-size:12px;font-weight:700;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">Email Change</span>
                                    </div>
                                    @else
                                    <div style="display:inline-block;background:linear-gradient(135deg,#6366f1,#06b6d4);border-radius:10px;padding:8px 14px;margin-bottom:16px;">
                                        <span style="font-size:12px;font-weight:700;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">🔐 Verification</span>
                                    </div>
                                    @endif
                                    <h1 style="margin:0;font-size:26px;font-weight:800;color:#f1f5f9;line-height:1.2;letter-spacing:-0.5px;">{{ config('app.name', 'NestifyTech') }}</h1>
                                    <p style="margin:6px 0 0;font-size:13px;color:#64748b;">Secure Identity Verification</p>
                                </td>
                                <td align="right" valign="top">
                                    @if($action === 'delete_account')
                                    <div style="width:48px;height:48px;background:linear-gradient(135deg,#ef4444,#f97316);border-radius:12px;text-align:center;line-height:48px;font-size:22px;">🗑️</div>
                                    @else
                                    <div style="width:48px;height:48px;background:linear-gradient(135deg,#6366f1,#06b6d4);border-radius:12px;text-align:center;line-height:48px;font-size:22px;">🔐</div>
                                    @endif
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- Body -->
                <tr>
                    <td style="background:#1e293b;padding:0 40px 36px;border-left:1px solid #334155;border-right:1px solid #334155;">

                        <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#f1f5f9;">Hello, {{ $user->name ?? 'Valued Customer' }} 👋</p>

                        @if($action === 'delete_account')
                        <p style="margin:0 0 28px;font-size:14px;color:#94a3b8;line-height:1.7;">
                            We received a request to <strong style="color:#fca5a5;">permanently delete your account</strong>. Use the one-time code below to confirm this critical action.
                        </p>
                        @elseif($action === 'change_email')
                        <p style="margin:0 0 28px;font-size:14px;color:#94a3b8;line-height:1.7;">
                            You requested to <strong style="color:#fde68a;">update your account email address</strong>. Use the verification code below to authorize this change.
                        </p>
                        @else
                        <p style="margin:0 0 28px;font-size:14px;color:#94a3b8;line-height:1.7;">
                            Use the one-time verification code below to <strong style="color:#a5b4fc;">complete your identity verification</strong>. This code is valid for a limited time only.
                        </p>
                        @endif

                        <!-- OTP Code Box -->
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                            <tr>
                                <td style="background:#0f172a;border:2px dashed #334155;border-radius:16px;padding:32px 24px;text-align:center;">
                                    <span style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:3px;font-weight:700;color:#475569;margin-bottom:16px;">Your One-Time Code</span>
                                    <div style="font-size:48px;font-weight:900;letter-spacing:12px;color:#f1f5f9;font-family:'Courier New',Courier,monospace;line-height:1;">{{ $otp }}</div>
                                    <span style="display:block;font-size:12px;color:#64748b;margin-top:16px;">
                                        Valid for <strong style="color:#94a3b8;">{{ $minutes ?? 10 }} minutes</strong>
                                    </span>
                                </td>
                            </tr>
                        </table>

                        <!-- Warning / Security tip -->
                        @if($action === 'delete_account')
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-left:4px solid #ef4444;border-radius:0 10px 10px 0;padding:16px 20px;">
                                    <p style="margin:0;font-size:13px;color:#fca5a5;line-height:1.6;">
                                        <strong>⚠️ Warning:</strong> This action is <strong>irreversible</strong>. It will permanently erase your order history, saved addresses, and profile data. If you did NOT request this, change your password immediately.
                                    </p>
                                </td>
                            </tr>
                        </table>
                        @else
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-left:4px solid #6366f1;border-radius:0 10px 10px 0;padding:16px 20px;">
                                    <p style="margin:0;font-size:13px;color:#a5b4fc;line-height:1.6;">
                                        🔒 <strong>Security Tip:</strong> Never share this code with anyone. {{ config('app.name', 'NestifyTech') }} support will never ask for your verification code.
                                    </p>
                                </td>
                            </tr>
                        </table>
                        @endif

                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td style="background:#0f172a;border:1px solid #334155;border-top:none;border-radius:0 0 12px 12px;padding:24px 40px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td>
                                    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#94a3b8;">{{ config('app.name', 'NestifyTech') }}</p>
                                    <p style="margin:0;font-size:12px;color:#475569;">If you didn't request this, ignore this email safely.</p>
                                </td>
                                <td align="right">
                                    <p style="margin:0;font-size:11px;color:#334155;">© {{ date('Y') }} {{ config('app.name', 'NestifyTech') }}<br>All rights reserved.</p>
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
