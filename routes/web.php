<?php

use App\Http\Controllers\AttributeController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\FrontendController;
use App\Http\Controllers\LanguageController;
use App\Http\Controllers\LayoutController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\TagsController;
use App\Http\Controllers\UserController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::controller(FrontendController::class)->group(function(){
    Route::get('/','index')->name('index');
});
Route::get('/image/{filename}_{height}_{width}.{extension}', [MediaController::class, 'thumbimageUrl'])
    ->where([
        'filename' => '.*', // to allow long filenames with underscores
        'height' => '[0-9]+',
        'width' => '[0-9]+',
        'extension' => '[a-zA-Z0-9]+'
    ])
    ->name('thumb.image');
Route::get('/backend-colors.min.css', [SettingController::class, 'backendcolors'])->name('backend.colors');
Route::get('/colors.min.css', [SettingController::class, 'colors'])->name('colors');
Route::get('/updateData', [SettingController::class, 'updateData'])->name('update');
Route::prefix('/admin')->middleware('auth', 'verified')->group(function () {

    Route::get('/dashboard', function () {

        return Inertia::render('Dashboard');
    })->name('admin.dashboard');
    Route::controller(SettingController::class)->group(function () {
        Route::get('/setting/{type}', 'setting')->name('admin.setting');
        Route::post('/setting/{type}', 'settingUpdate')->name('setting.update');
        Route::get('/transition', 'translations')->name('admin.translations');
        Route::get('/countryUpdate', 'updateCountry')->name('admin.country.update');
        Route::post('/transition', 'updateTranslation')->name('admin.translations.update');
    });
   
    Route::get('/users', [UserController::class, 'users'])->name('users');
    Route::get('/user/edit/{id}', [UserController::class, 'userEdit'])->name('user.edit');
    Route::post('/user/edit/{id}', [UserController::class, 'userEditSubmit'])->name('submit.user');
    Route::get('/users-role', [UserController::class, 'Role'])->name('role');
    Route::get('/users-role/create', [UserController::class, 'RoleManage'])->name('role.create');
    Route::get('/users-role/details/{id}', [UserController::class, 'RoleDetail'])->name('role.detail');
    Route::post('/users-role/create/{status}', [UserController::class, 'RoleSubmit'])->name('submit.role');
    Route::get('/users-role/edit/{id}', [UserController::class, 'RoleManage'])->name('edit.role');
    Route::prefix('/post')->controller(PostController::class)->group(function () {
        Route::get('/{post}/create', 'create')->name('post.create');
        Route::get('/{post}/{id?}', 'index')->name('post.index');
        Route::get('/{post}/edit/{id}', 'edit')->name('post.edit');
        Route::post('/{post}/submit/{id?}', 'submit')->name('post.submit');
    });
    Route::prefix('/category')->controller(CategoryController::class)->group(function () {
        Route::get('/create', 'create')->name('category.create');
        Route::post('/create', 'submit')->name('create.category');
        Route::post('/edit/{id}', 'submit')->name('edit.category');
        Route::get('/', 'index')->name('category.index');
        Route::get('/edit/{id}', 'edit')->name('category.edit');
    });
    Route::prefix('/brand')->controller(BrandController::class)->group(function () {
        Route::get('/', 'index')->name('brand.index');
        Route::get('/create', 'create')->name('brand.create');
        Route::get('/edit/{id}', 'edit')->name('brand.edit');
        Route::post('/create', 'submit')->name('create.brand');
        Route::post('/edit/{id}', 'submit')->name('edit.brand');
    });
    
    Route::prefix('/attributes')->controller(AttributeController::class)->group(function () {
        Route::get('/', 'index')->name('admin.attributes.index');
        Route::get('/create', 'create')->name('admin.attributes.create');
        Route::post('/store', 'store')->name('admin.attributes.store');
        Route::get('/{id}', 'show')->name('admin.attributes.show');
        Route::get('/{id}/edit', 'edit')->name('admin.attributes.edit');
        Route::post('/{id}', 'update')->name('admin.attributes.update');
        Route::delete('/{id}', 'destroy')->name('admin.attributes.destroy');
        Route::get('/options/list', 'getAttributesOptions')->name('admin.attributes.options');
        Route::get('/{attributeId}/values/options', 'getAttributeValuesOptions')->name('admin.attributes.values.options');
    });
    Route::prefix('/tags')->controller(TagsController::class)->group(function() {
        Route::get('/','index')->name('admin.tags.index');
        Route::post('/submit','submit')->name('tags.submit');
        Route::post('/update/{id}','update')->name('tags.update');
    });
    Route::prefix('/language')->controller(LanguageController::class)->group(function(){
        Route::get('/create','create')->name('admin.lang.create');
    });
    Route::prefix('/layout')->controller(LayoutController::class)->group(function() {
        Route::get('/type/{type}','layout')->name('layout.setting');
        Route::get('/menu','menu')->name('menu.setting');
        Route::post('/type/{type}','submitLayoutPages')->name('layout.submit');
        Route::post('/menu','menuSubmit')->name('menu.submit');
        Route::post('/menu/update/{id}','menuUpdate')->name('menu.update');
    });
});
require __DIR__ . '/auth.php';
// require __DIR__ . '/api.php';