<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use App\Http\Controllers\ApiController;

class FrontendController extends Controller
{
    public $settings;
    public $header;
    function __construct()
    {
        parent::__construct();

        $this->settings = view()->shared('setting');
        $headerLocation = $this->settings['menu']['header_menu']['value'] ?? 'header';

        $allMenus = DB::table('menu')->orderBy('sort_order', 'asc')->get()->toArray();
        $this->header = $this->buildMenuTree($allMenus, 0, $headerLocation);
    }
    public function index()

    {
        $data = [];
        $api_controller = new ApiController();

        $index_settings = $this->settings['layout']['Home'];
        if ($index_settings['slider_toggle'] && count($index_settings['main_slider']) > 0) {
           $data['main_slider'] =  $index_settings['main_slider'];
        }
        if ($index_settings['categories_toggle']) {
            $categories_ids = $index_settings['home_categories'];
            $categories = $api_controller->get_taxonomies(Request::create(
                '/api/get_taxonomies',
                'GET',
                [
                    'type' => 'category',
                    'limit' => 10,
                    'id' => $categories_ids,
                    'image' => true,
                    'meta' => true,
                ]
            ))->getData(true);
            $data['categories'] = $categories;
        }
        if ($index_settings['latest_product_toggle']) {
            $request = Request::create(
                '/api/get_posts',
                'GET',
                [
                    'type' => 'product',
                    'limit' => 10,
                    'image' => true,
                    'meta' => true,
                    'category' =>true,
                    'brand' => true,
                    'gallery' => true,
                    'parent' => true,
                    'variation' => true,
                    'address' => true
                ]
            );
            $latest_products = $api_controller->get_posts($request)->getData(true);
            $data['latest_products'] = $latest_products;
        }

        $blockImages = $index_settings['block_images'] ?? [];
        $heroImage = is_array($blockImages) && count($blockImages) > 0 ? $blockImages[0] : null;

        $data['hero'] = [
            'badge' => $this->settings['site']['featured_tag']['value'] ?? 'New Arrivals',
            'title' => $this->settings['site']['name']['value'] ?? 'Welcome',
            'subtitle' => $this->settings['site']['tagline']['value'] ?? 'Shop the World',
            'description' => $this->settings['site']['banner_text']['value'] ?? '',
            'ctaText' => 'Shop Now',
            'ctaHref' => '#products',
            'image' => $heroImage ?? '/assets/image/mobiles.webp',
        ];

        return Inertia::render('Frontend/Index/Index', [
            'data' => $data
        ]);
    }
    public function singleProduct(Request $request){
        $api_controller = new ApiController();
        $product = $api_controller->get_posts(Request::create(
            '/api/get_posts',
            'GET',
            [
                'type' => 'product',
                'limit' => 10,
                'single' => true,
                'image' => true,
                'meta' => true,
                'category' =>true,
                'brand' => true,
                'gallery' => true,
                'parent' => true,
                'variation' => true,
                'address' => true,
                'sku' => $request->sku,
                'id' => $request->id
            ]
        ))->getData(true);
        dd($product);
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


    public function get_taxonomies(Request $request)
    {
        $taxonomies = DB::table('taxonomies')->where([
            'type' => $request->type,
            'status' => 'publish',
        ]);

        if (!is_null($request->limit)) {
            $taxonomies->limit($request->limit);
        }
        if (!is_null($request->id)) {
            $taxonomies->whereIn('id', $request->id);
        }
        $result = $taxonomies->get()->map(function ($item) {
            $item->image = DB::table('media')->where('parent_id', $item->id)->where('type', $item->type)->first();
            // Handle simple list children if needed
            $item->children = DB::table('taxonomies')->where('parent_id', $item->id)->get();
            return $item;
        });

        return response()->json($result);
    }
    public function get_languages()
    {
        $file_location = $this->json_file_location . '/lang/language.json';
        if (file_exists($file_location)) {
            $languages = file_get_contents($file_location);
            return response()->json(json_decode($languages));
        }
        return response()->json([]);
    }
}
