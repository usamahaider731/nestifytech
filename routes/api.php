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

    $query = \Illuminate\Support\Facades\DB::table('taxonomies')->where('type', $type);

    if (!is_null($parent)) $query->where('parent_id', $parent);
    if (!is_null($parent_id)) $query->where('parent_id', $parent_id);
    if (!is_null($not_id)) $query->where('id', '!=', $not_id);

    $results = $query->get();

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

Route::get('/reviews/product/{postId}', [\App\Http\Controllers\ReviewController::class, 'productReviews'])->name('api.reviews.product');
Route::middleware('web')->post('/reviews', [\App\Http\Controllers\ReviewController::class, 'store'])->name('api.reviews.store');
