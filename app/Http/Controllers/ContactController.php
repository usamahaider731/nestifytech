<?php

namespace App\Http\Controllers;

use App\Mail\ContactInquiryAdminMail;
use App\Mail\ContactInquiryAutoReplyMail;
use App\Mail\ContactInquiryAdminReplyMail;
use App\Models\ContactInquiry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;

class ContactController extends Controller
{
    /**
     * Submit client contact inquiry form.
     */
    public function submit(Request $request)
    {
        // 1. Spam bot honeypot protection (hidden field)
        if ($request->filled('website_hp')) {
            return back()->with('success', 'Thank you! Your message has been sent successfully.');
        }

        // 2. Rate limiting by IP: maximum 5 contact form submissions every 15 minutes
        $throttleKey = 'contact_submit:' . $request->ip();
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return back()->withErrors([
                'rate_limit' => "You have submitted multiple messages recently. Please wait {$seconds} seconds before trying again.",
            ]);
        }
        RateLimiter::hit($throttleKey, 900);

        // 3. Validation
        $validated = $request->validate([
            'name'    => ['required', 'string', 'max:100'],
            'email'   => ['required', 'email:rfc,dns', 'max:150'],
            'phone'   => ['nullable', 'string', 'max:30'],
            'subject' => ['nullable', 'string', 'max:150'],
            'message' => ['required', 'string', 'min:10', 'max:3000'],
        ], [
            'name.required'    => 'Please enter your full name.',
            'email.required'   => 'Please provide a valid email address.',
            'email.email'      => 'Please provide a valid email address.',
            'message.required' => 'Please write your message or inquiry.',
            'message.min'      => 'Message must be at least 10 characters long.',
        ]);

        // 4. Auto-detect priority from keywords
        $priority = 'normal';
        $text = strtolower(($validated['message'] ?? '') . ' ' . ($validated['subject'] ?? ''));
        foreach (['urgent', 'asap', 'immediately', 'emergency', 'critical'] as $kw) {
            if (str_contains($text, $kw)) { $priority = 'urgent'; break; }
        }

