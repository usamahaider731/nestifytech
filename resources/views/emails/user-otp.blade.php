<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Code - {{ config('app.name', 'NestifyTech') }}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.6;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0;">
                    <!-- Brand Header -->
                    <tr>
                        <td style="padding: 28px 32px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); text-align: center; border-bottom: 3px solid #6366f1;">
                            <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">
                                {{ config('app.name', 'NestifyTech') }}
                            </h1>
                            <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">
                                Secure Verification
                            </p>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 36px 32px 24px;">
                            <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #0f172a;">
                                Hello {{ $user->name ?? 'Valued Customer' }},
                            </h2>

                            @if($action === 'delete_account')
                                <p style="margin: 0 0 20px; font-size: 14px; color: #475569;">
                                    We received a request to <strong style="color: #e11d48;">permanently delete your account</strong>. To confirm this critical security action, please use the one-time verification code below:
                                </p>
                            @elseif($action === 'change_email')
                                <p style="margin: 0 0 20px; font-size: 14px; color: #475569;">
                                    You requested to update your account email address. Use the verification code below to authorize this change:
                                </p>
                            @else
                                <p style="margin: 0 0 20px; font-size: 14px; color: #475569;">
                                    Please use the one-time verification code below to complete your identity verification:
                                </p>
                            @endif

                            <!-- OTP Box -->
                            <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 10px; padding: 24px 16px; text-align: center; margin: 24px 0;">
                                <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; color: #64748b; margin-bottom: 8px;">
                                    Your One-Time Code
                                </span>
                                <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0f172a; font-family: 'Courier New', Courier, monospace;">
                                    {{ $otp }}
                                </div>
                                <span style="display: block; font-size: 12px; color: #64748b; margin-top: 10px;">
                                    Valid for <strong>{{ $minutes ?? 10 }} minutes</strong>
                                </span>
                            </div>

                            @if($action === 'delete_account')
                                <div style="background-color: #fff1f2; border-left: 4px solid #f43f5e; padding: 12px 16px; border-radius: 4px; margin: 20px 0;">
                                    <p style="margin: 0; font-size: 12px; color: #9f1239; font-weight: 500;">
                                        ⚠️ <strong>Warning:</strong> Deleting your account will permanently erase your order history, saved addresses, and profile data. If you did NOT request this, change your password immediately.
                                    </p>
                                </div>
                            @else
                                <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 4px; margin: 20px 0;">
                                    <p style="margin: 0; font-size: 12px; color: #1e40af;">
                                        🔒 <strong>Security Tip:</strong> Never share this code with anyone. Our support team will never ask for your verification code.
                                    </p>
                                </div>
                            @endif
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                            <p style="margin: 0 0 6px; font-size: 12px; color: #64748b;">
                                If you did not request this code, you can safely ignore this email.
                            </p>
                            <p style="margin: 0; font-size: 11px; color: #94a3b8;">
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
