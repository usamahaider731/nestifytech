<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ApiController extends Controller
{
   public $file_location;
    function __construct()
    {
        parent::__construct();
        $this->file_location = $this->json_file_location;

    }
    public function bannersMessage(){
        
        $settings = json_decode(file_get_contents($this->file_location."/setting.json"), true);
        $banners = [
            'banner_text' => $settings['site']['banner_text']['value'] ?? '',
        ];
        return response()->json($banners);
    }
    public function headerSettings(){
        $layout = json_decode(file_get_contents($this->file_location.'/layout.json'), true);
        
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
    public function setting(){
        
    }
}
