<?php

namespace App\Http\Controllers;

use App\Mail\ContactInquiryAdminMail;
use App\Mail\ContactInquiryAutoReplyMail;
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
            // Silently pretend success to trick bots
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

        // 4. Save into database
        $inquiry = ContactInquiry::create([
            'name'       => trim($validated['name']),
            'email'      => strtolower(trim($validated['email'])),
            'phone'      => $validated['phone'] ? trim($validated['phone']) : null,
            'subject'    => $validated['subject'] ? trim($validated['subject']) : null,
            'message'    => trim($validated['message']),
            'status'     => 'new',
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 500),
        ]);

        // 5. Send dynamic emails according to Admin Email Settings
        $settingFile = storage_path('app/data/setting.json');
        $settings = File::exists($settingFile) ? json_decode(File::get($settingFile), true) : [];

        $mailConfig = $settings['mail'] ?? [];
        $siteConfig = $settings['site'] ?? [];

        // Determine destination admin email (priority: contact_recipient_email > site.email > mail_from_address)
        $adminRecipient = $mailConfig['contact_recipient_email']['value'] ?? null;
        if (empty($adminRecipient)) {
            $adminRecipient = $siteConfig['email']['value'] ?? null;
        }
        if (empty($adminRecipient)) {
            $adminRecipient = $mailConfig['mail_from_address']['value'] ?? null;
        }
        if (empty($adminRecipient)) {
            $adminRecipient = config('mail.from.address', 'info@nestifytech.com');
        }

        $mailEnabled = filter_var($mailConfig['mail_enabled']['value'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $autoReplyEnabled = filter_var($mailConfig['contact_autoreply_enabled']['value'] ?? true, FILTER_VALIDATE_BOOLEAN);

        if ($mailEnabled) {
            // Notify Admin / Support Inbox
            try {
                Mail::to($adminRecipient)->send(new ContactInquiryAdminMail($inquiry));
            } catch (\Throwable $e) {
                Log::error('Failed sending contact inquiry notification to admin: ' . $e->getMessage(), [
                    'recipient' => $adminRecipient,
                    'inquiry_id' => $inquiry->id,
                ]);
            }

            // Send confirmation auto-reply to client
            if ($autoReplyEnabled && !empty($inquiry->email)) {
                try {
                    Mail::to($inquiry->email)->send(new ContactInquiryAutoReplyMail($inquiry));
                } catch (\Throwable $e) {
                    Log::error('Failed sending contact inquiry auto-reply to client: ' . $e->getMessage(), [
                        'client_email' => $inquiry->email,
                        'inquiry_id'   => $inquiry->id,
                    ]);
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
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('subject', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('message', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $inquiries = $query->orderBy('id', 'desc')->paginate(15)->withQueryString();

        $stats = [
            'total'    => ContactInquiry::count(),
            'new'      => ContactInquiry::where('status', 'new')->count(),
            'read'     => ContactInquiry::where('status', 'read')->count(),
            'replied'  => ContactInquiry::where('status', 'replied')->count(),
            'archived' => ContactInquiry::where('status', 'archived')->count(),
        ];

        // Retrieve current contact settings for admin configuration modal/quick access
        $settingFile = storage_path('app/data/setting.json');
        $settings = File::exists($settingFile) ? json_decode(File::get($settingFile), true) : [];
        $mailConfig = $settings['mail'] ?? [];

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
            'filters'         => $request->only(['search', 'status']),
            'contactSettings' => $contactSettings,
        ]);
    }

    /**
     * Admin update inquiry status and notes.
     */
    public function adminUpdate(Request $request, $id)
    {
        $inquiry = ContactInquiry::findOrFail($id);

        $validated = $request->validate([
            'status'      => ['required', 'in:new,read,replied,archived'],
            'admin_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $updateData = [
            'status'      => $validated['status'],
            'admin_notes' => $validated['admin_notes'] ?? $inquiry->admin_notes,
        ];

        if ($validated['status'] === 'replied' && !$inquiry->replied_at) {
            $updateData['replied_at'] = now();
        }

        $inquiry->update($updateData);

        return back()->with('success', 'Inquiry updated successfully.');
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
        $settings = File::exists($settingFile) ? json_decode(File::get($settingFile), true) : [];

        if (!isset($settings['mail'])) {
            $settings['mail'] = [];
        }

        if (!isset($settings['mail']['contact_recipient_email'])) {
            $settings['mail']['contact_recipient_email'] = [
                'label'       => 'Contact Form Recipient Email (Admin Inbox)',
                'type'        => 'text',
                'style'       => 2,
                'placeholder' => 'support@nestifytech.com',
                'description' => 'Email address where inquiries submitted from the Contact Us form are delivered.',
                'value'       => $validated['recipient_email'],
            ];
        } else {
            $settings['mail']['contact_recipient_email']['value'] = $validated['recipient_email'];
        }

        if (!isset($settings['mail']['contact_autoreply_enabled'])) {
            $settings['mail']['contact_autoreply_enabled'] = [
                'label'       => 'Send Confirmation Email to Customer',
                'type'        => 'checkbox',
                'style'       => 1,
                'value_label' => 'Enable automatic receipt acknowledgment email to client',
                'value'       => (bool) $validated['autoreply_enabled'],
            ];
        } else {
            $settings['mail']['contact_autoreply_enabled']['value'] = (bool) $validated['autoreply_enabled'];
        }

        File::put($settingFile, json_encode($settings, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        return back()->with('success', 'Contact settings updated successfully.');
    }

    /**
     * Admin delete inquiry.
     */
    public function adminDestroy($id)
    {
        $inquiry = ContactInquiry::findOrFail($id);
        $inquiry->delete();

        return back()->with('success', 'Inquiry deleted successfully.');
    }
}
