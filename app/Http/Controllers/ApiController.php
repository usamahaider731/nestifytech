<?php

namespace App\Http\Controllers;

use App\Models\Taxonomy;
use Illuminate\Http\Request;

class ApiController extends Controller
{
    public $file_location;
    function __construct()
    {
        parent::__construct();
        $this->file_location = $this->json_file_location;
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
                // dd( $value);

                $header_var[$value['name']] = $value['value'];
            }
        }
        $site_setting = $this->setting();
        foreach ($site_setting as $key => $value) {
            if($key == 'light_logo' || $key =='dark_logo' || $key =='name' || $key =='tagline'){
                $header_var[$key] = $value;
            }
        }
        return response()->json($header_var);
    }
    public function setting() {
        $setting_file = $this->file_location . '/setting.json';
        $stvu = [];
        if(file_exists($setting_file)){
            $setting = json_decode(file_get_contents($setting_file), true);
            $site_setting = $setting['site'];
            foreach ($site_setting as $key => $value) {
                $stvu[$key] = $value['value'];
            }
        }
        return $stvu;
    }
    public function language()
    {
        $languages = json_decode(file_get_contents($this->file_location . '/lang/language.json'), true);
        return response()->json($languages);
    }
    function get_language($language)
    {
        $languages = json_decode(file_get_contents($this->file_location . '/lang/language.json'), true);
        $lang_data = json_decode(file_get_contents($this->file_location . '/lang/' . $language . '_lang.json'), true);
        if (count($lang_data) > 0) {
            return response()->json($lang_data);
        }
    }
    public  function addLangKey(Request $request)
    {
        $key = $request->key;
        $lang = $request->lang;
        $default_lang_file = $this->file_location . '/lang/lang.json';
        $lang_file = $this->file_location . "/lang/{$lang}_lang.json";
        if (file_exists($default_lang_file)) {
            $default_lang_json =  file_get_contents($default_lang_file);
            $default_lang = json_decode($default_lang_json, true);
            $is_key_there = false;
            foreach ($default_lang as $k => $value) {
                if ($k == $key) {
                    $is_key_there = true;
                    break;
                }
            }
            if (!$is_key_there) {
                $default_lang[$key] = $key;
            }
            $default_lang_json = json_encode($default_lang, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            file_put_contents($default_lang_file, $default_lang_json);
        }
        if (file_exists($lang_file)) {
            $lang_json =  file_get_contents($lang_file);
            $lang = json_decode($lang_json, true);
            if (!isset($lang[$key])) {
                $lang[$key] = $key;
            }
            $lang_json = json_encode($lang, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            file_put_contents($lang_file, $lang_json);
        }
        return response()->json(['message' => 'Lang Key Added Successfully', 'status' => 200]);
    }
    
    public function image(Request $request, $filename)
    {
        $thumb = false;
        if ($request->thumb) {
            $thumb = true;
        }
        if ($thumb) {
            $path = public_path('storage/uploads/image/thumb/' . $filename);
        } else {
            $path = public_path('storage/uploads/image/' . $filename);
        }
        if (!file_exists($path)) {
            abort(404);
        }
        $image = file_get_contents($path);
        return response($image)->header('Content-Type', 'image/jpeg');
    }
    public function get_taxonomies(Request $request){
      $taxonomies = Taxonomy::where('status','publish');
      if($request->id){
        $taxonomies = $taxonomies->where('id',$request->id);
      }
      if($request->status){
        $taxonomies = $taxonomies->where('status',$request->status);
      }
      if($request->parent_id){
        $taxonomies = $taxonomies->where('parent_id',$request->parent_id);
      }
      if($request->type){
        $taxonomies = $taxonomies->where('type',$request->type);
      }
      if($request->slug){
        $taxonomies = $taxonomies->where('slug',$request->slug);
      }
      $taxonomies = $taxonomies->get();
      return response()->json($taxonomies);
    }
}