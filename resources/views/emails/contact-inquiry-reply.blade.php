<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Response to Your Inquiry – {{ $fromName }}</title>
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
                                {{ $fromName }}
                            </h1>
                            <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">
                                Official Support Reply
                            </p>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 36px 32px 24px;">
                            <h2 style="margin: 0 0 14px; font-size: 18px; font-weight: 700; color: #0f172a;">
                                Hello {{ $inquiry->name }},
                            </h2>
                            <p style="margin: 0 0 18px; font-size: 14px; color: #475569;">
                                Our support team has reviewed your inquiry regarding <strong>"{{ $inquiry->subject ?: 'General Request' }}"</strong>. Here is our response:
                            </p>

                            <!-- Admin Reply Highlight Box -->
                            <div style="background-color: #f8fafc; border-left: 4px solid #6366f1; border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; border-radius: 0 10px 10px 0; padding: 20px; margin: 20px 0;">
                                <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; color: #6366f1; margin-bottom: 10px;">
                                    Message from Support Team
                                </span>
                                <div style="font-size: 14px; color: #1e293b; white-space: pre-line; line-height: 1.7;">
{!! nl2br(e($replyText)) !!}
                                </div>
                            </div>

                            <!-- Original Message Reference -->
                            <div style="background-color: #f1f5f9; border-radius: 8px; padding: 14px 18px; margin: 24px 0;">
                                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 600; margin-bottom: 6px;">
                                    Your Original Inquiry (Ref #INQ-{{ str_pad($inquiry->id, 5, '0', STR_PAD_LEFT) }})
                                </div>
                                <div style="font-size: 12px; color: #475569; font-style: italic;">
                                    "{{ Str::limit($inquiry->message, 250) }}"
                                </div>
                            </div>

                            <p style="margin: 20px 0 0; font-size: 13px; color: #64748b;">
                                Need more help? Simply reply directly to this email or visit our website.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                            <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                                &copy; {{ date('Y') }} {{ $fromName }}. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
