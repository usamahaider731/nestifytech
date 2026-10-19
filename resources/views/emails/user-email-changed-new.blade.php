<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Updated - {{ config('app.name', 'NestifyTech') }}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.6;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                    <!-- Brand Header -->
                    <tr>
                        <td style="padding: 28px 32px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); text-align: center; border-bottom: 3px solid #10b981;">
                            <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">
                                {{ config('app.name', 'NestifyTech') }}
                            </h1>
                            <p style="margin: 4px 0 0; font-size: 12px; color: #6ee7b7; text-transform: uppercase; letter-spacing: 1px;">
                                Email Address Updated
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
                                Your email address on <strong>{{ config('app.name', 'NestifyTech') }}</strong> has been successfully updated.
                            </p>

                            <!-- Success card -->
                            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 18px; margin: 20px 0;">
                                <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px;">
                                    <tr>
                                        <td style="padding: 6px 0; color: #15803d; width: 35%;"><strong>Active Email:</strong></td>
                                        <td style="padding: 6px 0; color: #0f172a; font-family: monospace; font-weight: 700;">{{ $newEmail }}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 6px 0; color: #64748b;"><strong>Previous Email:</strong></td>
                                        <td style="padding: 6px 0; color: #64748b; font-family: monospace;">{{ $oldEmail }}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 6px 0; color: #64748b;"><strong>Updated On:</strong></td>
                                        <td style="padding: 6px 0; color: #0f172a;">{{ now()->toDayDateTimeString() }}</td>
                                    </tr>
                                </table>
                            </div>

                            <p style="margin: 20px 0; font-size: 13px; color: #475569;">
                                You can now use <strong>{{ $newEmail }}</strong> to sign in and receive all account, order, and security updates.
                            </p>

                            <div style="text-align: center; margin-top: 28px;">
                                <a href="{{ route('profile.index') }}" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 12px 28px; border-radius: 6px;">
                                    View Your Profile
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
