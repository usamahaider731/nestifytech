<?php

namespace App\Http\Controllers;

use App\Traits\ModuleHandler;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;
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
                'last_seen_at' => $user->last_seen_at ?? null,
                'meta' => [
                    'phone' => $metaRows['phone'] ?? '',
                    'bio' => $metaRows['bio'] ?? '',
                    'address' => $metaRows['address'] ?? '',
                    'city' => $metaRows['city'] ?? '',
                    'state' => $metaRows['state'] ?? '',
                    'country' => $metaRows['country'] ?? '',
                    'postal_code' => $metaRows['postal_code'] ?? '',
                    'order_notifications' => ($metaRows['order_notifications'] ?? '1') === '1',
                    'newsletter' => ($metaRows['newsletter'] ?? '1') === '1',
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

        if ($status && in_array($status, ['pending', 'completed', 'cancelled'])) {
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
                'likes' => (int) $rev->likes,
                'reports' => (int) $rev->reports,
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
            if (! is_array($payload) || empty($payload['action']) || empty($payload['category'])) {
                return null;
            }

            $createdAt = $act->created_at ? Carbon::parse($act->created_at) : now();

            return [
                'id' => $act->id,
                'title' => $payload['title'] ?? ucfirst(str_replace('_', ' ', $payload['action'])),
                'category' => $payload['category'],
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

        $productTitle = DB::table('posts')->where('id', $validated['product_id'])->value('title');
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
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'order_notifications' => ['nullable', 'boolean'],
            'newsletter' => ['nullable', 'boolean'],
        ]);

        $userData = [
            'name' => $validated['name'],
            'updated_at' => now(),
        ];

        if ($user->email !== $validated['email']) {
            $userData['email'] = $validated['email'];
            $userData['email_verified_at'] = null;
        }

        DB::table('users')->where('id', $user->id)->update($userData);

        // Update meta fields in user_meta table
        $metaFields = [
            'phone' => $validated['phone'] ?? '',
            'bio' => $validated['bio'] ?? '',
            'address' => $validated['address'] ?? '',
            'city' => $validated['city'] ?? '',
            'state' => $validated['state'] ?? '',
            'country' => $validated['country'] ?? '',
            'postal_code' => $validated['postal_code'] ?? '',
            'order_notifications' => !empty($validated['order_notifications']) ? '1' : '0',
            'newsletter' => !empty($validated['newsletter']) ? '1' : '0',
        ];

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
            'avatar' => ['required', 'image', 'mimes:jpeg,png,jpg,webp,gif', 'max:5120'],
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

        $validated = $request->validate([
            'current_password' => ['required', function ($attribute, $value, $fail) use ($user) {
                if (!Hash::check($value, $user->password)) {
                    $fail(__('The current password is incorrect.'));
                }
            }],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        DB::table('users')->where('id', $user->id)->update([
            'password' => Hash::make($validated['password']),
            'updated_at' => now(),
        ]);

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
        ]);

        Auth::logout();

        // Delete user and associated metadata
        DB::table('user_meta')->where('user_id', $user->id)->delete();
        DB::table('media')->where('parent_id', $user->id)->where('type', 'user')->delete();
        DB::table('users')->where('id', $user->id)->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
