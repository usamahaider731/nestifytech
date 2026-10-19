<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
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
            'tags' => true,
            'gallery' => true,
            'parent' => true,
            'variation' => true,
            'address' => true,
        ], $extra);
    }
    private function taxonomyQuery(array $extra = []): array
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

    private function blogQuery(array $extra = []): array
    {

        return array_merge([
            'type' => 'blog',
            'image' => true,
            'meta' => true,
            'category' => true,

            'tags' => true,
            'gallery' => true,
            'status' => 'publish',
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
                'children' => true,
                'meta' => true,
            ]);
        }

        if ($index_settings['latest_product_toggle']) {
            $data['latest_products'] = get_posts($this->productQuery([
                'limit' => 10,
                'latest' => true,
            ]));
        }
        $data['popluar_products'] = get_posts($this->productQuery([
            'limit' => 10,
            'views' => 'desc',
        ]));
        $data['trending_products'] = get_posts($this->productQuery([
            'limit' => 10,
            'trending' => true,
        ]));

        // Latest blogs for home page
        $data['latest_blogs'] = get_posts($this->blogQuery([
            'limit' => 6,
            'latest' => true,
        ]));

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

    public function checkout()
    {
        return Inertia::render('Frontend/Checkout/Index');
    }

    public function compare()
    {
        return Inertia::render('Frontend/Compare/Index');
    }
    public function developer() {
        
        }
    public function store(Request $request)
    {
        $validated = $request->validate([
            'min_price' => ['nullable', 'numeric', 'min:0'],
            'max_price' => ['nullable', 'numeric', 'min:0'],
            'brands' => ['nullable', 'string'],
            'category' => ['nullable', 'string'],
            'in_stock' => ['nullable'],
            'sort' => ['nullable', 'in:latest,price_asc,price_desc,popular'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);
        $brandIds = helper_ids($validated['brands'] ?? []);
        $categoryIds = helper_ids($validated['category'] ?? []);
        $priceBounds = catalog_price_bounds();
        $applied = [
            'min_price' => $validated['min_price'] ?? null,
            'max_price' => $validated['max_price'] ?? null,
            'brands' => $brandIds,
            'category' => $categoryIds,
            'in_stock' => filter_var($validated['in_stock'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'sort' => $validated['sort'] ?? 'latest',
        ];

        $query = $this->productQuery([
            'limit' => 20,
            'paginate' => true,
            'sort' => $applied['sort'],
            'min_price' => $applied['min_price'],
            'max_price' => $applied['max_price'],
            'in_stock' => $applied['in_stock'],
        ]);

        if ($categoryIds !== []) {
            // Expand any selected parent categories to include their children IDs
            $selectedCategories = \App\Models\PostTaxonomy::whereIn('id', $categoryIds)->get();
            $expandedCategoryIds = $categoryIds;
            foreach ($selectedCategories as $catItem) {
                $childIds = \DB::table('taxonomies')->where('parent_id', $catItem->id)->pluck('id')->all();
                if (!empty($childIds)) {
                    $expandedCategoryIds = array_merge($expandedCategoryIds, $childIds);
                }
            }
            $query['category_id'] = array_values(array_unique($expandedCategoryIds));
        }

        if ($brandIds !== []) {
            $query['brand_id'] = $brandIds;
        }

        $products = get_posts($query);
        $categories = get_taxonomy([
            'type' => 'category',
            'status' => 'publish',
            'limit' => -1,
        ]);
        $brands = get_taxonomy([
            'type' => 'brand',
            'status' => 'publish',
            'limit' => -1,
        ]);

        $filterCategories = collect($categories)->map(fn($cat) => [
            'id' => $cat->id,
            'title' => $cat->title,
            'slug' => $cat->slug ?? null,
            'parent_id' => $cat->parent_id ?? 0,
        ])->values();

        $filterBrands = collect($brands)->map(fn($brand) => [
            'id' => $brand->id,
            'title' => $brand->title,
        ])->values();

        return Inertia::render('Frontend/Store/Index', [
            'products' => $products,
            'filters' => $applied,
            'filterOptions' => [
                'isStore' => true,
                'categoryKey' => 'category',
                'categoriesTitle' => 'Categories',
                'brands' => $filterBrands,
                'categories' => $filterCategories,
                'price' => $priceBounds,
            ],
        ]);
    }
    public function taxonomyView(Request $request)
    {
        $validated = $request->validate([
            'min_price' => ['nullable', 'numeric', 'min:0'],
            'max_price' => ['nullable', 'numeric', 'min:0'],
            'brands' => ['nullable', 'string'],
            'subcategory' => ['nullable', 'string'],
            'in_stock' => ['nullable'],
            'sort' => ['nullable', 'in:latest,price_asc,price_desc,popular'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $id = $request->id;
        $type = $request->type;
        $taxonomy = get_taxonomy([
            'type' => $type,
            'id' => $id,
            'limit' => 1,
            'image' => true,
            'meta' => true,
            'parent' => true,
        ]);

        if (! $taxonomy) {
            abort(404);
        }

        $brandIds = helper_ids($validated['brands'] ?? []);
        $subcategoryIds = helper_ids($validated['subcategory'] ?? []);
        $priceBounds = catalog_price_bounds();
        $applied = [
            'min_price' => $validated['min_price'] ?? null,
            'max_price' => $validated['max_price'] ?? null,
            'brands' => $brandIds,
            'subcategory' => $subcategoryIds,
            'in_stock' => filter_var($validated['in_stock'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'sort' => $validated['sort'] ?? 'latest',
        ];

        $query = $this->productQuery([
            'limit' => 20,
            // 'paginate' => true,
            'sort' => $applied['sort'],
            'min_price' => $applied['min_price'],
            'max_price' => $applied['max_price'],
            'in_stock' => $applied['in_stock'],
        ]);

        if ($type === 'brand') {
            $query['brand_id'] = $id;
        } elseif ($type === 'tag') {
            $query['tag_id'] = $id;
        } else {
            $descendantIds = taxonomy_descendant_ids($taxonomy->children ?? []);
            $allCategoryIds = array_values(array_unique(array_merge([$id], $descendantIds)));
            $query['category_id'] = $subcategoryIds !== [] ? $subcategoryIds : $allCategoryIds;
        }

        if ($brandIds !== [] && $type !== 'brand') {
            $query['brand_id'] = $brandIds;
        }
        $products = get_posts($query);
        $filterBrands = $type === 'brand'
            ? collect()
            : get_taxonomy([
                'type' => 'brand',
                'status' => 'publish',
                'limit' => 40,
            ]);

        $children = collect($taxonomy->children ?? [])->map(fn($child) => [
            'id' => $child->id,
            'title' => $child->title,
            'slug' => $child->slug ?? null,
        ])->values();
        return Inertia::render('Frontend/Category/Index', [
            'category' => $taxonomy,
            'products' => $products,
            'filters' => $applied,
            'filterOptions' => [
                'brands' => collect($filterBrands)->map(fn($brand) => [
                    'id' => $brand->id,
                    'title' => $brand->title,
                ])->values(),
                'categories' => $children,
                'price' => $priceBounds,
            ],
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

        $latest_product = get_posts($this->productQuery([
            'limit' => 4,
            'latest' => true,
            'exclude_id' => $product->id ?? null,
            'single' => true
        ]));

        $categoryId = array_map(function ($cat) {
            return is_object($cat) ? $cat->id : $cat;
        }, $product->category ?? []);
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

        $this->recordProductView($request, (int) $product->id, (string) $product->title);

        return Inertia::render('Frontend/Single/Index', [
            'product' => $product,
            'latest_product' => $latest_product,
            'related_products' => $related_products,
            'popular_products' => $popular_products,
        ]);
    }

    private function recordProductView(Request $request, int $productId, string $productTitle): void
    {
        $userId = Auth::id();
        if ($userId) {
            $viewedIds = [];
            $viewed = DB::table('user_meta')
                ->where('user_id', $userId)
                ->where('key', 'viewed_products')
                ->first();

            if ($viewed) {
                $viewedIds = array_filter(explode(',', (string) $viewed->value));
                if (! in_array((string) $productId, $viewedIds, true)) {
                    DB::table('user_meta')
                        ->where('id', $viewed->id)
                        ->update(['value' => $productId . ',' . $viewed->value]);
                }
            } else {
                DB::table('user_meta')->insert([
                    'user_id' => $userId,
                    'key' => 'viewed_products',
                    'value' => (string) $productId,
                ]);
            }

            $sessionKey = 'viewed_product_' . $productId;
            if ($request->session()->has($sessionKey)) {
                return;
            }

            $request->session()->put($sessionKey, true);
            record_user_activity('product_viewed', [
                'title' => $productTitle,
                'category' => 'product',
                'detail' => $productTitle,
                'product_id' => $productId,
                'product_title' => $productTitle,
            ], (int) $userId);

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

    public function blogIndex(Request $request)
    {
        $query = $this->blogQuery([
            'limit' => 12,
            'paginate' => true,
            'latest' => true,
            'keyword' => $request->search ?? null,
        ]);

        if ($request->category) {
            $query['category_id'] = $request->category;
        }

        $blogs = get_posts($query);
        $recent_blogs = get_posts($this->blogQuery([
            'limit' => 5,
            'latest' => true,
        ]));

        $categories = get_taxonomy([
            'type' => 'blog_category',
            'status' => 'publish',
            'limit' => 30,
        ]);

        if (empty($categories)) {
            $categories = get_taxonomy([
                'type' => 'category',
                'status' => 'publish',
                'limit' => 30,
            ]);
        }

        return Inertia::render('Frontend/Blog/Index', [
            'blogs' => $blogs,
            'recent_blogs' => $recent_blogs,
            'categories' => $categories,
            'filters' => [
                'search' => $request->search ?? '',
                'category' => $request->category ?? '',
            ]
        ]);
    }

    public function blogSingle(Request $request, $idOrSku)
    {
        $blog = get_posts($this->blogQuery([
            'single' => true,
            'type' => 'blog',
            'id' => is_numeric($idOrSku) ? $idOrSku : null,
            'sku' => !is_numeric($idOrSku) ? $idOrSku : null,

        ]));

        if (!$blog) {
            $blog = get_posts($this->blogQuery([
                'single' => true,
                'type' => 'blog',
                'id' => $idOrSku,
            ]));
        }

        if (!$blog) {
            abort(404);
        }

        $recent_blogs = get_posts($this->blogQuery([
            'limit' => 4,
            'type' => 'blog',
            'latest' => true,
            'exclude_id' => $blog->id ?? null,
        ]));

        $categories = get_taxonomy([
            'type' => 'blog_category',
            'status' => 'publish',
            'limit' => 20,
        ]);
        if (empty($categories)) {
            $categories = get_taxonomy([
                'type' => 'category',
                'status' => 'publish',
                'limit' => 20,
            ]);
        }
        return Inertia::render('Frontend/Blog/Single', [
            'blog' => $blog,
            'recent_blogs' => $recent_blogs,
            'categories' => $categories,
        ]);
    }

    public function dynamicPage(Request $request, string $slug)
    {
        $page = get_posts([
            'type' => 'page',
            'single' => true,
            'sku' => $slug,
            'status' => 'publish',
            'image' => true,
            'meta' => true,
        ]);

        if (!$page && is_numeric($slug)) {
            $page = get_posts([
                'type' => 'page',
                'single' => true,
                'id' => $slug,
                'status' => 'publish',
                'image' => true,
                'meta' => true,
            ]);
        }

        if (!$page) {
            abort(404);
        }

        // Supporting data for dynamic widgets (recent articles, categories, related pages, FAQs)
        $recentBlogs = get_posts([
            'type'   => 'blog',
            'status' => 'publish',
            'limit'  => 4,
            'image'  => true,
            'latest' => true,
        ]);

        $categories = get_taxonomy([
            'type'   => 'category',
            'status' => 'publish',
            'limit'  => 8,
        ]);

        $otherPages = get_posts([
            'type'   => 'page',
            'status' => 'publish',
            'limit'  => 12,
            'meta'   => true,
        ]);

        $faqs = get_posts([
            'type'   => 'faq',
            'status' => 'publish',
            'limit'  => 5,
            'meta'   => true,
        ]);

        return Inertia::render('Frontend/Page/Single', [
            'page'         => $page,
            'recent_blogs' => $recentBlogs ?? [],
            'categories'   => $categories ?? [],
            'other_pages'  => $otherPages ?? [],
            'faqs'         => $faqs ?? [],
        ]);
    }

    public function faqs(Request $request)
    {
        $faqs = get_posts([
            'type' => 'faq',
            'status' => 'publish',
            'meta' => true,
        ]);

        if (empty($faqs) || (is_countable($faqs) && count($faqs) === 0)) {
            $this->seedInitialFaqs();
            $faqs = get_posts([
                'type' => 'faq',
                'status' => 'publish',
                'meta' => true,
            ]);
        }

        $categories = get_taxonomy([
            'type' => 'faq_category',
            'status' => 'publish',
        ]);

        return Inertia::render('Frontend/Faqs/Index', [
            'faqs' => $faqs,
            'categories' => $categories,
            'filters' => [
                'search' => $request->search ?? '',
                'category' => $request->category ?? '',
            ]
        ]);
    }

    private function seedInitialFaqs(): void
    {
        if (DB::table('posts')->where('type', 'faq')->exists()) {
            return;
        }

        $userId = DB::table('users')->value('id') ?? 1;

        $categories = [
            ['title' => 'General Inquiries', 'slug' => 'general-inquiries'],
            ['title' => 'Orders & Shipping', 'slug' => 'orders-shipping'],
            ['title' => 'Payment & Checkout', 'slug' => 'payment-checkout'],
            ['title' => 'Returns & Refunds', 'slug' => 'returns-refunds'],
            ['title' => 'Products & Warranty', 'slug' => 'products-warranty'],
            ['title' => 'Account & Security', 'slug' => 'account-security'],
        ];

        foreach ($categories as $cat) {
            if (!DB::table('taxonomies')->where(['type' => 'faq_category', 'slug' => $cat['slug']])->exists()) {
                DB::table('taxonomies')->insert([
                    'title' => $cat['title'],
                    'slug' => $cat['slug'],
                    'type' => 'faq_category',
                    'status' => 'publish',
                    'parent_id' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        $defaultFaqs = [
            [
                'title' => 'How long does standard delivery take to arrive?',
                'description' => '<p>Standard shipping typically takes <strong>3 to 5 business days</strong> within the domestic region. If you need your order expedited, we offer Express Shipping (1-2 business days) options during checkout. Tracking is provided as soon as your parcel leaves our fulfillment center.</p>',
                'category' => 'Orders & Shipping',
                'order' => 1,
            ],
            [
                'title' => 'How can I track my shipment in real time?',
                'description' => '<p>Once your order has been packed and handed over to our carrier, an automated confirmation email with your dedicated tracking number and link is sent to you. You can also view live delivery progress directly from your <strong>Account Dashboard</strong> under the "Orders" section.</p>',
                'category' => 'Orders & Shipping',
                'order' => 2,
            ],
            [
                'title' => 'Can I edit or cancel an order after placing it?',
                'description' => '<p>To ensure lightning-fast dispatch, orders enter processing almost immediately. If you need to make corrections to your shipping address or cancel an item, please reach out to our 24/7 customer support within <strong>60 minutes</strong> of placing the order.</p>',
                'category' => 'Orders & Shipping',
                'order' => 3,
            ],
            [
                'title' => 'What payment methods and currencies do you support?',
                'description' => '<p>We accept all major credit and debit cards including <strong>Visa, MasterCard, and American Express</strong>, along with PayPal, Apple Pay, Google Pay, and Stripe secure checkout. All charges are securely processed in USD or your local detected currency.</p>',
                'category' => 'Payment & Checkout',
                'order' => 4,
            ],
            [
                'title' => 'Is my payment information and credit card data secure?',
                'description' => '<p>Absolutely. Every financial transaction is safeguarded by <strong>256-bit SSL encryption</strong> and processed through tier-1 PCI-DSS Level 1 compliant financial gateways. We never store, log, or share your sensitive credit card information on our servers.</p>',
                'category' => 'Payment & Checkout',
                'order' => 5,
            ],
            [
                'title' => 'What is your return and exchange policy?',
                'description' => '<p>We offer a straightforward <strong>30-day return policy</strong>. If you are not completely satisfied with your purchase, you may return the item in its original condition and packaging for a full refund or replacement. Defective items qualify for complimentary return shipping.</p>',
                'category' => 'Returns & Refunds',
                'order' => 6,
            ],
            [
                'title' => 'How long does it take to receive my refund?',
                'description' => '<p>Once your returned item arrives at our warehouse and passes quality inspection (usually within 24-48 hours), your refund will be processed back to your original payment method. Depending on your bank or card issuer, funds will appear in your statement within <strong>3 to 7 business days</strong>.</p>',
                'category' => 'Returns & Refunds',
                'order' => 7,
            ],
            [
                'title' => 'Do all electronic devices include a manufacturer warranty?',
                'description' => '<p>Yes! Every brand-new electronic device comes standard with a minimum <strong>1-year official manufacturer warranty</strong> covering hardware malfunctions and defects. You can also opt for extended protection warranties during checkout.</p>',
                'category' => 'Products & Warranty',
                'order' => 8,
            ],
            [
                'title' => 'Are all products 100% authentic and genuine?',
                'description' => '<p>We are an authorized direct partner and distributor for all brands featured in our store. Every product is <strong>100% genuine, brand new, factory sealed</strong>, and accompanied by authentic serial numbers and documentation.</p>',
                'category' => 'Products & Warranty',
                'order' => 9,
            ],
            [
                'title' => 'How do I reset my password or recover my account?',
                'description' => '<p>Click on the "Forgot Password" link on the login page, enter your registered email address, and you will immediately receive a secure password reset link. For any other login difficulties, our support team can verify your identity and restore access.</p>',
                'category' => 'Account & Security',
                'order' => 10,
            ],
            [
                'title' => 'How can I contact customer service for help?',
                'description' => '<p>Our support representatives are standing by 24/7. You can reach us via our live chat widget on the website, email us at <strong>support@nestifytech.com</strong>, or call our toll-free phone line at <strong>+1 (800) 123-4567</strong>.</p>',
                'category' => 'General Inquiries',
                'order' => 11,
            ],
        ];

        foreach ($defaultFaqs as $faq) {
            $slug = Str::slug($faq['title']);
            $postId = DB::table('posts')->insertGetId([
                'user_id' => $userId,
                'title' => $faq['title'],
                'sku' => $slug,
                'description' => $faq['description'],
                'status' => 'publish',
                'type' => 'faq',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('post_meta')->insert([
                ['post_id' => $postId, 'key' => 'faq_category', 'value' => $faq['category']],
                ['post_id' => $postId, 'key' => 'order', 'value' => (string) $faq['order']],
            ]);
        }
    }

    /**
     * Get real-time notifications for orders and newly published products.
     */
    public function getNotifications(Request $request)
    {
        $userId = Auth::id() ?? optional(Auth::guard('web')->user())->id;
        $notifications = [];

        // 1. New products published in the last 7 days
        $newProducts = DB::table('posts')
            ->where('type', 'product')
            ->where('status', 'publish')
            ->orderBy('id', 'desc')
            ->limit(5)
            ->get(['id', 'title', 'sku', 'created_at']);

        foreach ($newProducts as $product) {
            $imageMeta = DB::table('media')
                ->where('parent_id', $product->id)
                ->where('type', 'product')
                ->first();

            $imagePath = $imageMeta ? '/storage/uploads/image/' . $imageMeta->name : '/assets/image/placeholder.png';

            $notifications[] = [
                'id'         => 'prod_' . $product->id,
                'type'       => 'new_product',
                'title'      => 'New Arrival: ' . $product->title,
                'body'       => 'Check out our latest product ' . $product->title . ' now available in store!',
                'url'        => route('post', ['type' => 'product', 'sku' => $product->sku ?? $product->id, 'id' => $product->id]),
                'image'      => $imagePath,
                'timestamp'  => $product->created_at,
                'category'   => 'product',
            ];
        }

        // 2. Order notifications (if logged in, for this user; otherwise recent store order updates if authorized or requested)
        if ($userId) {
            $userOrders = DB::table('orders')
                ->where('user_id', $userId)
                ->orderBy('id', 'desc')
                ->limit(5)
                ->get();

            foreach ($userOrders as $order) {
                $statusLabels = [
                    'pending'    => 'Order Placed & Processing',
                    'processing' => 'Order is Being Packed',
                    'completed'  => 'Order Delivered Successfully',
                    'cancelled'  => 'Order Cancelled',
                ];

                $notifications[] = [
                    'id'         => 'order_' . $order->id . '_' . $order->status,
                    'type'       => 'order_update',
                    'title'      => 'Order #' . $order->id . ' - ' . ($statusLabels[$order->status] ?? ucfirst($order->status)),
                    'body'       => 'Total: PKR ' . number_format((float) $order->total_price, 2) . ' • Status: ' . ucfirst($order->status),
                    'url'        => route('profile.orders'),
                    'image'      => '/assets/image/favicon.png',
                    'timestamp'  => $order->order_date ?? $order->created_at ?? now()->toDateTimeString(),
                    'category'   => 'order',
                ];
            }
        }

        // Sort descending by timestamp
        usort($notifications, function ($a, $b) {
            return strtotime($b['timestamp'] ?? 'now') - strtotime($a['timestamp'] ?? 'now');
        });

        return response()->json([
            'success'       => true,
            'notifications' => array_slice($notifications, 0, 10),
            'unread_count'  => count($notifications),
        ]);
    }
}
