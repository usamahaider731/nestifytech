<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ApiController extends Controller
{
    public static function bannersMessage(){
        
        $settings = json_decode(file_get_contents(public_path('data/setting.json')), true);
        $banners = [
            'banner_text' => $settings['site']['banner_text']['value'] ?? '',
        ];
        return response()->json($banners);
    }
    public function headerSettings(){
        $layout = json_decode(file_get_contents(public_path('data/layout.json')), true);
        
        $header_layout = $layout['layout']['Header'];
        $header_var =[];
        foreach ($header_layout as $key => $sections) {
            foreach ($sections['fields'] as $value) {
            // dd( $value);

                $header_var[$value['name']] = $value['value'];
                
            }
        }
        return response()->json($header_var);
    }
}
