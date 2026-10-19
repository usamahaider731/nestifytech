<?php

use App\Http\Controllers\ApiController;
use App\Http\Controllers\FrontendController;
use App\Http\Controllers\SearchController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/taxonomy-options/{type}', function (Request $request, $type) {
    $useValue = $request->boolean('use_value', false);
    $asOptions = $request->boolean('as_options', false);
    $parent = $request->input('parent', null);
    $parent_id = $request->input('parent_id', null);
    $not_id = $request->input('not_id', null);

    $effectiveParent = !is_null($parent) ? $parent : $parent_id;

    // Auto-resolve string titles to taxonomy ID if parent is passed as name
    $resolvedParentId = null;
    if (!empty($effectiveParent)) {
        if (is_numeric($effectiveParent)) {
            $resolvedParentId = (int) $effectiveParent;
        } else {
            $foundParent = \Illuminate\Support\Facades\DB::table('taxonomies')->where('title', $effectiveParent)->first();
            if ($foundParent) {
                $resolvedParentId = $foundParent->id;
            }
        }
    }

    // On-demand State/City population from states.json and cities.json if not yet imported
    if ($type === 'state' && $resolvedParentId) {
        $stateCount = \Illuminate\Support\Facades\DB::table('taxonomies')
            ->where('type', 'state')
            ->where('parent_id', $resolvedParentId)
            ->count();

        if ($stateCount === 0) {
            $countryMeta = \Illuminate\Support\Facades\DB::table('taxonomy_meta')
                ->where('taxonomy_id', $resolvedParentId)
                ->where('key', 'id')
                ->first();

            $jsonCountryId = $countryMeta->value ?? null;
            $stateFile = storage_path('app/data/states.json');

            if ($jsonCountryId && \Illuminate\Support\Facades\File::exists($stateFile)) {
                $allStates = json_decode(\Illuminate\Support\Facades\File::get($stateFile), true) ?: [];
                $countryStates = array_filter($allStates, fn($item) => (string)($item['country_id'] ?? '') === (string)$jsonCountryId);

                foreach ($countryStates as $s) {
                    $newStId = \Illuminate\Support\Facades\DB::table('taxonomies')->insertGetId([
                        'title'     => $s['name'],
                        'slug'      => \Illuminate\Support\Str::slug($s['name']),
                        'type'      => 'state',
                        'parent_id' => $resolvedParentId,
                        'status'    => 'publish',
                    ]);
                    foreach ($s as $k => $v) {
                        if ($k === 'name') continue;
                        \Illuminate\Support\Facades\DB::table('taxonomy_meta')->insert([
                            'taxonomy_id' => $newStId,
                            'key'         => $k,
                            'value'       => is_array($v) ? json_encode($v) : $v,
                        ]);
                    }
                }
            }
        }
    }

    if ($type === 'city' && $resolvedParentId) {
        $cityCount = \Illuminate\Support\Facades\DB::table('taxonomies')
            ->where('type', 'city')
            ->where('parent_id', $resolvedParentId)
            ->count();

        if ($cityCount === 0) {
            $stateMeta = \Illuminate\Support\Facades\DB::table('taxonomy_meta')
                ->where('taxonomy_id', $resolvedParentId)
                ->where('key', 'id')
                ->first();

            $jsonStateId = $stateMeta->value ?? null;
            $cityFile = storage_path('app/data/cities.json');

            if ($jsonStateId && \Illuminate\Support\Facades\File::exists($cityFile)) {
                @ini_set('memory_limit', '1024M');
                @set_time_limit(180);
                $allCities = json_decode(\Illuminate\Support\Facades\File::get($cityFile), true) ?: [];

                foreach ($allCities as $c) {
                    if ((string)($c['state_id'] ?? '') !== (string)$jsonStateId) {
                        continue;
                    }
                    $newCityId = \Illuminate\Support\Facades\DB::table('taxonomies')->insertGetId([
                        'title'     => $c['name'],
                        'slug'      => \Illuminate\Support\Str::slug($c['name']),
                        'type'      => 'city',
                        'parent_id' => $resolvedParentId,
                        'status'    => 'publish',
                    ]);
                    foreach ($c as $k => $v) {
                        if ($k === 'name') continue;
                        \Illuminate\Support\Facades\DB::table('taxonomy_meta')->insert([
                            'taxonomy_id' => $newCityId,
                            'key'         => $k,
                            'value'       => is_array($v) ? json_encode($v) : $v,
                        ]);
                    }
                }
            }
        }
    }

    $query = \Illuminate\Support\Facades\DB::table('taxonomies')->where('type', $type);

    if (!is_null($resolvedParentId)) {
        $query->where('parent_id', $resolvedParentId);
    } elseif (!is_null($effectiveParent)) {
        $query->where('parent_id', $effectiveParent);
    }

    if (!is_null($not_id)) {
        $query->where('id', '!=', $not_id);
    }

    $results = $query->orderBy('title', 'asc')->get();

    if ($asOptions || $useValue) {
        $options = [];
        foreach ($results as $item) {
            $options[] = [
                'id' => $useValue ? $item->title : $item->id,
                'title' => $item->title
            ];
        }
        return response()->json($options);
    }

    return response()->json($results);
});
Route::get(
    '/menu-options/',
    function (Request $request) {
        $parent_id = $request->input('parent_id', null);
        $menus = \Illuminate\Support\Facades\DB::table('menu')
            ->where('parent_id', !is_null($parent_id) ? 0 : $parent_id)
            ->get();
        foreach ($menus as $menu) {
            $menu->children = \Illuminate\Support\Facades\DB::table('menu')->where('parent_id', $menu->id)->get();
        }
        return response()->json($menus);
    }
);
Route::get('/menu-locations', function () {
    return response()->json(
        \Illuminate\Support\Facades\DB::table('menu')->whereNotNull('location')->distinct()->pluck('location')->map(function ($location) {
            return ['id' => $location, 'title' => ucfirst($location)];
        })
    );
});
Route::get('/roles-options', function () {
    return response()->json(
        \Illuminate\Support\Facades\DB::table('roles')->where('status', 'publish')->get()
    );
});
Route::get('/attribute-options', function () {
    return response()->json(
        \Illuminate\Support\Facades\DB::table('attributes')->distinct()->pluck('name')->map(function ($name) {
            return ['id' => $name, 'title' => $name];
        })
    );
});
Route::middleware('web')->get('/auth', [ApiController::class, 'authCheck'])->name('api.auth');
Route::get('/hello', function () {
    return response()->json(
        \Illuminate\Support\Facades\DB::table('roles')->where('status', 'publish')->get()
    );
});
Route::get('/ads', [ApiController::class, 'ads'])->name('api.ads');
Route::get('/geocode', [ApiController::class, 'geocode'])->name('api.geocode');
Route::get('/detect-country', [ApiController::class, 'detectCountry'])->name('api.detect-country');
Route::get('/banners-message', [
    ApiController::class,
    'bannersMessage'
])->name('api.message.banner');
Route::get('/header-setting', [ApiController::class, 'headerSettings'])->name('header.setting');
Route::get('/footer-setting', [ApiController::class, 'footerSettings'])->name('footer.setting');
Route::get('/language', [ApiController::class, 'language'])->name('language');
Route::get('/get_menu', [ApiController::class, 'menu'])->name('menu');

