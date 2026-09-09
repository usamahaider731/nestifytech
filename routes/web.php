<?php

use App\Http\Controllers\AdminBuilderController;
use App\Http\Controllers\AiController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FilterController;
use App\Http\Controllers\FrontendController;
use App\Http\Controllers\LanguageController;
use App\Http\Controllers\LayoutController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\ModuleController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\TaxonomyController;
use App\Http\Controllers\UserController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Http\Controllers\ReviewController;
Route::controller(FilterController::class)->group(function () {
    Route::post("bulk/action", "bulk_action")->name("bulk.action");
});
Route::controller(FrontendController::class)->group(function () {
    Route::get('/', 'index')->name('index');
    Route::get('/product/{sku}/{id}', 'singleProduct')->name('singleproduct');
    Route::get('/get_languages', 'get_languages')->name('languages');
});
Route::get('/image/{filename}_{height}_{width}.{extension}', [MediaController::class, 'thumbimageUrl'])
    ->where([
        'filename' => '.*', // to allow long filenames with underscores
        'height' => '[0-9]+',
        'width' => '[0-9]+',
        'extension' => '[a-zA-Z0-9]+'
    ])
    ->name('thumb.image');
Route::get('/search/keywords', [SearchController::class, 'search'])->name('search.keywords');
Route::get('/backend-colors.min.css', [SettingController::class, 'backendcolors'])->name('backend.colors');
Route::get('/colors.min.css', [SettingController::class, 'colors'])->name('colors');
Route::get('/api/color-themes', [SettingController::class, 'publicColorThemes'])->name('color.themes');
Route::get('/search-pages.json', [SettingController::class, 'searchPages'])->name('search.pages');
Route::get('/updateData', [SettingController::class, 'updateData'])->name('update');

