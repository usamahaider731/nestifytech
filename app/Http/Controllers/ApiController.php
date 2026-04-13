<?php
namespace App\Http\Controllers;
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
        $query = DB::table('menu');
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
        $taxonomies = DB::table('taxonomies')->where('status', 'publish');
        if ($request->id) $taxonomies->where('id', $request->id);
        if (isset($request->parent_id)) $taxonomies->where('parent_id', $request->parent_id);
        if ($request->type) $taxonomies->where('type', $request->type);
        if ($request->slug) $taxonomies->where('slug', $request->slug);

        $result = $taxonomies->get();
        return response()->json($result);
    }

    public function get_posts(Request $request)
    {
        $posts = DB::table('posts')->where('status', 'publish');
        if ($request->id) $posts->where('id', $request->id);
        if ($request->keyword) $posts->where('title', 'like', "%{$request->keyword}%");
        if ($request->type) $posts->where('type', $request->type);
        if ($request->limit) $posts->limit($request->limit);
        
        $result = $posts->get();
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
        $menu = DB::table('menu')->where('parent_id', 0)->get();
        // Simple manual recursion for children if needed
        foreach ($menu as $m) {
            $m->children = DB::table('menu')->where('parent_id', $m->id)->get();
        }

        $data = array_merge($data, ['menu' => $menu], ['layout' => $datas]);
        return response()->json($data);
    }
}