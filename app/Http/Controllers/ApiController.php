<?php

namespace App\Http\Controllers;

use App\Models\PostTaxonomy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Filesystem\Filesystem;

class ApiController extends Controller
{
    public $file_location;

    function __construct()
    {
        parent::__construct();
        $this->file_location = $this->json_file_location;
    }

    public function menu(Request $request)
    {
        $query = DB::table('menu')->orderBy('sort_order', 'asc');
        if ($request->location) {
            $query->where('location', $request->location);
        }
        return response()->json($query->get()->values());
    }

    public function bannersMessage()
    {
        $settings = json_decode(file_get_contents($this->file_location . "/setting.json"), true);
        $banners = [
            'banner_text' => $settings['site']['banner_text']['value'] ?? '',
        ];
        return response()->json($banners);
    }

    public function headerSettings()
    {
        $layout = json_decode(file_get_contents($this->file_location . '/layout.json'), true);
        $header_layout = $layout['layout']['Header'];
        $header_var = [];
        foreach ($header_layout as $key => $sections) {
            foreach ($sections['fields'] as $value) {
                $header_var[$value['name']] = $value['value'];
            }
        }
        $site_setting = $this->site_setting();
        foreach ($site_setting as $key => $value) {
            if (in_array($key, ['light_logo', 'dark_logo', 'name', 'tagline'])) {
                $header_var[$key] = $value;
            }
        }
        return response()->json($header_var);
    }

    public function footerSettings()
    {
        $layout = json_decode(file_get_contents($this->file_location . '/layout.json'), true);
        $footer_layout = $layout['layout']['Footer'];
        $footer_var = [];
        foreach ($footer_layout as $key => $sections) {
            foreach ($sections['fields'] as $value) {
                $footer_var[$value['name']] = $value['value'];
            }
        }
        return response()->json($footer_var);
    }

    public function site_setting()
    {
        $setting_file = $this->file_location . '/setting.json';
        $stvu = [];
        if (file_exists($setting_file)) {
            $setting = json_decode(file_get_contents($setting_file), true);
            if (isset($setting['site'])) {
                $site_setting = $setting['site'];
                foreach ($site_setting as $key => $value) {
                    $stvu[$key] = $value['value'];
                }
            }
        }
        return $stvu;
    }

    public function language()
    {
        $languages = json_decode(file_get_contents($this->file_location . '/lang/language.json'), true);
        return response()->json($languages);
    }

    public function authCheck(Request $request)
    {
        if (auth('web')->check()) {
            return response()->json(auth('web')->user());
        }
        return response()->json(['status' => 'unauthenticated', 'message' => 'User is not logged in.'], 401);
    }

    public function get_language($language)
    {
        $langFile = $this->file_location . '/lang/' . $language . '_lang.json';
        if (file_exists($langFile)) {
            $lang_data = json_decode(file_get_contents($langFile), true) ?: [];
            return response()->json($lang_data);
        }
        return response()->json([], 404);
    }

    public function image(Request $request, $filename)
    {
        $path = public_path($request->thumb ? 'storage/uploads/image/thumb/' . $filename : 'storage/uploads/image/' . $filename);
        if (!file_exists($path)) abort(404);
        $image = file_get_contents($path);
        $extension = pathinfo($path, PATHINFO_EXTENSION);
        $contentType = 'image/jpeg';
        if ($extension == 'png') $contentType = 'image/png';
        elseif ($extension == 'svg') $contentType = 'image/svg+xml';
        elseif ($extension == 'gif') $contentType = 'image/gif';
        return response($image)->header('Content-Type', $contentType);
    }