Route::get('/language/{lang}', [ApiController::class, 'get_language'])->name('language.get');

Route::post('/add-lang-key', [ApiController::class, 'addLangKey'])->name('language.add_key');
Route::get('/image/{filename}', [ApiController::class, 'image'])->name('image');
Route::get('/get_taxonomies', [ApiController::class, 'get_taxonomies'])->name('api.get_taxonomies');
Route::get('/get_posts', [ApiController::class, 'get_posts'])->name('api.get_posts');
Route::get('/setting', [ApiController::class, 'setting'])->name('api.setting');
// Route::controller(FrontendController::class)->group(function () {
//     Route::get('/index', 'index')->name('api.index');
//     Route::get('/header', 'header')->name('api.header');
//     Route::post('/get_taxonomies', 'get_taxonomies')->name('api.get_taxonomies');
// });

Route::middleware('web')->get('/reviews/product/{postId}', [\App\Http\Controllers\ReviewController::class, 'productReviews'])->name('api.reviews.product');
Route::middleware('web')->post('/reviews', [\App\Http\Controllers\ReviewController::class, 'store'])->name('api.reviews.store');
Route::middleware('web')->post('/reviews/{id}/like', [\App\Http\Controllers\ReviewController::class, 'like'])->name('api.reviews.like');
Route::middleware('web')->post('/reviews/{id}/report', [\App\Http\Controllers\ReviewController::class, 'report'])->name('api.reviews.report');

// Cart & Orders
Route::middleware('web')->group(function () {
    Route::post('/cart/order', [\App\Http\Controllers\CartController::class, 'placeOrder'])->name('api.cart.order');
    Route::get('/cart/stock', [\App\Http\Controllers\CartController::class, 'checkStock'])->name('api.cart.stock');

    // Order cancellation & refund
    Route::post('/orders/{orderId}/cancel', [\App\Http\Controllers\StripeController::class, 'cancelOrder'])->name('api.orders.cancel');
    Route::post('/orders/{orderId}/attach-payment', [\App\Http\Controllers\StripeController::class, 'attachPaymentIntent'])->name('api.orders.attach-payment');

    // Auto-detected country saving
    Route::post('/user/save-country', [\App\Http\Controllers\ProfileController::class, 'saveCountry'])->name('api.user.save-country');

    // Phone OTP Verification via SMS / WhatsApp
    Route::post('/user/phone/send-otp', [\App\Http\Controllers\ProfileController::class, 'sendPhoneOtp'])->name('api.user.phone.send-otp');
    Route::post('/user/phone/verify-otp', [\App\Http\Controllers\ProfileController::class, 'verifyPhoneOtp'])->name('api.user.phone.verify-otp');

    // Email OTP Verification (Delete Account, Change Email, Verification)
    Route::post('/user/email/send-otp', [\App\Http\Controllers\ProfileController::class, 'sendEmailOtp'])->name('api.user.email.send-otp');
    Route::post('/user/email/verify-otp', [\App\Http\Controllers\ProfileController::class, 'verifyEmailOtp'])->name('api.user.email.verify-otp');

    // Notifications (New Products & Orders + Chrome Web Notifications)
    Route::get('/notifications', [\App\Http\Controllers\FrontendController::class, 'getNotifications'])->name('api.notifications');
});
