<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

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

    private function productQuery(array $extra = []): array
    {
        return array_merge([
            'type' => 'product',
            'image' => true,
            'meta' => true,
            'category' => true,
            'brand' => true,
            'gallery' => true,
            'parent' => true,
            'variation' => true,
            'address' => true,
        ], $extra);
    }

    public function index()
    {
        $data = [];
        $index_settings = $this->settings['layout']['Home'];

        if ($index_settings['slider_toggle'] && count($index_settings['main_slider']) > 0) {
            $data['main_slider'] = $index_settings['main_slider'];
        }

        if ($index_settings['categories_toggle']) {
            $data['categories'] = get_taxonomy([
                'type' => 'category',
                'id' => $index_settings['home_categories'],
                'limit' => 10,
                'image' => true,
                'meta' => true,
            ]);
        }

        if ($index_settings['latest_product_toggle']) {
            $data['latest_products'] = get_posts($this->productQuery([
                'limit' => 10,
                'latest' => true,
            ]));
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
            'data' => $data,
        ]);
    }

    public function singleProduct(Request $request)
    {
        $product = get_posts($this->productQuery([
            'single' => true,
            'attributes' => true,
            'sku' => $request->sku,
            'id' => $request->id,
        ]));

        if (! $product) {
            abort(404);
        }

        $latest_products = get_posts($this->productQuery([
            'limit' => 4,
            'latest' => true,
            'exclude_id' => $product->id ?? null,
        ]));

        $categoryId = $product->category[0]->id ?? $product->category[0]['id'] ?? null;

        $related_products = get_posts($this->productQuery([
            'limit' => 10,
            'category_id' => $categoryId,
            'exclude_id' => $product->id ?? null,
        ]));

        $popular_products = get_posts($this->productQuery([
            'limit' => 10,
            'popular' => true,
            'views' => 'desc',
            'exclude_id' => $product->id,
        ]));

        $this->recordProductView($request, (int) $product->id);

        return Inertia::render('Frontend/Single/Index', [
            'product' => $product,
            'latest_products' => $latest_products,
            'related_products' => $related_products,
            'popular_products' => $popular_products,
        ]);
    }

    private function recordProductView(Request $request, int $productId): void
    {
        $userId = Auth::id();
        if ($userId) {
            $viewed = DB::table('user_meta')
                ->where('user_id', $userId)
                ->where('key', 'viewed_products')
                ->first();

            if ($viewed) {
                $viewedIds = array_filter(explode(',', (string) $viewed->value));
                if (! in_array((string) $productId, $viewedIds, true)) {
                    DB::table('user_meta')
                        ->where('id', $viewed->id)
                        ->update(['value' => $productId.','.$viewed->value]);
                }
            } else {
                DB::table('user_meta')->insert([
                    'user_id' => $userId,
                    'key' => 'viewed_products',
                    'value' => (string) $productId,
                ]);
            }

        $sessionKey = 'viewed_product_'.$productId;
        if ($request->session()->has($sessionKey)) {
            return;
        }

        $request->session()->put($sessionKey, true);
                if (! in_array((string) $productId, $viewedIds, true)) {
                 $updated = DB::table('post_meta')
            ->where('post_id', $productId)
            ->where('key', 'views')
            ->increment('value');

        if ($updated === 0) {
            DB::table('post_meta')->insert([
                'post_id' => $productId,
                'key' => 'views',
                'value' => 1,
            ]);
        }
                }
        }

       
    }

    private function buildMenuTree($elements, $parentId = 0, $location = null)
    {
        $branch = [];
        foreach ($elements as $element) {
            $element = (array) $element;
            if ($element['parent_id'] == $parentId && (! $location || $element['location'] == $location)) {
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

    public function get_languages()
    {
        $file_location = $this->json_file_location . '/lang/language.json';
        if (file_exists($file_location)) {
            $languages = file_get_contents($file_location);

            return response()->json(json_decode($languages));
        }

        return response()->json([]);
    }

    public function setLanguage(Request $request, string $prefix)
    {
        $prefix = preg_replace('/[^a-z0-9]/i', '', $prefix) ?: 'en';
        $redirect = $request->headers->get('referer') ?: route('index');

        return redirect($redirect)->cookie('locale', $prefix, 60 * 24 * 365);
    }
}
