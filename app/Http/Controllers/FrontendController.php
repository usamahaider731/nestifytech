<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use App\Models\Taxonomy;
use App\Providers\AppServiceProvider;
use Illuminate\Http\Request;

class FrontendController extends Controller
{
   public $settings;
   public $header;
   function __construct()
   {
      $this->settings = view()->shared('setting');

      $this->header = Menu::where('parent_id', 0)->where('location', 'header')->with('children')->get();
   }
   public function header()
   {
      $header = $this->header;
      return ['header_links' => $header];
   }
   public function setting()
   {

      return  $this->settings;
   }
   public function index()
   {
      $categories = Taxonomy::where('type', 'category')->where('status', 'publish')->with('image', 'children')->get();
      return ['categories' => $categories];
   }
   public function get_taxonomies(Request $request)
   {
      // Always initialize the query first
      $taxonomies = Taxonomy::query();

      // Apply filters
      if (empty($request->data)) {
         $taxonomies->where([
            'type' => $request->type,
            'status' => 'publish',
         ])->with(['image', 'children']);
      }

      if (!is_null($request->limit)) {
         $taxonomies->limit($request->limit);
      }

      // Must return the result of ->get()
      $result = $taxonomies->get();

      return response()->json($result);
   }
}
