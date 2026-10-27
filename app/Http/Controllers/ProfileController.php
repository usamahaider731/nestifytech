<?php

namespace App\Http\Controllers;

use App\Traits\ModuleHandler;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;
use App\Mail\UserEmailChangedNewMail;
use App\Mail\UserEmailChangedOldMail;
use App\Mail\UserOtpMail;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    use ModuleHandler;

    /**
     * Get currently authenticated user data directly from the users table.
     */
    protected function getAuthUser()
    {
        $id = Auth::id();
        if (!$id) {
            abort(401, 'Unauthenticated');
        }

        return DB::table('users')->where('id', $id)->first();
    }

    /**
     * Gather profile data, metadata, and key account statistics using module system.
     */
    protected function getUserProfileData($user): array
    {
        $userId = $user->id;

        // 1. Avatar from media table
        $avatarMedia = DB::table('media')
            ->where('parent_id', $userId)
            ->where('type', 'user')
            ->first();

        $avatarUrl = $avatarMedia && $avatarMedia->filename
            ? asset('storage/uploads/image/' . $avatarMedia->filename)
            : null;

        // 2. Metadata (phone, bio, address, etc.) from user_meta table
        $metaRows = DB::table('user_meta')
            ->where('user_id', $userId)
            ->pluck('value', 'key')
            ->toArray();

        // 3. Stats from module tables (orders, reviews, user_activities)
        $ordersQuery = DB::table('orders')->where('user_id', $userId);
        $totalOrders = (clone $ordersQuery)->count();
        $completedOrders = (clone $ordersQuery)->where('status', 'completed')->count();
        $pendingOrders = (clone $ordersQuery)->where('status', 'pending')->count();
        $cancelledOrders = (clone $ordersQuery)->where('status', 'cancelled')->count();
        $totalSpent = (float) (clone $ordersQuery)->whereIn('status', ['completed', 'pending'])->sum('total_price');

        $reviewsCount = DB::table('reviews')->where('user_id', $userId)->count();
        $activitiesCount = DB::table('user_activities')->where('user_id', $userId)->count();

        // Wishlist items count
        $wishlistRaw = $metaRows['wishlist'] ?? null;
        $wishlistItems = [];
        if ($wishlistRaw) {
            $decoded = json_decode($wishlistRaw, true);
            if (is_array($decoded)) {
                $wishlistItems = $decoded;
            }
        }
        $wishlistCount = count($wishlistItems);

        // Role calculation from roles table
        $roles = $user->roles;
        if (is_string($roles)) {
            $roles = json_decode($roles, true);
        }
        $roleTitles = [];
        if (is_array($roles) && !empty($roles)) {
            $roleTitles = DB::table('roles')->whereIn('id', $roles)->pluck('title')->toArray();
        }
        $roleName = !empty($roleTitles) ? implode(', ', $roleTitles) : 'Customer';
        $isAdmin = in_array(1, (array)$roles) || in_array('1', (array)$roles) || str_contains(strtolower($roleName), 'admin');

        $createdAtFormatted = $user->created_at ? date('F Y', strtotime($user->created_at)) : 'Member';
        $createdAtIso = $user->created_at ? Carbon::parse($user->created_at)->toIso8601String() : null;

        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'email_verified' => !empty($user->email_verified_at),
                'role_name' => $roleName,
                'is_admin' => $isAdmin,
                'avatar' => $avatarUrl,
                'avatar_filename' => $avatarMedia->filename ?? null,
                'member_since' => $createdAtFormatted,
                'created_at' => $createdAtIso,
                // Password is intentionally NOT exposed to the frontend for security.
                'last_seen_at' => $user->last_seen_at ?? null,
                'is_social_user' => !empty($metaRows['google_id']) || !empty($metaRows['facebook_id']),
                'social_provider' => !empty($metaRows['google_id']) ? 'Google' : (!empty($metaRows['facebook_id']) ? 'Facebook' : null),
                'meta' => [
                    'phone' => $metaRows['phone'] ?? '',
                    'phone_verified' => !empty($metaRows['phone_verified_at']),
                    'phone_verified_at' => $metaRows['phone_verified_at'] ?? null,
                    'bio' => $metaRows['bio'] ?? '',
                    'address' => $metaRows['address'] ?? '',
                    'city' => $metaRows['city'] ?? '',
                    'state' => $metaRows['state'] ?? '',
                    'country' => $metaRows['country'] ?? '',
                    'postal_code' => $metaRows['postal_code'] ?? '',
                    'date_of_birth' => $metaRows['date_of_birth'] ?? '',
                    'cnic' => $metaRows['cnic'] ?? '',
                    'order_notifications' => ($metaRows['order_notifications'] ?? '1') === '1',
                    'newsletter' => ($metaRows['newsletter'] ?? '1') === '1',
                    'social_links' => !empty($metaRows['social_links']) ? (function () use ($metaRows) {
                        $decoded = json_decode($metaRows['social_links'], true);
                        return is_array($decoded) ? $decoded : [];
                    })() : [],
                    'interests' => !empty($metaRows['interests']) ? (function () use ($metaRows) {
                        $decoded = json_decode($metaRows['interests'], true);
                        if (is_array($decoded)) return $decoded;
                        return array_values(array_filter(array_map('trim', explode(',', $metaRows['interests']))));
                    })() : [],
                ],
            ],
            'stats' => [
                'total_orders' => $totalOrders,
                'completed_orders' => $completedOrders,
                'pending_orders' => $pendingOrders,
                'cancelled_orders' => $cancelledOrders,
                'total_spent' => $totalSpent,
                'reviews_count' => $reviewsCount,
                'activities_count' => $activitiesCount,
                'wishlist_count' => $wishlistCount,
            ],
        ];
    }

    /**
     * Retrieve and format orders for a user.
     */
    protected function getFormattedOrders(int $userId, ?int $limit = null, ?string $status = null): array
    {
        $query = DB::table('orders')
            ->where('user_id', $userId)
            ->orderByDesc('id');

        $validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
        if ($status && in_array($status, $validStatuses)) {
            $query->where('status', $status);
        }

        if ($limit) {
            $query->limit($limit);
        }

        $orders = $query->get();

        return $orders->map(function ($order) {
            $items = DB::table('order_items')
                ->where('order_id', $order->id)
                ->get()
                ->map(function ($item) {
                    $product = DB::table('posts')->where('id', $item->product_id)->first();
                    $image = DB::table('media')
                        ->where('parent_id', $item->product_id)
                        ->where('type', 'post')
                        ->first();

                    $imageUrl = $image && $image->filename
                        ? asset('storage/uploads/image/' . $image->filename)
                        : null;

                    $attributes = [];
                    if (!empty($item->attributes)) {
                        $decoded = json_decode($item->attributes, true);
                        if (is_array($decoded)) {
                            $attributes = $decoded;
                        }
                    }

                    return [
                        'id' => $item->id,
                        'product_id' => $item->product_id,
                        'product_title' => $product ? $product->title : 'Product #' . $item->product_id,
                        'product_sku' => $product ? $product->sku : '',
                        'product_url' => $product ? route('post', ['type' => 'product', 'sku' => $product->sku, 'id' => $product->id]) : '#',
                        'image' => $imageUrl,
                        'quantity' => (int) $item->quantity,
                        'unit_price' => (float) $item->unit_price,
                        'subtotal' => (float) $item->subtotal,
                        'color' => $item->color,
                        'attributes' => $attributes,
                    ];
                });

            $orderDate = $order->order_date ? date('M d, Y h:i A', strtotime($order->order_date)) : ($order->created_at ? date('M d, Y h:i A', strtotime($order->created_at)) : 'N/A');

            return [
                'id' => $order->id,
                'order_number' => 'ORD-' . str_pad($order->id, 5, '0', STR_PAD_LEFT),
                'total_price' => (float) $order->total_price,
                'quantity' => (int) $order->quantity,
                'status' => $order->status,
                'payment_method' => ucfirst($order->payment_method ?? 'card'),
                'payment_status' => ucfirst($order->payment_status ?? 'unpaid'),
                'tracking_number' => $order->tracking_number ?? null,
                'shipping_carrier' => $order->shipping_carrier ?? null,
                'shipping_address' => $order->shipping_address ?? null,
                'shipping_city' => $order->shipping_city ?? null,
                'customer_notes' => $order->customer_notes ?? null,
                'order_date' => $orderDate,
                'completed_date' => $order->completed_date ? date('M d, Y', strtotime($order->completed_date)) : null,
                'cancelled_date' => $order->cancelled_date ? date('M d, Y', strtotime($order->cancelled_date)) : null,
                'created_at' => $order->created_at,
                'items_count' => $items->count(),
                'items' => $items,
            ];
        })->toArray();
    }

    /**
     * Retrieve and format reviews by a user.
     */
    protected function getFormattedReviews(int $userId, ?int $limit = null): array
    {
        $query = DB::table('reviews')
            ->where('user_id', $userId)
            ->orderByDesc('id');

        if ($limit) {
            $query->limit($limit);
        }

        $reviews = $query->get();

        return $reviews->map(function ($rev) {
            $product = DB::table('posts')->where('id', $rev->post_id)->first();
            $image = DB::table('media')
                ->where('parent_id', $rev->post_id)
                ->where('type', 'post')
                ->first();

            $imageUrl = $image && $image->filename
                ? asset('storage/uploads/image/' . $image->filename)
                : null;

            return [
                'id' => $rev->id,
                'post_id' => $rev->post_id,
                'product_title' => $product ? $product->title : 'Product #' . $rev->post_id,
                'product_sku' => $product ? $product->sku : '',
                'product_url' => $product ? route('post', ['type' => 'product', 'sku' => $product->sku, 'id' => $product->id]) : '#',
                'image' => $imageUrl,
                'rating' => (int) $rev->rating,
                'comment' => $rev->comment,
                'status' => $rev->status,
                'likes' => (int) ($rev->likes ?? 0),
                'reports' => (int) ($rev->reports ?? 0),
                'created_at' => $rev->created_at ? date('M d, Y', strtotime($rev->created_at)) : 'N/A',
                'time_ago' => $rev->created_at ? Carbon::parse($rev->created_at)->diffForHumans() : '',
            ];
        })->toArray();
    }

    /**
     * Retrieve and format user activity timeline.
     */
    protected function getFormattedActivities(int $userId, int $limit = 30): array
    {
        $activities = DB::table('user_activities')
            ->where('user_id', $userId)
            ->orderByDesc('id')
            ->limit($limit * 5)
            ->get();

        return $activities->map(function ($act) {
            $payload = json_decode($act->payload ?? '', true);
            if (! is_array($payload)) {
                return null;
            }

            $category = $payload['category'] ?? 'general';
            $title = $payload['title'] ?? ucfirst(str_replace('_', ' ', $payload['action'] ?? 'page_visit'));
            $createdAt = $act->created_at ? Carbon::parse($act->created_at) : now();

            return [
                'id' => $act->id,
                'title' => $title,
                'category' => $category,
                'detail' => $payload['detail'] ?? null,
                'time_ago' => $createdAt->diffForHumans(),
                'date_formatted' => $createdAt->format('M d, Y h:i A'),
            ];
        })->filter()->take($limit)->values()->toArray();
    }

    /**
     * Dashboard / Overview
     */
    public function index(Request $request): Response
    {
        $user = $this->getAuthUser();
        $profile = $this->getUserProfileData($user);
        $recentOrders = $this->getFormattedOrders($user->id, 5);
        $recentActivities = $this->getFormattedActivities($user->id, 8);
        $recentReviews = $this->getFormattedReviews($user->id, 3);

        return Inertia::render('Frontend/Profile/Index', [
            'profile' => $profile,
            'recent_orders' => $recentOrders,
            'recent_activities' => $recentActivities,
            'recent_reviews' => $recentReviews,
        ]);
    }

    /**
     * Orders page
     */
    public function orders(Request $request): Response
    {
        $user = $this->getAuthUser();
        $status = $request->query('status');
        $profile = $this->getUserProfileData($user);
        $orders = $this->getFormattedOrders($user->id, null, $status);

        return Inertia::render('Frontend/Profile/Orders', [
            'profile' => $profile,
            'orders' => $orders,
            'current_status' => $status ?? 'all',
        ]);
    }

    /**
     * Wishlist / Liked products page
     */
    public function wishlist(Request $request): Response
    {
        $user = $this->getAuthUser();
        $profile = $this->getUserProfileData($user);

        // Fetch popular/trending products for wishlist recommendations using helper
        $recommendedProducts = [];
        try {
            $recommendedProducts = get_posts([
                'type' => 'product',
                'limit' => 4,
                'latest' => true,
                'image' => true,
                'meta' => true,
            ]);
        } catch (\Throwable $e) {
            $recommendedProducts = [];
        }

        return Inertia::render('Frontend/Profile/Wishlist', [
            'profile' => $profile,
            'recommended_products' => $recommendedProducts,
        ]);
    }

    /**
     * User reviews page
     */
    public function reviews(Request $request): Response
    {
        $user = $this->getAuthUser();
        $profile = $this->getUserProfileData($user);
        $reviews = $this->getFormattedReviews($user->id);

        return Inertia::render('Frontend/Profile/Reviews', [
            'profile' => $profile,
            'reviews' => $reviews,
        ]);
    }

    /**
     * Activity log page
     */
    public function activity(Request $request): Response
    {
        $user = $this->getAuthUser();
        $profile = $this->getUserProfileData($user);
        $activities = $this->getFormattedActivities($user->id, 50);

        return Inertia::render('Frontend/Profile/Activity', [
            'profile' => $profile,
            'activities' => $activities,
        ]);
    }

    public function wishlistActivity(Request $request)
    {
        $validated = $request->validate([
            'action' => ['required', 'in:wishlist_added,wishlist_removed,wishlist_cleared'],
            'product_id' => ['nullable', 'required_unless:action,wishlist_cleared', 'integer', 'exists:posts,id'],
            'count' => ['nullable', 'integer', 'min:0'],
        ]);

        if ($validated['action'] === 'wishlist_cleared') {
            record_user_activity('wishlist_cleared', [
                'title' => 'Cleared wishlist',
                'category' => 'wishlist',
                'detail' => 'Removed ' . ((int) ($validated['count'] ?? 0)) . ' items from your wishlist',
            ]);

            return response()->noContent();
        }

        $product = DB::table('posts')->where('id', $validated['product_id'])->first();
        if (!$product) {
            return response()->noContent();
        }

        // Prevent users from liking / adding their own products to wishlist
        $currentUserId = Auth::id();
        if ($currentUserId && (int) $product->user_id === (int) $currentUserId && $validated['action'] === 'wishlist_added') {
            return response()->json([
                'success' => false,
                'message' => __("You cannot like or wishlist your own product."),
            ], 403);
        }

        $productTitle = $product->title;
        $added = $validated['action'] === 'wishlist_added';

        record_user_activity($validated['action'], [
            'title' => $added ? 'Added to wishlist' : 'Removed from wishlist',
            'category' => 'wishlist',
            'detail' => ($added ? 'Saved ' : 'Removed ') . ($productTitle ?: 'a product') . ($added ? ' to your wishlist' : ' from your wishlist'),
            'product_id' => (int) $validated['product_id'],
            'product_title' => $productTitle,
        ]);

        return response()->noContent();
    }

    /**
     * Account settings page
     */
    public function settings(Request $request): Response
    {
        $user = $this->getAuthUser();
        $profile = $this->getUserProfileData($user);
        return Inertia::render('Frontend/Profile/Settings', [
            'profile' => $profile,
            'mustVerifyEmail' => false,
            'status' => session('status'),
        ]);
    }

    /**
     * Legacy Breeze edit route redirects to settings
     */
    public function edit(Request $request): Response
    {
        return $this->settings($request);
    }

    /**
     * Update user profile information using module schema & user table.
     */
    public function update(Request $request): RedirectResponse
    {
        $user = $this->getAuthUser();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'phone' => ['nullable', 'string', 'max:30'],
            'bio' => ['nullable', 'string', 'max:1000'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'max:100'],
            'state' => ['nullable', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'cnic' => ['nullable', 'string', 'max:20'],
            'order_notifications' => ['nullable', 'boolean'],
            'newsletter' => ['nullable', 'boolean'],
            'social_links' => ['nullable', 'array'],
            'social_links.*.platform' => ['nullable', 'string', 'max:50'],
            'social_links.*.url' => ['nullable', 'string', 'max:255'],
            'interests' => ['nullable'],
        ]);

        $userData = [
            'name' => $validated['name'],
            'updated_at' => now(),
        ];

        $oldEmail = $user->email;
        $emailChanged = ($oldEmail !== $validated['email']);

        if ($emailChanged) {
            // Verify that OTP was validated for changing email
            $otpVerifiedKey = "email_otp_verified_{$user->id}_change_email";
            $isOtpVerified = Cache::get($otpVerifiedKey);

            // Also check if an otp was passed directly in request
            $submittedOtp = trim($request->input('email_otp', ''));
            $pendingOtpData = Cache::get("email_otp_{$user->id}_change_email");

            if (!$isOtpVerified && (!$pendingOtpData || empty($submittedOtp) || $pendingOtpData['otp'] !== $submittedOtp)) {
                return Redirect::back()->withErrors([
                    'email' => __('Please verify your new email address with the verification code sent to it before saving.'),
                ]);
            }

            Cache::forget($otpVerifiedKey);
            Cache::forget("email_otp_{$user->id}_change_email");

            $userData['email'] = $validated['email'];
            $userData['email_verified_at'] = now();
        }

        DB::table('users')->where('id', $user->id)->update($userData);

        if ($emailChanged) {
            try {
                $userModel = User::find($user->id) ?? (object) ['name' => $validated['name'], 'id' => $user->id];

                // Send notification to old email address
                Mail::to($oldEmail)->send(new UserEmailChangedOldMail($userModel, $oldEmail, $validated['email']));

                // Send confirmation notification to new email address
                Mail::to($validated['email'])->send(new UserEmailChangedNewMail($userModel, $oldEmail, $validated['email']));

                record_user_activity('email_updated', [
                    'title' => 'Email address changed',
                    'category' => 'security',
                    'detail' => "Changed email from {$oldEmail} to {$validated['email']}",
                ], (int) $user->id);
            } catch (\Throwable $e) {
                Log::error('Failed sending email change notifications: ' . $e->getMessage(), [
                    'user_id' => $user->id,
                    'old_email' => $oldEmail,
                    'new_email' => $validated['email'],
                ]);
            }
        }

        // Update meta fields in user_meta table
        $metaFields = [
            'phone' => $validated['phone'] ?? '',
            'bio' => $validated['bio'] ?? '',
            'address' => $validated['address'] ?? '',
            'city' => $validated['city'] ?? '',
            'state' => $validated['state'] ?? '',
            'country' => $validated['country'] ?? '',
            'postal_code' => $validated['postal_code'] ?? '',
            'date_of_birth' => $validated['date_of_birth'] ?? '',
            'cnic' => $validated['cnic'] ?? '',
            'order_notifications' => !empty($validated['order_notifications']) ? '1' : '0',
            'newsletter' => !empty($validated['newsletter']) ? '1' : '0',
        ];

        // Process and save social media accounts
        if (isset($validated['social_links'])) {
            $filteredLinks = array_values(array_filter((array) $validated['social_links'], function ($item) {
                return !empty($item['platform']) && !empty($item['url']);
            }));
            $metaFields['social_links'] = json_encode($filteredLinks);
        }

        // Process and save user interests
        if (isset($validated['interests'])) {
            $rawInterests = is_array($validated['interests'])
                ? $validated['interests']
                : array_filter(array_map('trim', explode(',', (string) $validated['interests'])));
            $metaFields['interests'] = json_encode(array_values(array_unique(array_filter($rawInterests))));
        }

        foreach ($metaFields as $key => $val) {
            DB::table('user_meta')->updateOrInsert(
                ['user_id' => $user->id, 'key' => $key],
                ['value' => $val, 'updated_at' => now()]
            );
        }

        record_user_activity('profile_updated', [
            'title' => 'Updated account details',
            'category' => 'profile',
            'detail' => 'Updated your profile information',
        ], (int) $user->id);

        return Redirect::back()->with('status', 'profile-updated');
    }

    /**
     * Upload / Update avatar image using ModuleHandler.
     */
    public function updateAvatar(Request $request): RedirectResponse
    {
        $request->validate([
            'avatar' => ['required', 'file', 'mimes:jpeg,png,jpg,webp,gif,svg', 'max:5120'],
        ]);

        $user = $this->getAuthUser();
        $file = $request->file('avatar');

        // Use ModuleHandler's standardized DB image upload
        $this->handleDBImageUpload($file, $user->id, 'user', $user->name);

        return Redirect::back()->with('status', 'avatar-updated');
    }

    /**
     * Remove avatar image from media table and storage.
     */
    public function removeAvatar(Request $request): RedirectResponse
    {
        $user = $this->getAuthUser();

        $avatar = DB::table('media')
            ->where('parent_id', $user->id)
            ->where('type', 'user')
            ->first();

        if ($avatar) {
            if ($avatar->filename) {
                Storage::disk('public')->delete('uploads/image/' . $avatar->filename);
            }
            DB::table('media')->where('id', $avatar->id)->delete();
        }

        return Redirect::back()->with('status', 'avatar-removed');
    }

    /**
     * Update password directly in users table.
     */
    public function updatePassword(Request $request): RedirectResponse
    {
        $user = $this->getAuthUser();

        $isSocialUser = DB::table('user_meta')
            ->where('user_id', $user->id)
            ->whereIn('key', ['google_id', 'facebook_id'])
            ->exists();

        $rules = [
            'password' => ['required', Password::defaults(), 'confirmed'],
        ];

        // If user is not social or explicitly supplied current_password, enforce check
        if (!$isSocialUser || $request->filled('current_password')) {
            $rules['current_password'] = ['required', function ($attribute, $value, $fail) use ($user) {
                if (!Hash::check($value, $user->password)) {
                    $fail(__('The current password is incorrect.'));
                }
            }];
        }

        $validated = $request->validate($rules);

        DB::table('users')->where('id', $user->id)->update([
            'password' => Hash::make($validated['password']),
            'updated_at' => now(),
        ]);

        // NOTE: Password is stored only as bcrypt hash in users.password — never in user_meta.
        // NOTE: Plain-text password is intentionally NOT stored in session (security).

        return Redirect::back()->with('status', 'password-updated');
    }

    /**
     * Delete the user's account and associated metadata.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $user = $this->getAuthUser();

        $request->validate([
            'password' => ['required', function ($attribute, $value, $fail) use ($user) {
                if (!Hash::check($value, $user->password)) {
                    $fail(__('The password provided is incorrect.'));
                }
            }],
            'otp' => ['nullable', 'string'],
        ]);

        // Check OTP verification
        $otpVerifiedKey = "email_otp_verified_{$user->id}_delete_account";
        $isPreVerified = Cache::get($otpVerifiedKey);

        if (!$isPreVerified) {
            // Check direct OTP code submitted in request
            $submittedOtp = trim($request->input('otp', ''));
            $pendingOtpData = Cache::get("email_otp_{$user->id}_delete_account");

            if (!$pendingOtpData || empty($submittedOtp) || $pendingOtpData['otp'] !== $submittedOtp) {
                return Redirect::back()->withErrors([
                    'otp' => __('A valid email verification code is required to delete your account. Please click "Send Verification Code" and enter the 6-digit code sent to your email.'),
                ]);
            }

            Cache::forget("email_otp_{$user->id}_delete_account");
        } else {
            Cache::forget($otpVerifiedKey);
        }

        Auth::logout();

        // Delete user and associated metadata
        DB::table('user_meta')->where('user_id', $user->id)->delete();
        DB::table('media')->where('parent_id', $user->id)->where('type', 'user')->delete();
        DB::table('users')->where('id', $user->id)->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }

    /**
     * Save detected country and complete IP geolocation metadata to user_meta.
     */
    public function saveCountry(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'ip'           => ['nullable', 'string', 'max:50'],
            'country'      => ['nullable', 'string', 'max:100'],
            'country_code' => ['nullable', 'string', 'max:10'],
            'region'       => ['nullable', 'string', 'max:100'],
            'city'         => ['nullable', 'string', 'max:100'],
            'postal'       => ['nullable', 'string', 'max:50'],
            'latitude'     => ['nullable', 'numeric'],
            'longitude'    => ['nullable', 'numeric'],
            'timezone'     => ['nullable', 'string', 'max:100'],
            'org'          => ['nullable', 'string', 'max:255'],
        ]);

        $ip = trim($validated['ip'] ?? $request->ip() ?? '');
        $country = trim($validated['country'] ?? '');
        $countryCode = trim($validated['country_code'] ?? '');
        $region = trim($validated['region'] ?? '');
        $city = trim($validated['city'] ?? '');
        $postal = trim($validated['postal'] ?? '');
        $lat = $validated['latitude'] ?? null;
        $lon = $validated['longitude'] ?? null;
        $timezone = trim($validated['timezone'] ?? '');
        $org = trim($validated['org'] ?? '');

        // 1. Always record/update complete IP address and IP metadata
        if (!empty($ip)) {
            DB::table('user_meta')->updateOrInsert(
                ['user_id' => $user->id, 'key' => 'ip_address'],
                ['value' => $ip, 'updated_at' => now()]
            );
        }

        if (!empty($country)) {
            // Save country if not already set or empty
            $existingCountry = DB::table('user_meta')
                ->where('user_id', $user->id)
                ->where('key', 'country')
                ->first();

            if (!$existingCountry || empty($existingCountry->value)) {
                DB::table('user_meta')->updateOrInsert(
                    ['user_id' => $user->id, 'key' => 'country'],
                    ['value' => $country, 'updated_at' => now()]
                );
            }
        }

        if (!empty($countryCode)) {
            DB::table('user_meta')->updateOrInsert(
                ['user_id' => $user->id, 'key' => 'ip_country_code'],
                ['value' => $countryCode, 'updated_at' => now()]
            );
        }

        if (!empty($region)) {
            DB::table('user_meta')->updateOrInsert(
                ['user_id' => $user->id, 'key' => 'ip_region'],
                ['value' => $region, 'updated_at' => now()]
            );
        }

        if (!empty($city)) {
            DB::table('user_meta')->updateOrInsert(
                ['user_id' => $user->id, 'key' => 'ip_city'],
                ['value' => $city, 'updated_at' => now()]
            );
        }

        if (!empty($postal)) {
            DB::table('user_meta')->updateOrInsert(
                ['user_id' => $user->id, 'key' => 'ip_postal'],
                ['value' => $postal, 'updated_at' => now()]
            );
        }

        if ($lat !== null && $lon !== null) {
            DB::table('user_meta')->updateOrInsert(
                ['user_id' => $user->id, 'key' => 'ip_coordinates'],
                ['value' => json_encode(['latitude' => $lat, 'longitude' => $lon]), 'updated_at' => now()]
            );
        }

        if (!empty($timezone)) {
            DB::table('user_meta')->updateOrInsert(
                ['user_id' => $user->id, 'key' => 'ip_timezone'],
                ['value' => $timezone, 'updated_at' => now()]
            );
        }

        if (!empty($org)) {
            DB::table('user_meta')->updateOrInsert(
                ['user_id' => $user->id, 'key' => 'ip_org'],
                ['value' => $org, 'updated_at' => now()]
            );
        }

        // Store complete payload in ip_detect_meta for comprehensive tracking
        $fullDetails = [
            'ip'           => $ip,
            'country'      => $country,
            'country_code' => $countryCode,
            'region'       => $region,
            'city'         => $city,
            'postal'       => $postal,
            'latitude'     => $lat,
            'longitude'    => $lon,
            'timezone'     => $timezone,
            'org'          => $org,
            'user_agent'   => $request->userAgent(),
            'detected_at'  => now()->toDateTimeString(),
        ];

        DB::table('user_meta')->updateOrInsert(
            ['user_id' => $user->id, 'key' => 'ip_detect_meta'],
            ['value' => json_encode($fullDetails), 'updated_at' => now()]
        );

        return response()->json([
            'success' => true,
            'ip'      => $ip,
            'country' => $country,
            'meta'    => $fullDetails,
        ]);
    }

    /**
     * Send OTP for phone verification via SMS or WhatsApp.
     */
    public function sendPhoneOtp(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'phone'   => ['required', 'string', 'max:30'],
            'channel' => ['nullable', 'string', 'in:whatsapp,sms'],
        ]);

        $phone = preg_replace('/[^\d+]/', '', trim($validated['phone']));
        $channel = $validated['channel'] ?? 'whatsapp';

        if (strlen($phone) < 8) {
            return response()->json(['success' => false, 'message' => 'Please provide a valid phone number with country code.'], 422);
        }

        // If sending OTP for a different number than currently verified, clear the verified flag
        $existingPhone = DB::table('user_meta')
            ->where('user_id', $user->id)->where('key', 'phone')->value('value');

        if ($existingPhone && $existingPhone !== $phone) {
            DB::table('user_meta')->updateOrInsert(
                ['user_id' => $user->id, 'key' => 'phone_verified'],
                ['value' => '0', 'updated_at' => now()]
            );
        }

        // Generate a secure 6-digit OTP
        $otp = (string) random_int(100000, 999999);

        // Store OTP in cache for 10 minutes
        $cacheKey = 'phone_otp_' . $user->id;
        Cache::put($cacheKey, [
            'otp' => $otp,
            'phone' => $phone,
            'channel' => $channel,
            'created_at' => now()->toIso8601String(),
        ], now()->addMinutes(10));

        $cleanDigits = preg_replace('/[^\d]/', '', $phone);
        $message = "Your NestifyTech verification code is: {$otp}. It is valid for 10 minutes.";
        $sentViaApi = false;
        $apiError = null;

        // 1. WhatsApp via Facebook Graph API or WASenderAPI (configured in Admin Settings)
        $waApiKey = null;
        $waEndpoint = null;
        $settingFile = storage_path('app/data/setting.json');
        if (file_exists($settingFile)) {
            $settings = json_decode(file_get_contents($settingFile), true) ?: [];
            $waApiKey = $settings['whatsapp']['api_key']['value'] ?? null;
            $waEndpoint = $settings['whatsapp']['api_endpoint']['value'] ?? null;
            $phoneNumberId = $settings['whatsapp']['phone_number_id']['value'] ?? null;
            if (!empty($settings['whatsapp']['otp_template']['value'])) {
                $template = $settings['whatsapp']['otp_template']['value'];
                $message = str_replace(['{otp}', '{minutes}'], [$otp, '10'], $template);
            }
        }

        if (empty($waApiKey)) {
            $waApiKey = env('FACEBOOK_WHATSAPP_ACCESS_TOKEN') ?: env('WASENDERAPI_API_KEY');
        }

        if (empty($waEndpoint)) {
            $phoneId = $phoneNumberId ?? env('FACEBOOK_WHATSAPP_PHONE_NUMBER_ID', '1368734399657650');
            $waEndpoint = "https://graph.facebook.com/v20.0/{$phoneId}/messages";
        }

        if ($channel === 'whatsapp' && !empty($waApiKey)) {
            try {
                $isFacebookGraph = str_contains($waEndpoint, 'graph.facebook.com');

                if ($isFacebookGraph) {
                    $payload = [
                        'messaging_product' => 'whatsapp',
                        'recipient_type'    => 'individual',
                        'to'                => $cleanDigits,
                        'type'              => 'text',
                        'text'              => [
                            'preview_url' => false,
                            'body'        => $message,
                        ],
                    ];
                } else {
                    $payload = [
                        'to'   => '+' . $cleanDigits,
                        'text' => $message,
                    ];
                }

                $response = \Illuminate\Support\Facades\Http::timeout(10)
                    ->withHeaders([
                        'Authorization' => 'Bearer ' . $waApiKey,
                        'Content-Type'  => 'application/json',
                    ])
                    ->post($waEndpoint, $payload);

                if ($response->successful()) {
                    $sentViaApi = true;
                } else {
                    $resJson = $response->json();
                    $apiError = $resJson['error']['message'] ?? ($resJson['message'] ?? 'WhatsApp API delivery failed.');
                }
            } catch (\Throwable $e) {
                $apiError = $e->getMessage();
            }
        }

        return response()->json([
            'success'      => true,
            'message'      => $sentViaApi
                ? 'Verification code sent to your WhatsApp!'
                : 'Verification code generated! (WhatsApp Gateway token pending or error: ' . ($apiError ?? 'not configured') . ')',
            'channel'      => 'whatsapp',
            'phone'        => $phone,
            'sent_via_api' => $sentViaApi,
            'api_error'    => $apiError,
        ]);
    }

    /**
     * Verify submitted phone OTP and mark phone as verified in user_meta.
     */
    public function verifyPhoneOtp(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'otp'   => ['required', 'string', 'max:10'],
            'phone' => ['required', 'string', 'max:30'],
        ]);

        $submittedOtp = trim($validated['otp']);
        $submittedPhone = preg_replace('/[^\d+]/', '', trim($validated['phone']));

        $cacheKey = 'phone_otp_' . $user->id;
        $cachedData = Cache::get($cacheKey);

        if (!$cachedData) {
            return response()->json(['success' => false, 'message' => 'Verification code expired or not found. Please request a new one.'], 422);
        }

        if ($cachedData['otp'] !== $submittedOtp) {
            return response()->json(['success' => false, 'message' => 'Invalid verification code. Please check and try again.'], 422);
        }

        // OTP matched - save verified phone and verification timestamp in user_meta
        DB::table('user_meta')->updateOrInsert(
            ['user_id' => $user->id, 'key' => 'phone'],
            ['value' => $submittedPhone, 'updated_at' => now()]
        );

        DB::table('user_meta')->updateOrInsert(
            ['user_id' => $user->id, 'key' => 'phone_verified'],
            ['value' => '1', 'updated_at' => now()]
        );

        DB::table('user_meta')->updateOrInsert(
            ['user_id' => $user->id, 'key' => 'phone_verified_at'],
            ['value' => now()->toDateTimeString(), 'updated_at' => now()]
        );

        // Clear used OTP
        Cache::forget($cacheKey);

        record_user_activity('phone_verified', [
            'title' => 'Phone Verified',
            'category' => 'profile',
            'detail' => 'Verified phone number ' . $submittedPhone,
        ], (int) $user->id);

        return response()->json([
            'success' => true,
            'message' => 'Phone number verified successfully!',
            'phone'   => $submittedPhone,
        ]);
    }

    /**
     * Send an OTP code to the user's email for actions like delete_account, change_email, or general verification.
     */
    public function sendEmailOtp(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'action' => ['required', 'string', 'in:delete_account,change_email,verification'],
            'email'  => ['nullable', 'email', 'max:255'],
        ]);

        $action = $validated['action'];
        // Send OTP to existing account email by default (for delete_account or confirming change from old address)
        // Or to the provided email if verifying a new email address
        $targetEmail = !empty($validated['email']) ? $validated['email'] : $user->email;

        // Generate 6-digit secure code
        $otp = (string) random_int(100000, 999999);

        // Store OTP in cache for 10 minutes
        $cacheKey = "email_otp_{$user->id}_{$action}";
        Cache::put($cacheKey, [
            'otp'          => $otp,
            'target_email' => $targetEmail,
            'action'       => $action,
            'created_at'   => now()->toIso8601String(),
        ], now()->addMinutes(10));

        try {
            Mail::to($targetEmail)->send(new UserOtpMail($user, $otp, $action, 10));

            return response()->json([
                'success' => true,
                'message' => "Verification code sent to {$targetEmail}!",
                'email'   => $targetEmail,
                'action'  => $action,
            ]);
        } catch (\Throwable $e) {
            Log::error("Failed to send OTP to {$targetEmail}: " . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Unable to send verification code. Please check mail settings and try again.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Verify an email OTP code.
     */
    public function verifyEmailOtp(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'action' => ['required', 'string', 'in:delete_account,change_email,verification'],
            'otp'    => ['required', 'string', 'max:10'],
        ]);

        $action = $validated['action'];
        $submittedOtp = trim($validated['otp']);
        $cacheKey = "email_otp_{$user->id}_{$action}";
        $cachedData = Cache::get($cacheKey);

        if (!$cachedData) {
            return response()->json([
                'success' => false,
                'message' => 'Verification code expired or not found. Please request a new code.',
            ], 422);
        }

        if ($cachedData['otp'] !== $submittedOtp) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid verification code. Please check and try again.',
            ], 422);
        }

        // Cache a verified flag for 5 minutes so subsequent action (like destroy account) can succeed
        Cache::put("email_otp_verified_{$user->id}_{$action}", true, now()->addMinutes(5));
        Cache::forget($cacheKey);

        return response()->json([
            'success' => true,
            'message' => 'Code verified successfully!',
            'action'  => $action,
        ]);
    }
}
