<?php

namespace App\Http\Controllers;

use App\Models\AttributeOptions;
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
    public function submit(Request $request, $post)
    {
        // dd(is_array($request->variations));
        $formData = $request->except('_token');
        $validation = $request->validate([
            'title' => 'string|max:30|required',
            'description' => 'string|max:500',
            'status' => 'string|required|max:20',
            'sku' => 'string|required|max:50|unique:posts,sku',
        ]);
        try {
            $product = Posts::create([
                'type' => 'product',
                'title' => $validation['title'],
                'description' => $validation['description'],
                'status' => $validation['status'],
                'user_id' => Auth::user()->id,
                'sku' => $validation['sku']
            ]);


            if ($request->image) {
                Media::handleImageUpload($request->image, $product, 'post');
            }
            if (!is_null($request->gallery)) {
                $gallery = is_string($request->gallery) ?
                    json_decode($request->gallery, true) :
                    $request->gallery;

                Media::handleImageUpload($gallery, $product, 'post_gallery');
            }
            $meta = $request->except('title', 'description', 'gallery', 'image', 'status', 'sku', 'attributes', 'variations');
            foreach ($meta as $key => $value) {
                PostMeta::create([
                    'post_id' => $product->id,
                    'key' => $key,
                    'value' => is_array($value) ? json_encode($value) : $value,
                ]);
            }
            if (!is_null($request->input('attributes'))) {
                // $attributes = is_object($request->attributes) ?  ObjectToArrayOperator($request->attributes) :  $request->attributes;
                $attributes = json_decode($request->input('attributes'), true);

                if (is_array($attributes)) {
                    foreach ($attributes as $attrGroup) {
                        if (empty($attrGroup['label']) || !isset($attrGroup['fields'])) {
                            continue;
                        }

                        // Save parent attribute group
                        $attrib = PostMeta::create([
                            'key' => 'attribute_label',
                            'value' => $attrGroup['label'],
                            'post_id' => $product->id,
                        ]);
                        // Save each field inside group
                        foreach ($attrGroup['fields'] as $field) {
                            if (!empty($field['key']) && !empty($field['value'])) {

                                $thisAttr = Attributes::create(
                                    [
                                        'name' => $field['key'],
                                        'type' => 'text',
                                    ]
                                );
                                AttributeOptions::create(
                                    [
                                        'attribute_id' => $thisAttr->id,
                                        'value' => $field['value'],
                                        'parent_id' => $attrib->id,
                                        'parent_type' => 'post'
                                    ]
                                );
                            }
                        }
                    }
                }
            }
            if ($request->variations && !is_null($request->variations)) {
                $variations = is_array($request->variations) ? $request->variations : json_decode($request->variations, true);
                foreach ($variations as $variation) {
                    // dd(json_decode($variation['price'], true));
                    $price = json_decode($variation['price'], true) ?? null;
                    $stock = json_decode($variation['stock'], true) ?? null;
                    $image = $variation['image'] ?? null;
                    // dd($variation['image']);

                    $productVariation = PostVariation::create([
                        'post_id' => $product->id,
                        'price'   => $price,
                        'stock'   => $stock,

                    ]);
                    if (!is_null($image)) {
                        // dd($image);
                        Media::handleImageUpload($image, $productVariation, 'post_variation');
                    }
                    if (!empty($variation['size'])) {
                        $sizes = explode('&', json_decode($variation['size'], true));
                        foreach ($sizes as $sz) {
                            [$attrName, $attrValue] = explode('|', $sz);
                            $attribute = Attributes::firstOrCreate(
                                ['name' => $attrName],
                                ['type' => 'select']
                            );
                            $option = AttributeOptions::firstOrCreate(
                                [
                                    'attribute_id' => $attribute->id,
                                    'value'        => $attrValue,
                                    'parent_id'    => $productVariation->id,
                                    'parent_type'  => 'post_variation'
                                ]
                            );
                            ProductVariationValue::create([
                                'variation_id'        => $productVariation->id,
                                'attribute_option_id' => $option->id
                            ]);
                        }
                    }
                    if (!empty($variation['color'])) {
                        $attribute = Attributes::firstOrCreate(
                            ['name' => 'Color'],
                            ['type' => 'select']
                        );
                        $option = AttributeOptions::firstOrCreate(
                            [
                                'attribute_id' => $attribute->id,
                                'value'        => json_decode($variation['color'], true),
                                'parent_id'    => $productVariation->id,
                                'parent_type'  => 'post_variation'
                            ]
                        );
                        ProductVariationValue::create([
                            'variation_id'        => $productVariation->id,
                            'attribute_option_id' => $option->id
                        ]);
                    }
                }
            }
            return redirect()->back()->with('success', 'Form data saved successfully!');
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'failed to create product' . $e
            ]);
        }
    }
    public function edit(Request $request)
    {
        $product = Posts::find($request->id);
        $stuv = [];
        $stuv['title'] = $product->title;
        $stuv['description'] = $product->description;
        $stuv['status'] = $product->status;
        $category = [];

        // print_r($product->parent());

        foreach ($product->parent() as $key => $value) {
            $category[] = $value->id;
        }
        $brand = $product->brand()->id;


        $stuv['category'] = $category;
        $stuv['brand'] = $brand;
        $stuv['regular_price'] = $product->meta->firstWhere('key', 'first_price')->value ?? null;
        $stuv['sale_price'] = $product->meta->firstWhere('key', 'second_price')->value ?? null;
        $stuv['image'] = $product->image ? $product->image->filename : null;
        $stuv['gallery'] = $product->gallery ? $product->gallery->pluck('filename') : null;
        $stuv['attributes'] = [];
        $attribute_labels = $product->meta->where('key', 'attribute_label');
        foreach ($attribute_labels as $label) {
            $attrGroup = [];
            $attrGroup['label'] = $label->value;
            $fields = [];
            $options = Attributes::where('type', 'text')
                ->whereHas('attribute_options', function ($query) use ($label) {
                    $query->where('parent_id', $label->id)
                        ->where('parent_type', 'post');
                })->with(['attribute_options' => function ($query) use ($label) {
                    $query->where('parent_id', $label->id)
                        ->where('parent_type', 'post');
                }])->get();
            foreach ($options as $option) {
                foreach ($option->attribute_options as $opt) {
                    $fields[] = [
                        'key' => $option->name,
                        'value' => $opt->value
                    ];
                }
            }
            $attrGroup['fields'] = $fields;
            $stuv['attributes'][] = $attrGroup;
        }
        $variations = $product->variations;
        foreach ($variations as $key => $value) {
            echo '<pre>' . print_r($value, true) . '</pre>';
        }
        // print_r($stuv);
    }
}