Route::post('/ai/generate/text', [AiController::class, 'generateText'])->name('ai.generate.text');
Route::get('prac', function () {
    return view('prac');
});
Route::prefix('/admin')->middleware(['auth', 'verified'])->group(function () {
    Route::get('/', [DashboardController::class, 'dashboard'])->name('admin.dashboard');
    Route::controller(SettingController::class)->group(function () {
        Route::get('/setting/{type}', 'setting')->name('admin.setting');
        Route::post('/setting/{type}', 'settingUpdate')->name('setting.update');
        Route::post('/setting/{type}/active-colors', 'updateActiveColors')->name('setting.update.colors');
        Route::get('/transition', 'translations')->name('admin.translations')->middleware('permission:transition-read');
        Route::get('/countryUpdate', 'updateCountry')->name('admin.country.update');
        Route::get('/location/import-cities', 'importCities')->name('admin.location.import-cities');
        Route::post('/transition', 'updateTranslation')->name('admin.translations.update')->middleware('permission:transition-write');
    });
    // Admin Builder Routes
    Route::prefix('/builder')->controller(AdminBuilderController::class)->middleware('permission:developer-write')->group(function () {
        Route::get('/', 'index')->name('admin.builder.index');
        Route::get('/edit/{type}/{config_type}', 'edit')->name('admin.builder.edit');
        Route::post('/update/{id}', 'update')->name('admin.builder.update');
        Route::post('/store', 'store')->name('admin.builder.store');
        Route::delete('/destroy/{id}', 'destroy')->name('admin.builder.destroy');
    });
    Route::prefix('/module/{type}')->controller(ModuleController::class)->group(function () {
        Route::get('/migrate', 'migrate')->name('module.migrate');
        Route::get('/', 'index')->name('module.index');
        Route::get('/create', 'create')->name('module.create');
        Route::get('/edit/{id}', 'edit')->name('module.edit');
        Route::post('/submit/{id?}', 'submit')->name('module.submit');
        Route::get('/{id?}', 'index')->name('module.index.with_id');
    });
    // Keeping legacy names for backward compatibility by mapping them to ModuleController
    Route::get('/users', [ModuleController::class, 'index'])->defaults('type', 'user')->name('users');
    Route::get('/{type}/edit/{id}', [ModuleController::class, 'edit'])->defaults('type', 'user')->name('user.edit');
    Route::post('/{type}/edit/{id}', [ModuleController::class, 'submit'])->defaults('type', 'user')->name('submit.user');
    
    Route::group(['middleware' => ['permission:role-read']], function() {
        Route::get('/users-role', [ModuleController::class, 'index'])->defaults('type', 'role')->name('role');
        Route::get('/users-role/details/{id}', [ModuleController::class, 'edit'])->defaults('type', 'role')->name('role.detail');
    });

    Route::group(['middleware' => ['permission:role-write']], function() {
        Route::get('/users-role/create', [ModuleController::class, 'create'])->defaults('type', 'role')->name('role.create');
        Route::post('/users-role/create/{status}', [ModuleController::class, 'submit'])->defaults('type', 'role')->name('submit.role');
        Route::get('/users-role/edit/{id}', [ModuleController::class, 'edit'])->defaults('type', 'role')->name('edit.role');
    });

    Route::prefix('/post')->controller(ModuleController::class)->group(function () {
        Route::get('/{type}/create', 'create')->name('post.create');
        Route::get('/{type}/{id?}', 'index')->name('post.index');
        Route::get('/{type}/edit/{id}', 'edit')->name('post.edit');
        Route::post('/{type}/submit/{id?}', 'submit')->name('post.submit');
    });

    Route::prefix('/taxonomy/{type}')->controller(ModuleController::class)->group(function () {
        Route::get('/', 'index')->name('taxonomy.index');
        Route::get('/create', 'create')->name('taxonomy.create');
        Route::get('/edit/{id}', 'edit')->name('taxonomy.edit');
        Route::post('/submit/{id?}', 'submit')->name('taxonomy.submit');
    });

    Route::prefix('/attributes')->controller(ModuleController::class)->middleware('permission:attribute-read')->group(function () {
        Route::get('/', 'index')->defaults('type', 'attributes')->name('admin.attributes.index');
        Route::get('/create', 'create')->defaults('type', 'attributes')->name('admin.attributes.create')->middleware('permission:attribute-write');
        Route::post('/store', 'submit')->defaults('type', 'attributes')->name('admin.attributes.store')->middleware('permission:attribute-write');
        Route::get('/{id}', 'edit')->defaults('type', 'attributes')->name('admin.attributes.show'); // Map show to and edit for dynamic feel
        Route::get('/{id}/edit', 'edit')->defaults('type', 'attributes')->name('admin.attributes.edit')->middleware('permission:attribute-write');
        Route::post('/{id}', 'submit')->defaults('type', 'attributes')->name('admin.attributes.update')->middleware('permission:attribute-write');
        // destroy/options still need special handling if not unified, but let's keep them in AttributeController for now or unify them too
    });
    
    // Add missing destroy and options routes to ModuleController
    Route::delete('/attributes/{id}', [ModuleController::class, 'destroy'])->name('admin.attributes.destroy')->middleware('permission:attribute-write');
    Route::get('/attributes/options/list', [ModuleController::class, 'getAttributesOptions'])->name('admin.attributes.options');
    Route::get('/attributes/{attributeId}/values/options', [ModuleController::class, 'getAttributeValuesOptions'])->name('admin.attributes.values.options');
    // Keeping old named routes for backward compatibility/redirects if needed
    Route::get('/category', fn() => redirect()->route('taxonomy.index', ['type' => 'category']))->name('category.index');
    Route::get('/brand', fn() => redirect()->route('taxonomy.index', ['type' => 'brand']))->name('brand.index');
    Route::get('/tags', fn() => redirect()->route('taxonomy.index', ['type' => 'tag']))->name('admin.tags.index');
 
    Route::prefix('/language')->controller(LanguageController::class)->middleware('permission:setting-read')->group(function () {
        Route::get('/', 'index')->name('admin.lang.index');
        Route::get('/create', 'create')->name('admin.lang.create');
        Route::get('/edit/{prefix}', 'edit')->name('admin.lang.edit');
        Route::post('/create', 'submit')->name('admin.lang.submit');
        Route::post('/edit/{prefix}', 'update')->name('admin.lang.update');
    });
    Route::prefix('/layout')->controller(LayoutController::class)->group(function () {
        Route::get('/type/{type}', 'layout')->name('layout.setting');
        Route::get('/menu', 'menu')->name('menu.setting')->middleware('permission:layout-write');
        Route::post('/type/{type}', 'submitLayoutPages')->name('layout.submit');
        Route::post('/menu', 'menuSubmit')->name('menu.submit')->middleware('permission:layout-write');
        Route::post('/menu/reorder', 'menuReorder')->name('menu.reorder')->middleware('permission:layout-write');
        Route::post('/menu/update/{id}', 'menuUpdate')->name('menu.update')->middleware('permission:layout-write');
        Route::delete('/menu/{id}', 'menuDestroy')->name('menu.destroy')->middleware('permission:layout-write');
    });
    Route::prefix('/reviews')->controller(ModuleController::class)->middleware('permission:review-read')->group(function () {
        Route::get('/', 'index')->defaults('type', 'review')->name('admin.reviews.index');
        Route::delete('/{id}', 'destroy')->defaults('type', 'review')->name('admin.reviews.destroy')->middleware('permission:review-write');
    });
    Route::prefix('/ai')->controller(AiController::class)->group(function () {
        Route::post('/check/field', 'checkField')->name('ai.check.field');
    });

    // Temp image upload (used by VariationsSelector for async uploads)
    Route::post('/upload-image-temp', [MediaController::class, 'uploadTemp'])->name('admin.upload.image.temp');
});
require __DIR__ . '/auth.php';
// require __DIR__ . '/api.php';