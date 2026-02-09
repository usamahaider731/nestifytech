<?php

namespace App\Http\Controllers;

use App\Models\Media;
use App\Models\Taxonomy;
use App\Models\TaxonomyMeta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Illuminate\Support\Str;

use function PHPSTORM_META\type;

class CategoryController extends Controller
{
    public $path;
    public $data;

    public function __construct()
    {
        parent::__construct();
        $this->path = $this->json_file_location.'/Form.json';

        // Properly parse the JSON file
        if (File::exists($this->path)) {
            $json = File::get($this->path);
            $this->data = json_decode($json, true); // decode as associative array
        } else {
            $this->data = [];
        }
    }
    public function index(Request $request)
    {
        $id = $request->id;

        $query = Taxonomy::where('type', 'category')
            ->with('image', 'parent', 'meta');

        if ($id) {
            $query->where('parent_id', $id);
        } else {
            $query->where('parent_id', 0);
        }

        $data = $query->paginate(15);

        // Loop on paginator collection
        $data->getCollection()->transform(function ($item) {
            $item->discount = get_meta($item->meta, 'discount');
            return $item;
        });

        return Inertia::render('Admin/Category/Index', [
            'data' => $data
        ]);
    }

    public function Create()
    {
        $data = $this->data['category'];
        return Inertia::render('Admin/Category/Create', ['data' => $data]);
    }
    public function edit(Request $request, $id)
    {
        $data = $this->data['category'];
        $category = Taxonomy::where(['id' => $id])->with('image')->first();
        $category->discount = get_meta($category->meta, 'discount');
        $category->discount_toggle = get_meta($category->meta, 'discount_toggle');
        $category->discount_date = [0 => get_meta($category->meta, 'discount_start'), 1 => get_meta($category->meta, 'discount_end')];

        return Inertia::render('Admin/Category/Edit', compact('data', 'category'));
    }
    public function submit(Request $request, $id = null)
    {
        // dd($request->discount_toggle);
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|string',
            'parent_id' => 'nullable|integer',
            // 'image' => 'nullable|image',

        ]);

        try {
            DB::beginTransaction();

            $categoryData = [
                'title' => $validated['title'],
                'slug' => Str::slug($validated['title']),
                'description' => $validated['description'] ?? null,
                'type' => 'category',
                'status' => $validated['status'],
                'parent_id' => $validated['parent_id'] ?? 0
            ];

            if ($id) {
                $category = Taxonomy::findOrFail($id);
                $category->update($categoryData);
            } else {
                $category = Taxonomy::create($categoryData);
            }
            if ($request->discount_toggle === 'true') {
                TaxonomyMeta::updateOrCreate(
                    ['taxonomy_id' => $category->id, 'key' => 'discount_toggle'],
                    ['value' => $request->discount_toggle]
                );
                if (isset($request->discount)) {
                    TaxonomyMeta::updateOrCreate(
                        ['taxonomy_id' => $category->id, 'key' => 'discount'],
                        ['value' => $request->discount]
                    );
                }
                if (isset($request['discount_date'])) {
                    $discount_date = json_decode($request->discount_date, true);
                    TaxonomyMeta::updateOrCreate(
                        ['taxonomy_id' => $category->id, 'key' => 'discount_start'],
                        ['value' => $discount_date[0]]
                    );
                    TaxonomyMeta::updateOrCreate(
                        ['taxonomy_id' => $category->id, 'key' => 'discount_end'],
                        ['value' => $discount_date[1]]
                    );
                }
            }
            if ($request->discount_toggle == 'false' && !is_null($id)) {
                TaxonomyMeta::whereIn('key', ['discount_end', 'discount_start', 'discount', 'discount_toggle'])->where('taxonomy_id', $id)->delete();
            }


            if ($request->hasFile('image')) {
                Media::handleImageUpload($request->file('image'), $category, 'taxonomy');
            }
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => $id ? 'Category updated successfully' : 'Category created successfully',
                'data' => $category
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error processing request',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
