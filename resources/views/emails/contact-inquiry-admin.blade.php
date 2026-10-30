<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Request - {{ config('app.name', 'NestifyTech') }}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.6;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 28px 32px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); text-align: left; border-bottom: 3px solid #6366f1;">
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <div>
                                    <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff;">
                                        {{ config('app.name', 'NestifyTech') }}
                                    </h1>
                                    <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">
                                        Client Contact Request
                                    </p>
                                </div>
                            </div>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 32px;">
                            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 6px; margin-bottom: 24px;">
                                <p style="margin: 0; font-size: 13px; color: #1e40af; font-weight: 600;">
                                    📬 You have received a new customer inquiry from the website contact form.
                                </p>
                            </div>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; width: 140px; font-size: 13px; font-weight: 600; color: #64748b;">
                                        Sender Name:
                                    </td>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; font-weight: 600; color: #0f172a;">
                                        {{ $inquiry->name }}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #64748b;">
                                        Email Address:
                                    </td>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #2563eb;">
                                        <a href="mailto:{{ $inquiry->email }}" style="color: #2563eb; text-decoration: none; font-weight: 500;">
                                            {{ $inquiry->email }}
                                        </a>
                                    </td>
                                </tr>
                                @if(!empty($inquiry->phone))
                                <tr>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #64748b;">
                                        Phone Number:
                                    </td>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #0f172a;">
                                        <a href="tel:{{ $inquiry->phone }}" style="color: #0f172a; text-decoration: none;">
                                            {{ $inquiry->phone }}
                                        </a>
                                    </td>
                                </tr>
                                @endif
                                <tr>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #64748b;">
                                        Subject / Topic:
                                    </td>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; font-weight: 600; color: #0f172a;">
                                        {{ $inquiry->subject ?: 'General Inquiry' }}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #64748b;">
                                        Submitted At:
                                    </td>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">
                                        {{ $inquiry->created_at ? $inquiry->created_at->format('M d, Y h:i A') : now()->format('M d, Y h:i A') }}
                                    </td>
                                </tr>
                            </table>

                            <h3 style="margin: 0 0 10px; font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                                Client Message
                            </h3>
                            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; font-size: 14px; color: #334155; white-space: pre-line; line-height: 1.6;">
                                {{ $inquiry->message }}
                            </div>

                            <div style="margin-top: 28px; text-align: center;">
                                <a href="mailto:{{ $inquiry->email }}?subject=Re:%20{{ urlencode($inquiry->subject ?: 'Your inquiry at NestifyTech') }}" style="display: inline-block; background-color: #6366f1; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none; box-shadow: 0 2px 4px rgba(99, 102, 241, 0.3);">
                                    Reply Directly to {{ $inquiry->name }}
                                </a>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                            <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                                Automated message dispatched by {{ config('app.name', 'NestifyTech') }} Support Desk • IP: {{ $inquiry->ip_address ?? 'N/A' }}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