        // 5. Save into database
        $inquiry = ContactInquiry::create([
            'name'       => trim($validated['name']),
            'email'      => strtolower(trim($validated['email'])),
            'phone'      => $validated['phone'] ? trim($validated['phone']) : null,
            'subject'    => $validated['subject'] ? trim($validated['subject']) : null,
            'message'    => trim($validated['message']),
            'status'     => 'new',
            'priority'   => $priority,
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 500),
        ]);

        // 6. Send emails
        $settingFile = storage_path('app/data/setting.json');
        $settings    = File::exists($settingFile) ? json_decode(File::get($settingFile), true) : [];
        $mailConfig  = $settings['mail'] ?? [];
        $siteConfig  = $settings['site'] ?? [];

        $adminRecipient = $mailConfig['contact_recipient_email']['value']
            ?? $siteConfig['email']['value']
            ?? $mailConfig['mail_from_address']['value']
            ?? config('mail.from.address', 'info@nestifytech.com');

        $mailEnabled      = filter_var($mailConfig['mail_enabled']['value'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $autoReplyEnabled = filter_var($mailConfig['contact_autoreply_enabled']['value'] ?? true, FILTER_VALIDATE_BOOLEAN);

        if ($mailEnabled) {
            try { Mail::to($adminRecipient)->send(new ContactInquiryAdminMail($inquiry)); } catch (\Throwable $e) {
                Log::error('Admin mail failed: ' . $e->getMessage(), ['inquiry_id' => $inquiry->id]);
            }
            if ($autoReplyEnabled) {
                try { Mail::to($inquiry->email)->send(new ContactInquiryAutoReplyMail($inquiry)); } catch (\Throwable $e) {
                    Log::error('Auto-reply failed: ' . $e->getMessage(), ['inquiry_id' => $inquiry->id]);
                }
            }
        }

        return back()->with('success', 'Thank you for contacting us! Your inquiry has been submitted and our team will get back to you shortly.');
    }

    /**
     * Admin view for incoming contact inquiries.
     */
    public function adminIndex(Request $request)
    {
        $query = ContactInquiry::query();

        if ($request->filled('search')) {
            $s = trim($request->search);
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%")
                  ->orWhere('subject', 'like', "%{$s}%")
                  ->orWhere('phone', 'like', "%{$s}%")
                  ->orWhere('message', 'like', "%{$s}%");
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('priority') && $request->priority !== 'all') {
            $query->where('priority', $request->priority);
        }

        if ($request->starred === 'true') {
            $query->where('is_starred', true);
        }

        // Urgent first, then by newest
        $query->orderByRaw("CASE priority WHEN 'urgent' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END")
              ->orderBy('id', 'desc');

        $inquiries = $query->paginate(15)->withQueryString();

        $stats = [
            'total'    => ContactInquiry::count(),
            'new'      => ContactInquiry::where('status', 'new')->count(),
            'read'     => ContactInquiry::where('status', 'read')->count(),
            'replied'  => ContactInquiry::where('status', 'replied')->count(),
            'archived' => ContactInquiry::where('status', 'archived')->count(),
            'urgent'   => ContactInquiry::where('priority', 'urgent')->whereIn('status', ['new', 'read'])->count(),
            'starred'  => ContactInquiry::where('is_starred', true)->count(),
        ];

        $settingFile     = storage_path('app/data/setting.json');
        $settings        = File::exists($settingFile) ? json_decode(File::get($settingFile), true) : [];
        $mailConfig      = $settings['mail'] ?? [];
        $contactSettings = [
            'recipient_email'   => $mailConfig['contact_recipient_email']['value'] ?? ($settings['site']['email']['value'] ?? 'support@nestifytech.com'),
            'autoreply_enabled' => filter_var($mailConfig['contact_autoreply_enabled']['value'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'mail_enabled'      => filter_var($mailConfig['mail_enabled']['value'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'mail_host'         => $mailConfig['mail_host']['value'] ?? 'Not set',
            'mail_from_address' => $mailConfig['mail_from_address']['value'] ?? 'noreply@nestifytech.com',
        ];

        return Inertia::render('Admin/Contact/Index', [
            'inquiries'       => $inquiries,
            'stats'           => $stats,
            'filters'         => $request->only(['search', 'status', 'priority', 'starred']),
            'contactSettings' => $contactSettings,
        ]);
    }

    /**
     * Admin update inquiry (status, notes, reply, priority, star, assigned_to).
     */
    public function adminUpdate(Request $request, $id)
    {
        $inquiry  = ContactInquiry::findOrFail($id);
        $validated = $request->validate([
            'status'      => ['required', 'in:new,read,replied,archived'],
            'admin_notes' => ['nullable', 'string', 'max:2000'],
            'admin_reply' => ['nullable', 'string', 'max:5000'],
            'priority'    => ['nullable', 'in:low,normal,urgent'],
            'is_starred'  => ['nullable', 'boolean'],
            'assigned_to' => ['nullable', 'string', 'max:150'],
        ]);

        $data = [
            'status'      => $validated['status'],
            'admin_notes' => $validated['admin_notes'] ?? $inquiry->admin_notes,
            'admin_reply' => $validated['admin_reply'] ?? $inquiry->admin_reply,
            'priority'    => $validated['priority'] ?? ($inquiry->priority ?? 'normal'),
            'is_starred'  => $validated['is_starred'] ?? $inquiry->is_starred,
            'assigned_to' => $validated['assigned_to'] ?? $inquiry->assigned_to,
        ];

        if ($validated['status'] === 'replied' && !$inquiry->replied_at) {
            $data['replied_at'] = now();
        }

        $inquiry->update($data);

        // Send reply email to customer if admin_reply was filled
        if (!empty($validated['admin_reply'])) {
            $emailResult = $this->sendAdminReplyEmail($inquiry, $validated['admin_reply']);
            if (!$emailResult['success']) {
                return back()->with('warning', 'Inquiry updated, but email sending failed: ' . $emailResult['error']);
            }
        }

        return back()->with('success', 'Inquiry updated and reply email sent successfully.');
    }

    /**
     * Send reply email from admin to customer.
     */
    protected function sendAdminReplyEmail(ContactInquiry $inquiry, string $replyText): array
    {
        $settingFile = storage_path('app/data/setting.json');
        $settings    = File::exists($settingFile) ? json_decode(File::get($settingFile), true) : [];
        $mailConfig  = $settings['mail'] ?? [];
        $siteConfig  = $settings['site'] ?? [];
        $mailEnabled = filter_var($mailConfig['mail_enabled']['value'] ?? true, FILTER_VALIDATE_BOOLEAN);

        if (!$mailEnabled) {
            Log::info("Admin reply skipped: mail_enabled is false in settings.");
            return ['success' => false, 'error' => 'Mail is disabled in settings.'];
        }

        // Apply dynamically configured SMTP directly to ensure transport freshness
        if (!empty($mailConfig['mail_host']['value'])) {
            config([
                'mail.default' => 'smtp',
                'mail.mailers.smtp.host' => $mailConfig['mail_host']['value'] ?? 'smtp.gmail.com',
                'mail.mailers.smtp.port' => (int) ($mailConfig['mail_port']['value'] ?? 587),
                'mail.mailers.smtp.username' => $mailConfig['mail_username']['value'] ?? '',
                'mail.mailers.smtp.password' => $mailConfig['mail_password']['value'] ?? '',
                'mail.mailers.smtp.encryption' => ($mailConfig['mail_encryption']['value'] ?? 'tls') === 'none' ? null : ($mailConfig['mail_encryption']['value'] ?? 'tls'),
                'mail.mailers.smtp.scheme' => null,
            ]);
        }

        // Purge any stale mailer instance cached in the Laravel container
        try {
            app()->forgetInstance('mailer');
            Mail::clearResolvedInstances();
        } catch (\Throwable $e) {}

        $fromName    = $siteConfig['name']['value'] ?? ($mailConfig['mail_from_name']['value'] ?? config('mail.from.name', 'NestifyTech Support'));
        $fromAddress = $mailConfig['mail_from_address']['value'] ?? config('mail.from.address', 'usamahaiderkhokher@gmail.com');

        try {
            Mail::mailer('smtp')->to($inquiry->email, $inquiry->name)->send(
                new ContactInquiryAdminReplyMail($inquiry, $replyText, $fromName, $fromAddress)
            );
            Log::info("Admin reply sent successfully to {$inquiry->email} for inquiry #{$inquiry->id}");
            return ['success' => true, 'error' => null];
        } catch (\Throwable $e) {
            Log::error('Admin reply email failed: ' . $e->getMessage(), [
                'inquiry_id' => $inquiry->id,
                'email'      => $inquiry->email,
                'exception'  => $e,
            ]);
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Toggle starred status (AJAX).
     */
    public function adminToggleStar($id)
    {
        $inquiry = ContactInquiry::findOrFail($id);
        $inquiry->update(['is_starred' => !$inquiry->is_starred]);

        return response()->json(['status' => 'success', 'is_starred' => $inquiry->is_starred]);
    }

    /**
     * Bulk actions on selected inquiries.
     */
    public function adminBulkAction(Request $request)
    {
        $validated = $request->validate([
            'action' => ['required', 'in:mark_read,mark_replied,archive,delete,mark_starred,mark_unstarred'],
            'ids'    => ['required', 'array', 'min:1'],
            'ids.*'  => ['integer'],
        ]);

        $ids    = $validated['ids'];
        $count  = count($ids);

        switch ($validated['action']) {
            case 'mark_read':
                ContactInquiry::whereIn('id', $ids)->update(['status' => 'read']);
                $msg = "{$count} inquiries marked as read.";
                break;
            case 'mark_replied':
                ContactInquiry::whereIn('id', $ids)->update(['status' => 'replied', 'replied_at' => now()]);
                $msg = "{$count} inquiries marked as replied.";
                break;
            case 'archive':
                ContactInquiry::whereIn('id', $ids)->update(['status' => 'archived']);
                $msg = "{$count} inquiries archived.";
                break;
            case 'mark_starred':
                ContactInquiry::whereIn('id', $ids)->update(['is_starred' => true]);
                $msg = "{$count} inquiries starred.";
                break;
            case 'mark_unstarred':
                ContactInquiry::whereIn('id', $ids)->update(['is_starred' => false]);
                $msg = "{$count} inquiries unstarred.";
                break;
            case 'delete':
                ContactInquiry::whereIn('id', $ids)->delete();
                $msg = "{$count} inquiries deleted.";
                break;
            default:
                $msg = 'Bulk action completed.';
        }

        return back()->with('success', $msg);
    }

    /**
     * Export inquiries as CSV download.
     */
    public function adminExportCsv(Request $request)
    {
        $query = ContactInquiry::query();

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }
        if ($request->filled('priority') && $request->priority !== 'all') {
            $query->where('priority', $request->priority);
        }

        $inquiries = $query->orderBy('id', 'desc')->get();

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="contact_inquiries_' . now()->format('Y-m-d') . '.csv"',
            'Cache-Control'       => 'no-cache',
        ];

        $callback = function () use ($inquiries) {
            $handle = fopen('php://output', 'w');
            fputs($handle, "\xEF\xBB\xBF"); // UTF-8 BOM for Excel
            fputcsv($handle, ['ID', 'Name', 'Email', 'Phone', 'Subject', 'Message', 'Status', 'Priority', 'Starred', 'Assigned To', 'Admin Notes', 'Admin Reply', 'Replied At', 'Received At']);

            foreach ($inquiries as $inq) {
                fputcsv($handle, [
                    $inq->id,
                    $inq->name,
                    $inq->email,
                    $inq->phone ?? '',
                    $inq->subject ?? '',
                    $inq->message,
                    $inq->status,
                    $inq->priority ?? 'normal',
                    ($inq->is_starred ?? false) ? 'Yes' : 'No',
                    $inq->assigned_to ?? '',
                    $inq->admin_notes ?? '',
                    $inq->admin_reply ?? '',
                    $inq->replied_at?->format('Y-m-d H:i') ?? '',
                    $inq->created_at->format('Y-m-d H:i'),
                ]);
            }
            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Admin update contact email recipient and auto-reply configuration.
     */
    public function adminUpdateSettings(Request $request)
    {
        $validated = $request->validate([
            'recipient_email'   => ['required', 'email', 'max:150'],
            'autoreply_enabled' => ['required', 'boolean'],
        ]);

        $settingFile = storage_path('app/data/setting.json');
        $settings    = File::exists($settingFile) ? json_decode(File::get($settingFile), true) : [];

        if (!isset($settings['mail'])) $settings['mail'] = [];

        $settings['mail']['contact_recipient_email'] = array_merge(
            $settings['mail']['contact_recipient_email'] ?? [],
            ['label' => 'Contact Form Recipient Email', 'type' => 'text', 'value' => $validated['recipient_email']]
        );
        $settings['mail']['contact_autoreply_enabled'] = array_merge(
            $settings['mail']['contact_autoreply_enabled'] ?? [],
            ['label' => 'Send Confirmation Email to Customer', 'type' => 'checkbox', 'value' => (bool) $validated['autoreply_enabled']]
        );

        File::put($settingFile, json_encode($settings, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        return back()->with('success', 'Contact settings updated successfully.');
    }

    /**
     * Admin delete single inquiry.
     */
    public function adminDestroy($id)
    {
        ContactInquiry::findOrFail($id)->delete();
        return back()->with('success', 'Inquiry deleted successfully.');
    }

    /**
     * AI-Powered Inquiry Draft Reply and Analysis for Admin
     */
    public function generateAiReply(Request $request, $id)
    {
        $inquiry = ContactInquiry::findOrFail($id);
        $tone = $request->input('tone', 'professional');

        $settingFile = storage_path('app/data/setting.json');
        $settings = File::exists($settingFile) ? json_decode(File::get($settingFile), true) : [];
        $site = $settings['site'] ?? [];
        $aiSettings = $settings['ai'] ?? [];
        $storeName = $site['name']['value'] ?? 'NestifyTech';
        $contactEmail = $site['email']['value'] ?? 'support@nestifytech.com';

        $customerName = $inquiry->name ?: 'Valued Customer';
        $customerMsg = $inquiry->message;
        $subject = $inquiry->subject ?: 'Inquiry';

        $toneInstructions = match ($tone) {
            'apologetic'   => 'Empathize warmly, apologize for any inconvenience caused, and clearly explain the resolution or next steps.',
            'friendly'     => 'Warm, approachable, conversational yet polite and helpful.',
            'sales'        => 'Enthusiastic and commercial, highlighting product features, wholesale/bulk discounts, and inviting an order.',
            default        => 'Professional, concise, courteous, and solution-oriented.',
        };

        $systemPrompt = "You are an expert customer relations executive at {$storeName} e-commerce.
Draft a complete, ready-to-send email response to this customer inquiry.
Tone requirement: {$toneInstructions}

Store details:
- Store Name: {$storeName}
- Support Email: {$contactEmail}

Customer Details:
- Name: {$customerName}
- Subject: {$subject}
- Customer Message: \"{$customerMsg}\"

Formatting Instructions:
- Start with a polite greeting (e.g. 'Dear {$customerName},').
- Directly address their specific questions or concerns with practical assistance.
- Conclude with a professional sign-off with {$storeName} Support Team.
- Do NOT output placeholder brackets like [Your Name] — output actual professional closing.";

        $platform = $aiSettings['ai_platform']['value'] ?? 'groq';
        $apiKey   = $aiSettings['api_key']['value'] ?? env('AI_API_KEY', env('GROQ_API_KEY', env('OPENROUTER_API_KEY')));

        if (!empty($apiKey)) {
            $endpoint = match ($platform) {
                'openai'          => 'https://api.openai.com/v1/chat/completions',
                'groq'            => 'https://api.groq.com/openai/v1/chat/completions',
                'openrouter'      => 'https://openrouter.ai/api/v1/chat/completions',
                'experientiallabs'=> 'https://api.experientiallabs.ai/v1/chat/completions',
                default           => 'https://api.groq.com/openai/v1/chat/completions',
            };

            $messages = [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => "Generate the draft response now for {$customerName}."],
            ];

            $model = $aiSettings['model']['value'] ?? ($platform === 'openai' ? 'gpt-4o-mini' : 'qwen/qwen3.8-27b');

            try {
                $response = \Illuminate\Support\Facades\Http::timeout(15)
                    ->connectTimeout(5)
                    ->withToken($apiKey)
                    ->post($endpoint, [
                        'model'       => $model,
                        'messages'    => $messages,
                        'temperature' => 0.6,
                        'max_tokens'  => 600,
                    ]);

                if ($response->successful()) {
                    $aiDraft = trim((string) $response->json('choices.0.message.content', ''));
                    if ($aiDraft !== '') {
                        return response()->json([
                            'success'   => true,
                            'reply'     => $aiDraft,
                            'source'    => 'ai',
                            'sentiment' => $this->detectSentiment($customerMsg),
                        ]);
                    }
                }
            } catch (\Throwable $e) {
                // fallback to autonomous rule engine
            }
        }

        // Autonomous Fallback Generator
        $fallbackReply = "Dear {$customerName},\n\n"
            . "Thank you for reaching out to {$storeName} regarding \"{$subject}\".\n\n"
            . "We have received your message and our support team has carefully reviewed your inquiry: \"{$customerMsg}\".\n\n";

        if ($tone === 'apologetic') {
            $fallbackReply .= "We sincerely apologize for any inconvenience you may have experienced. We are actively investigating this matter to ensure a quick and satisfactory resolution for you.\n\n";
        } elseif ($tone === 'sales') {
            $fallbackReply .= "We are delighted by your interest in our products. We offer competitive rates, verified authenticity, and dedicated customer service for all orders.\n\n";
        } else {
            $fallbackReply .= "We are pleased to assist you with this request and ensure you have an exceptional shopping experience with us.\n\n";
        }

        $fallbackReply .= "Should you have any additional details or tracking references to share, please reply directly to this email or reach us at {$contactEmail}.\n\n"
            . "Warm regards,\n"
            . "{$storeName} Customer Support Team";

        return response()->json([
            'success'   => true,
            'reply'     => $fallbackReply,
            'source'    => 'autonomous_engine',
            'sentiment' => $this->detectSentiment($customerMsg),
        ]);
    }

    protected function detectSentiment(string $text): string
    {
        $lower = strtolower($text);
        if (preg_match('/(angry|worst|terrible|broken|fraud|scam|hate|damaged|refund|stolen|cheat)/', $lower)) {
            return 'Urgent / Negative';
        }
        if (preg_match('/(thank|great|love|awesome|good|excellent|appreciate|best)/', $lower)) {
            return 'Positive / Complimentary';
        }
        if (preg_match('/(track|order|status|where|deliver|delay|late|when)/', $lower)) {
            return 'Order Status Inquiry';
        }
        if (preg_match('/(price|quote|bulk|wholesale|discount|buy|quantity)/', $lower)) {
            return 'Sales / Bulk Quote';
        }
        return 'General Inquiry';
    }
}
