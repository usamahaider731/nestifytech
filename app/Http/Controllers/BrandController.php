<?php

namespace App\Http\Controllers;

use App\Models\Media;
use App\Models\Taxonomy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Illuminate\Support\Str;

class BrandController extends Controller
{
    public $path;
    public $data;
    function __construct()
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
    public function index()
    {
        $data = Taxonomy::where(['type'=>'brand'])->with('image')->paginate(15);
        return Inertia::render('Admin/Brand/Index',compact('data'));
    }
    public function create()
    {
        $data = $this->data['brand'];
        return Inertia::render('Admin/Brand/Create', compact('data'));
    }
    public function edit(Request $request, $id)
    {
        $data = $this->data['brand'];
        $category = Taxonomy::where(['id' => $id])->with('image')->first();
        return Inertia::render('Admin/Brand/Edit', compact('data', 'category'));
    }
    public function submit(Request $request, $id = null)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|string'
            // 'image' => 'nullable|image',
        ]);
        try {
            DB::beginTransaction();
            $brandData = [
                'title' => $validated['title'],
                'slug' => Str::slug($validated['title']),
                'description' => $validated['description'] ?? null,
                'type' => 'brand',
                'status' => $validated['status'],
                'parent_id' => 0
            ];
            if ($id) {
                $brand = Taxonomy::findOrFail($id);
                $brand->update($brandData);
            } else {
                $brand = Taxonomy::create($brandData);
            }
            if ($request->hasFile('image')) {
                Media::handleImageUpload($request->file('image'), $brand, 'taxonomy');
            }
            DB::commit();
            return response()->json([
                'success' => true,
                'message' => $id ? 'brand updated successfully' : 'brand created successfully',
                'data' => $brand
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
