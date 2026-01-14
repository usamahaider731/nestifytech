<?php
namespace App\Http\Middleware;


use App\Models\Settings;
use App\Models\State;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Menu;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\View;
class Authorization{
    public function handle(Request $request, Closure $next): Response
    {
 
        $api_keys = Settings::where('a', 'api_keys')->first()->value;

        $key =  $request->header('Authorization');

      $valid = false;
      if($key){

          foreach($api_keys['keys'] as $v){
              
              if($v['api_key'] == $key){
                  $valid  =true;
                }
            }
        }
      
        if(! $valid){
            return response(['error'=>true, 'message'=>'Invalid API key'], 200);
        }
        return $next($request);
    }

}