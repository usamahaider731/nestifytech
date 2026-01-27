<?php

namespace App\Http\Controllers;

use App\Models\AttributeValues;
use App\Models\Attributes;
use App\Models\Media;
use App\Models\Posts;
use App\Models\PostMeta;
use App\Models\PostVariation;
use App\Models\ProductVariationValue;
use App\Models\Taxonomy;
use Attribute;
use Dom\Attr;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Illuminate\Support\Str;
use MongoDB\Builder\Expression\ObjectToArrayOperator;

use function MongoDB\object;

class PostController extends Controller
{


    public $path;
    public $data;

    public function __construct()
    {
        $this->path = public_path('data/Form.json');

        // Properly parse the JSON file
        if (File::exists($this->path)) {
            $json = File::get($this->path);
            $this->data = json_decode($json, true); // decode as associative array
        } else {
            $this->data = [];
        }
    }

    public function post(Request $request, $post)
    {
        return Inertia::render('Admin/Post/Table');
    }
    public function index(Request $request, $post, $id = null)
    {
        if (!is_null($id)) {
            $category = Taxonomy::where(['type' => 'category', 'id' => $id])->first();
            // dd($category->posts()->image);

            $products = $category ? $category->posts()->with('image')->paginate(10) : collect();
        } else {
            $products = Posts::where('type', 'product')->with('image')->paginate(10);
            foreach ($products as $product) {
                $product->parent = $product->parent(); // call per model
            }
        }
        return Inertia::render("Admin/Post/{$post}/Index", compact('products'));
    }
    public function create(Request $request, $post)
    {
        // Safely get boolean value from the JSON array
        $Data = $this->data[$post] ?? false;

        return Inertia::render("Admin/Post/{$post}/Create", compact('Data'));
    }
    public function submit(Request $request, $post = null, $id = null)
    {
        // dd(gettype($request->attributes));
        $isEdit = $request->has('id');

        // Validation
        $rules = [
            'title' => 'string|max:30|required',
            'description' => 'string|max:500',
            'status' => 'string|required|max:20',
            'sku' => 'string|required|max:50|unique:posts,sku'
        ];

        if ($isEdit) {
            $rules['sku'] .= ',' . $request->id;
        }

        $validation = $request->validate($rules);

        try {

            // Create / Update
            $product = Posts::updateOrCreate(
                ['id' => $id],
                [
                    'user_id' => Auth::id(),
                    'type' => 'product',
                    'title' => $validation['title'],
                    'description' => $validation['description'],
                    'status' => $validation['status'],
                    'sku' => $validation['sku'],
                ]
            );

            /* ================= IMAGE ================= */

            if ($request->image) {
                Media::handleImageUpload($request->image, $product, 'post');
            }

            if ($request->gallery) {
                $gallery = is_string($request->gallery)
                    ? json_decode($request->gallery, true)
                    : $request->gallery;

                Media::handleImageUpload($gallery, $product, 'post_gallery');
            }

            /* ================= META ================= */

            $meta = $request->except(
                'title',
                'description',
                'gallery',
                'image',
                'status',
                'sku',
                'attributes',
                'variations',
                '_token',
                'id'
            );

            foreach ($meta as $key => $value) {
                PostMeta::updateOrCreate(
                    [
                        'post_id' => $product->id,
                        'key' => $key,
                    ],
                    [
                        'value' => is_array($value) ? json_encode($value) : $value,
                    ]
                );
            }

            /* ================= ATTRIBUTES ================= */

            if ($request->attributes) {

                // clear old on edit
                if ($isEdit) {
                    AttributeValues::where('parent_id', $product->id)
                        ->where('parent_type', 'post')
                        ->delete();
                }

                $attributes = $request->attributes;

                foreach ($attributes as $field) {

                    if (!empty($field['key']) && !empty($field['value'])) {

                        $attr = Attributes::firstOrCreate(
                            ['name' => $field['key']],
                            ['type' => 'text']
                        );

                        AttributeValues::create([
                            'attribute_id' => $attr->id,
                            'value' => $field['value'],
                            'parent_id' => $product->id,
                            'parent_type' => 'post'
                        ]);
                    }
                }
            }

            /* ================= VARIATIONS ================= */

            if ($request->variations) {

                // remove old on edit
                if ($isEdit) {
                    PostVariation::where('post_id', $product->id)->delete();
                }

                $variations = is_array($request->variations)
                    ? $request->variations
                    : json_decode($request->variations, true);

                foreach ($variations as $variation) {

                    $productVariation = PostVariation::create([
                        'post_id' => $product->id,
                        'price' => json_decode($variation['price'], true),
                        'stock' => json_decode($variation['stock'], true),
                    ]);

                    if (!empty($variation['image'])) {
                        Media::handleImageUpload(
                            $variation['image'],
                            $productVariation,
                            'post_variation'
                        );
                    }

                    // Size attributes
                    if (!empty($variation['size'])) {

                        $sizes = explode('&', json_decode($variation['size'], true));

                        foreach ($sizes as $sz) {

                            [$attrName, $attrValue] = explode('|', $sz);

                            $attribute = Attributes::firstOrCreate(
                                ['name' => $attrName],
                                ['type' => 'select']
                            );

                            $option = AttributeValues::firstOrCreate([
                                'attribute_id' => $attribute->id,
                                'value' => $attrValue,
                                'parent_id' => $productVariation->id,
                                'parent_type' => 'post_variation'
                            ]);

                            ProductVariationValue::create([
                                'variation_id' => $productVariation->id,
                                'attribute_option_id' => $option->id
                            ]);
                        }
                    }

                    // Color
                    if (!empty($variation['color'])) {

                        $attribute = Attributes::firstOrCreate(
                            ['name' => 'Color'],
                            ['type' => 'checkbox']
                        );

                        $option = AttributeValues::firstOrCreate([
                            'attribute_id' => $attribute->id,
                            'value' => json_decode($variation['color'], true),
                            'parent_id' => $productVariation->id,
                            'parent_type' => 'post_variation'
                        ]);

                        ProductVariationValue::create([
                            'variation_id' => $productVariation->id,
                            'attribute_option_id' => $option->id
                        ]);
                    }
                }
            }

            return redirect()->back()
                ->with('success', $isEdit ? 'Product updated!' : 'Product created!');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function edit(Request $request, $post)
    {
        $product = Posts::find($request->id);

        $stuv = new \stdClass();

        $stuv->title = $product->title;
        $stuv->id = $product->id;
        $stuv->description = $product->description;
        $stuv->status = $product->status;

        $category = [];
        foreach ($product->parent() as $value) {
            $category[] = $value->id;
        }

        $stuv->category = $category;
        $stuv->brand = $product->brand()->id;

        // $stuv->regular_price = $product->meta->firstWhere('key', 'first_price')->value ?? null;
        // $stuv->sale_price = $product->meta->firstWhere('key', 'second_price')->value ?? null;
        $stuv->sku = $product->sku ?? null;
        $stuv->first_price = get_meta($product->meta, 'first_price');
        $stuv->second_price = get_meta($product->meta, 'second_price');
        $stuv->stock = get_meta($product->meta, 'stock');
        $stuv->tags = get_meta($product->meta, 'tags');
        $stuv->address = get_meta($product->meta, 'address');
        $stuv->state = get_meta($product->meta, 'state');
        $stuv->city = get_meta($product->meta, 'city');
        $stuv->image = $product->image ? $product->image->filename : null;
        $stuv->gallery = $product->gallery ? $product->gallery->pluck('filename') : null;

        $stuv->attributes = Posts::HandleAttributes($product->id);

        $vari = [];

        foreach ($product->variations as $variation) {

            $va = [];

            foreach ($variation->variations_value as $v) {
                if (
                    isset($v->attribute_option) &&
                    isset($v->attribute_option->attribute)
                ) {
                    $va[] = [
                        'key'   => $v->attribute_option->attribute->name,
                        'value' => $v->attribute_option->value
                    ];
                }
            }

            $color = '';
            $art = [];

            foreach ($va as $n) {
                if ($n['key'] == 'Color') {
                    $color = $n['value'];
                } else {
                    $art[] = $n['key'] . '|' . $n['value'];
                }
            }
            $image = Media::where('type', 'post_variation')->where('parent_id', $variation->id)->first();
            if ($image) {
                $variationImage = $image->filename;
            } else {
                $variationImage = null;
            }
            $vari[] = [
                'price' => $variation->price,
                'stock' => $variation->stock,
                'color' => $color,
                'size' => implode('&', $art),
                'image' => $variationImage
            ];
        }

        $stuv->variations = $vari;
        $Data = $this->data[$post] ?? false;
        return Inertia::render("Admin/Post/product/Edit", [
            'Data' => $Data,
            'initialData' => $stuv
        ]);
    }
}
