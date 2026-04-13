<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class FrontendController extends Controller
{
    public $settings;
    public $header;

    function __construct()
    {
        parent::__construct();
        $this->settings = view()->shared('setting');
        $headerLocation = $this->settings['menu']['header_menu']['value'] ?? 'header';
        
        $allMenus = DB::table('menu')->get()->toArray();
        $this->header = $this->buildMenuTree($allMenus, 0, $headerLocation);
    }

    private function buildMenuTree($elements, $parentId = 0, $location = null)
    {
        $branch = [];
        foreach ($elements as $element) {
            $element = (array) $element;
            if ($element['parent_id'] == $parentId && (!$location || $element['location'] == $location)) {
                $children = $this->buildMenuTree($elements, $element['id']);
                $element['children'] = $children ?: [];
                $branch[] = $element;
            }
        }
        return $branch;
    }

    public function header()
    {
        return ['header_links' => $this->header];
    }

    public function setting()
    {
        return $this->settings;
    }

    public function index()
    {
        return redirect()->away(config('app.frontend_url'));
    }

    public function get_taxonomies(Request $request)
    {
        $taxonomies = DB::table('taxonomies')->where([
            'type' => $request->type,
            'status' => 'publish',
        ]);

        if (!is_null($request->limit)) {
            $taxonomies->limit($request->limit);
        }

        $result = $taxonomies->get()->map(function($item) {
            $item->image = DB::table('media')->where('parent_id', $item->id)->where('type', $item->type)->first();
            // Handle simple list children if needed
            $item->children = DB::table('taxonomies')->where('parent_id', $item->id)->get();
            return $item;
        });

        return response()->json($result);
    }
}
