<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thank You for Contacting {{ config('app.name', 'NestifyTech') }}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.6;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0;">
                    <!-- Brand Header -->
                    <tr>
                        <td style="padding: 28px 32px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); text-align: center; border-bottom: 3px solid #6366f1;">
                            <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">
                                {{ config('app.name', 'NestifyTech') }}
                            </h1>
                            <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">
                                Customer Support Center
                            </p>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 36px 32px 24px;">
                            <h2 style="margin: 0 0 14px; font-size: 18px; font-weight: 700; color: #0f172a;">
                                Hello {{ $inquiry->name }},
                            </h2>
                            <p style="margin: 0 0 16px; font-size: 14px; color: #475569;">
                                Thank you for getting in touch with us! We have received your message regarding <strong>"{{ $inquiry->subject ?: 'Your inquiry' }}"</strong>.
                            </p>
                            <p style="margin: 0 0 20px; font-size: 14px; color: #475569;">
                                A dedicated specialist from our team is reviewing your request and will follow up with you as soon as possible (usually within 12 to 24 business hours).
                            </p>

                            <!-- Inquiry summary box -->
                            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 24px 0;">
                                <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; color: #64748b; margin-bottom: 12px;">
                                    Summary of Your Submission
                                </span>
                                <div style="font-size: 13px; color: #334155; margin-bottom: 8px;">
                                    <strong>Reference ID:</strong> #INQ-{{ str_pad($inquiry->id, 5, '0', STR_PAD_LEFT) }}
                                </div>
                                <div style="font-size: 13px; color: #334155; margin-bottom: 8px;">
                                    <strong>Subject:</strong> {{ $inquiry->subject ?: 'General Request' }}
                                </div>
                                <div style="font-size: 13px; color: #334155;">
                                    <strong>Message:</strong>
                                    <p style="margin: 6px 0 0; font-style: italic; color: #64748b; white-space: pre-line;">
                                        "{{ Str::limit($inquiry->message, 300) }}"
                                    </p>
                                </div>
                            </div>

                            <p style="margin: 0 0 16px; font-size: 13px; color: #64748b;">
                                If your inquiry is urgent regarding an active order or quick assistance, you may also reply directly to this email or visit our website for 24/7 assistance.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                            <p style="margin: 0 0 6px; font-size: 12px; color: #64748b;">
                                Best regards,<br>
                                <strong>The {{ config('app.name', 'NestifyTech') }} Support Team</strong>
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
