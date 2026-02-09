<?php

use App\Http\Controllers\ApiController;
use App\Http\Controllers\FrontendController;
use App\Models\Menu;
use App\Models\Roles;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\Taxonomy;

Route::get('/taxonomy-options/{type}', function (Request $request, $type) {
    $useValue = $request->boolean('use_value', false);
    $meta = $request->input('meta', null);
    $asOptions = $request->boolean('as_options', false);
    $parent = $request->input('parent', null);
    $parent_id = $request->input('parent_id', null);
    $not_id = $request->input('not_id', null);

    return response()->json(
        Taxonomy::getOptionsForType($type, $parent, $useValue, $asOptions, $parent_id, $meta, $not_id)
    );
});
Route::get(
    '/menu-options/',
    function (Request $request) {
        //     $useValue = $request->boolean('use_value', false);
        //     $meta = $request->input('meta', null);
        //     $asOptions = $request->boolean('as_options', false);
        //     $parent = $request->input('parent', null);
            $parent_id = $request->input('parent_id', null);

       
        return response()->json(Menu::where('parent_id', !is_null($parent_id) ? 0 : $parent_id)->with('children')->get());
    }
);
Route::get('/roles-options', function () {
    return response()->json(
        Roles::where('status', 'publish')->get()
    );
});
Route::get('/hello', function () {
    return response()->json(
        Roles::where('status', 'publish')->get()
    );
});
Route::get('/banners-message', [
    ApiController::class, 'bannersMessage'
])->name('api.message.banner');
Route::get('/header-setting', [ApiController::class,'headerSettings'])->name('header.setting');
Route::get('/language', [ApiController::class,'language'])->name('language'); 
Route::get('/image/{filename}', [ApiController::class,'image'])->name('image'); 
Route::get('/get_taxonomies',[ApiController::class, 'get_taxonomies'])->name('api.get_taxonomies');
// Route::controller(FrontendController::class)->group(function () {
//     Route::get('/index', 'index')->name('api.index');
//     Route::get('/header', 'header')->name('api.header');
//     Route::get('/setting', 'setting')->name('api.setting');
//     Route::post('/get_taxonomies', 'get_taxonomies')->name('api.get_taxonomies');
// });
