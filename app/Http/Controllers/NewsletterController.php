<?php

namespace App\Http\Controllers;

use App\Mail\NewsletterWelcomeMail;
use App\Models\NewsletterSubscriber;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;

class NewsletterController extends Controller
{
    /**
     * Public: Subscribe to newsletter.
     */
    public function subscribe(Request $request)
    {
        // Bot honeypot
        if ($request->filled('hp_field')) {
            return response()->json(['success' => true, 'message' => 'Thank you for subscribing!']);
        }

        // Rate limiting: max 5 per IP per 10 minutes
        $throttleKey = 'newsletter_subscribe:' . $request->ip();
       
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'success' => false,
                'message' => "Too many subscription attempts. Please wait {$seconds} seconds.",
            ], 429);
        }
        RateLimiter::hit($throttleKey, 600);

        $validated = $request->validate([
            'email'  => ['required', 'email:rfc', 'max:150'],
            'name'   => ['nullable', 'string', 'max:100'],
            'source' => ['nullable', 'string', 'max:50'],
        ]);

        $email = strtolower(trim($validated['email']));

        // Check if already subscribed
        $existing = NewsletterSubscriber::where('email', $email)->first();

        if ($existing) {
            if ($existing->status === 'active') {
                return response()->json([
                    'success' => true,
                    'message' => 'You are already subscribed to our newsletter.',
                    'already' => true,
                ]);
            }

            // Re-subscribe
            $existing->update([
                'status'           => 'active',
                'name'             => !empty($validated['name']) ? trim($validated['name']) : $existing->name,
                'subscribed_at'    => now(),
                'unsubscribed_at'  => null,
                'source'           => $validated['source'] ?? $existing->source,
                'ip_address'       => $request->ip(),
            ]);

            $subscriber = $existing;
        } else {
            $subscriber = NewsletterSubscriber::create([
                'email'         => $email,
                'name'          => !empty($validated['name']) ? trim($validated['name']) : null,
                'status'        => 'active',
                'token'         => NewsletterSubscriber::generateToken(),
                'source'        => $validated['source'] ?? 'footer',
                'ip_address'    => $request->ip(),
                'subscribed_at' => now(),
            ]);
        }

        // Send welcome email (using same dynamic mail config as contact form)
        $settingFile = storage_path('app/data/setting.json');
        $settings    = File::exists($settingFile) ? json_decode(File::get($settingFile), true) : [];
        $mailEnabled = filter_var(($settings['mail']['mail_enabled']['value'] ?? true), FILTER_VALIDATE_BOOLEAN);

        if ($mailEnabled) {
            try {
                Mail::to($subscriber->email)->send(new NewsletterWelcomeMail($subscriber));
            } catch (\Throwable $e) {
                Log::error('Newsletter welcome mail failed: ' . $e->getMessage(), [
                    'subscriber_id' => $subscriber->id,
                    'email'         => $subscriber->email,
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Thank you for subscribing! Check your inbox for a confirmation email.',
        ]);
    }

    /**
     * Public: Unsubscribe via token link in email.
     */
    public function unsubscribe(string $token)
    {
        $subscriber = NewsletterSubscriber::where('token', $token)->first();

        if (!$subscriber) {
            abort(404, 'Invalid unsubscribe link.');
        }

        if ($subscriber->status === 'active') {
            $subscriber->update([
                'status'           => 'unsubscribed',
                'unsubscribed_at'  => now(),
            ]);
        }

        return redirect('/')->with('success', 'You have been successfully unsubscribed from our newsletter.');
    }

    /**
     * Admin: List subscribers.
     */
    public function adminIndex(Request $request)
    {
        $query = NewsletterSubscriber::query();

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $subscribers = $query->orderBy('id', 'desc')->paginate(20)->withQueryString();

        $stats = [
            'total'         => NewsletterSubscriber::count(),
            'active'        => NewsletterSubscriber::where('status', 'active')->count(),
            'unsubscribed'  => NewsletterSubscriber::where('status', 'unsubscribed')->count(),
            'this_month'    => NewsletterSubscriber::where('status', 'active')
                                  ->where('subscribed_at', '>=', now()->startOfMonth())
                                  ->count(),
        ];

        return Inertia::render('Admin/Newsletter/Index', [
            'subscribers' => $subscribers,
            'stats'       => $stats,
            'filters'     => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Admin: Delete subscriber.
     */
    public function adminDestroy($id)
    {
        $subscriber = NewsletterSubscriber::findOrFail($id);
        $subscriber->delete();

        return back()->with('success', 'Subscriber removed successfully.');
    }

    /**
     * Admin: Export active subscribers as CSV.
     */
    public function adminExport()
    {
        $subscribers = NewsletterSubscriber::active()
            ->orderBy('subscribed_at', 'desc')
            ->get(['email', 'name', 'source', 'subscribed_at']);

        $csv = "Email,Name,Source,Subscribed At\n";
        foreach ($subscribers as $s) {
            $csv .= sprintf(
                '"%s","%s","%s","%s"' . "\n",
                $s->email,
                $s->name ?? '',
                $s->source,
                $s->subscribed_at?->format('Y-m-d H:i:s') ?? ''
            );
        }

        return response($csv, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="newsletter-subscribers-' . now()->format('Y-m-d') . '.csv"',
        ]);
    }
}