    public function get_taxonomies(Request $request)
    {
        $taxonomies = PostTaxonomy::query();
        $taxonomies->where('status', 'publish');

        if ($request->id) {
            $ids = is_array($request->id) ? $request->id : explode(',', $request->id);
            $taxonomies->whereIn('id', $ids);
        }
        if (isset($request->parent_id)) $taxonomies->where('parent_id', $request->parent_id);
        if ($request->type) $taxonomies->where('type', $request->type);
        if ($request->slug) $taxonomies->where('slug', $request->slug);

        if ($request->post) $taxonomies->with('posts');
        if ($request->image) $taxonomies->with('image');
        if ($request->meta) $taxonomies->with('meta');

        $result = $taxonomies->get();

        $result->each(function ($item) {
            if ($item->relationLoaded('meta')) {
                $item->setRelation('meta', $item->meta->keyBy('key'));
            }
        });

        return response()->json($result);
    }
    public function get_products(Request $request)
    {
        $products = PostTaxonomy::forTable('posts')->where(['status' => 'publish', 'type' => 'product']);
        if ($request->id) $products->where('id', $request->id);
        if ($request->keyword) $products->where('title', 'like', "%{$request->keyword}%");
        if ($request->latest) $products->orderBy('created_at', 'desc');
        if ($request->limit) $products->limit($request->limit);
        if ($request->image) $products->with('image');
        if ($request->meta) $products->with('meta');
        if ($request->gallery) $products->with('gallery');
        if ($request->parent) $products->with('parent');

        $result = $products->get();

        $result->each(function ($item) {
            if ($item->relationLoaded('meta')) {
                $item->setRelation('meta', $item->meta->keyBy('key'));
            }
        });

        return response()->json($result);
    }
    public function get_image($parent_id, $parent_type = 'taxonomy', $is_multiple = false)
    {
        if (!$is_multiple) {
            $table = DB::table('media')->where(['type' => $parent_type, 'parent_id' => $parent_id])->first();
        } else {
            $table = DB::table('media')->where(['type' => $parent_type, 'parent_id' => $parent_id])->get();
        }
        return $table;
    }
    public function get_posts(Request $request)
    {
        $posts = PostTaxonomy::forTable('posts')->where('status', 'publish');

        if ($request->id) $posts->where('id', $request->id);
        if ($request->sku) $posts->where('sku', $request->sku);
        if ($request->slug) $posts->where('slug', $request->slug);
        if ($request->keyword) $posts->where('title', 'like', "%{$request->keyword}%");
        if ($request->type) $posts->where('type', $request->type);
        if ($request->limit) $posts->limit($request->limit);
        if ($request->latest) $posts->orderBy('created_at', 'desc');
        if ($request->image) $posts->with('image');
        if ($request->gallery) $posts->with('gallery');
        if ($request->parent) $posts->with('parent');
        if ($request->meta || $request->category || $request->brand || $request->tags) {
            $posts->with('meta');
        }

        if ($request->variation) {
            // variations are appended automatically via getVariationsAttribute, but if not we could append here
            // We just ensure it's loaded if it were a relation, but it's an accessor.
        }
     
        $result = $posts->get();
        

        $result->each(function ($item) {
            if ($item->relationLoaded('meta')) {
                $item->setRelation('meta', $item->meta->keyBy('key'));
            }
        });

        if ($request->category) {
            $result = PostTaxonomy::get_attribute($result, 'taxonomies', '', 'from_meta', 'category', '');
        }
        if ($request->brand) {
            $result = PostTaxonomy::get_attribute($result, 'taxonomies', '', 'from_meta', 'brand', '');
        }
        if ($request->tags) {
            $result = PostTaxonomy::get_attribute($result, 'taxonomies', '', 'from_meta', 'tags', '');
        }
        if ($request->address) {
            $result = PostTaxonomy::get_attribute($result, 'taxonomies', '', 'from_meta', ['state', 'city'], '');
        }

        if ($request->attributes) {
            $result->each(function ($item) {
                $attrValues = DB::table('attribute_values')
                    ->where(['parent_id' => $item->id, 'parent_type' => 'post'])
                    ->get();
                $item->attributes = $attrValues->map(function ($val) {
                    $def = DB::table('attributes')->where('id', $val->attribute_id)->first();
                    if (!$def || $def->group === null) {
                        return null;
                    }
                    return [
                        'group' => $val->group ?? $def->group,
                        'key' => $def->name,
                        'value' => $val->value,
                    ];
                })->filter()->values()->all();
            });
        }

        if ($request->single) {
            $result = $result->first();
        }
        return response()->json($result); 
    }

    public function setting()
    {
        $filesystem = new Filesystem();
        $settingsPath = $this->file_location . '/setting.json';
        $layoutPath = $this->file_location . '/layout.json';

        $settings = $filesystem->exists($settingsPath) ? $filesystem->get($settingsPath) : '{}';
        $layout = $filesystem->exists($layoutPath) ? $filesystem->get($layoutPath) : '{}';

        $layoutArr = json_decode($layout, true);
        $datas = [];
        if (!empty($layoutArr['layout'])) {
            foreach ($layoutArr['layout'] as $key => $value) {
                $qes = [];
                foreach ($value as $section) {
                    if (isset($section['fields'])) {
                        foreach ($section['fields'] as $val) {
                            $qes[$val['name']] = $val['value'];
                        }
                    }
                }
                $datas[$key] = $qes;
            }
        }

        $data = json_decode($settings, true) ?: [];
        $menu = DB::table('menu')->where('parent_id', 0)->orderBy('sort_order', 'asc')->get();
        foreach ($menu as $m) {
            $m->children = DB::table('menu')->where('parent_id', $m->id)->orderBy('sort_order', 'asc')->get();
        }

        $data = array_merge($data, ['menu' => $menu], ['layout' => $datas]);
        return response()->json($data);
    }
}
