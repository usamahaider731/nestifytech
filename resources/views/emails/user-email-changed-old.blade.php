<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Alert - Email Changed</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.6;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                    <!-- Brand Header -->
                    <tr>
                        <td style="padding: 28px 32px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); text-align: center; border-bottom: 3px solid #f43f5e;">
                            <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">
                                {{ config('app.name', 'NestifyTech') }}
                            </h1>
                            <p style="margin: 4px 0 0; font-size: 12px; color: #fda4af; text-transform: uppercase; letter-spacing: 1px;">
                                Security Notification
                            </p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 36px 32px 24px;">
                            <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #0f172a;">
                                Hello {{ $user->name ?? 'Valued Customer' }},
                            </h2>
                            <p style="margin: 0 0 20px; font-size: 14px; color: #475569;">
                                This is an automated security alert to inform you that your account email address has recently been changed.
                            </p>

                            <!-- Change details card -->
                            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
                                <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px;">
                                    <tr>
                                        <td style="padding: 6px 0; color: #64748b; width: 35%;"><strong>Previous Email:</strong></td>
                                        <td style="padding: 6px 0; color: #0f172a; font-family: monospace;">{{ $oldEmail }}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 6px 0; color: #64748b;"><strong>New Email:</strong></td>
                                        <td style="padding: 6px 0; color: #0f172a; font-family: monospace; font-weight: 600;">{{ $newEmail }}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 6px 0; color: #64748b;"><strong>Date & Time:</strong></td>
                                        <td style="padding: 6px 0; color: #0f172a;">{{ now()->toDayDateTimeString() }}</td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Alert Box -->
                            <div style="background-color: #fff1f2; border-left: 4px solid #f43f5e; padding: 14px 16px; border-radius: 4px; margin: 24px 0;">
                                <p style="margin: 0; font-size: 13px; color: #9f1239; line-height: 1.5;">
                                    <strong>Did not authorize this change?</strong><br>
                                    If you did not perform this update, someone else may have gained access to your account. Please reset your password immediately or reach out to our support team.
                                </p>
                            </div>

                            <div style="text-align: center; margin-top: 28px;">
                                <a href="{{ route('login') }}" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 12px 28px; border-radius: 6px;">
                                    Go to My Account
                                </a>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
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
