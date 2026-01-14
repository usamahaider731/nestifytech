<?php

namespace App\Http\Controllers;

use App\Models\Attributes;
use App\Models\AttributeOptions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Illuminate\Support\Str;

class AttributeController extends Controller
{
    public $path;
    public $data;
    function __construct()
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
    /**
     * Display a listing of attributes
     */
    public function index()
    {
        $attributes = Attributes::with('options')->get();

        return Inertia::render('Admin/Attributes/Index', [
            'attributes' => $attributes
        ]);
    }

    /**
     * Show the form for creating a new attribute
     */
    public function create()
    {
        $data = $this->data['attributes'];
        return Inertia::render('Admin/Attributes/Create', compact('data'));
    }
    /**
     * Store a newly created attribute
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:50',
            'options' => 'nullable|json',
        ]);

        DB::beginTransaction();
        try {
            $attribute = Attributes::create([
                'name' => $validated['name'],
                'type' => $validated['type'],
                'slug' => Str::slug($validated['name']),
            ]);

            if (!empty($validated['options'])) {
                $options = json_decode($validated['options']);
                foreach ($options as $option) {
                    AttributeOptions::create([
                        'attribute_id' => $attribute->id,
                        'value' => $option,
                    ]);
                }
            }

            DB::commit();
            return redirect()->route('admin.attributes.index')
                ->with('success', 'Attribute created successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->with('error', 'Failed to create attribute: ' . $e->getMessage())
                ->withInput();
        }
    }


    /**
     * Display the specified attribute
     */
    public function show($id)
    {
        $attribute = Attributes::with('options')->findOrFail($id);
        return Inertia::render('Admin/Attributes/Show', [
            'attribute' => $attribute
        ]);
    }

    /**
     * Show the form for editing the specified attribute
     */
    public function edit($id)
    {
        $data = $this->data['attributes'];
        $attribute = Attributes::with('options')->findOrFail($id);

        return Inertia::render('Admin/Attributes/Edit', [
            'attribute' => $attribute,
            'data' => $data
        ]);
    }

    /**
     * Update the specified attribute
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:50',
            'options' => 'nullable|json',
        ]);

        DB::beginTransaction();

        try {
            $attribute = Attributes::findOrFail($id);
            $attribute->update([
                'name' => $validated['name'],
                'slug' => Str::slug($validated['name']),
                'type' => $validated['type'],
            ]);

            if (!empty($validated['options'])) {
                $options = json_decode($validated['options'], true);

                // Collect existing IDs to keep
                $existingIds = [];

                foreach ($options as $option) {
                    if (is_array($option) && isset($option['id'])) {
                        // Update existing option
                        $attributeOption = AttributeOptions::where('attribute_id', $attribute->id)
                            ->where('id', $option['id'])
                            ->first();
                        if ($attributeOption) {
                            $attributeOption->update([
                                'value' => $option['value']
                            ]);
                            $existingIds[] = $attributeOption->id;
                        }
                    } if (is_string($option)) {
                       $strv= AttributeOptions::create([
                            'attribute_id' => $attribute->id,
                            'value' => $option
                        ]);
                        $existingIds[]=$strv->id;
                    }
                }
                // Delete options not in the request
                AttributeOptions::where('attribute_id', $attribute->id)
                    ->whereNotIn('id', $existingIds)
                    ->delete();
            } else {
                // If no options sent, delete all
                AttributeOptions::where('attribute_id', $attribute->id)->delete();
            }

            DB::commit();

            return redirect()->route('admin.attributes.index')
                ->with('success', 'Attribute updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();

            return redirect()->back()
                ->with('error', 'Failed to update attribute: ' . $e->getMessage())
                ->withInput();
        }
    }


    /**
     * Remove the specified attribute
     */
    public function destroy($id)
    {
        try {
            $attribute = Attributes::findOrFail($id);
            $attribute->delete(); // This will cascade delete values due to foreign key constraint

            return response()->json(['message' => 'Attribute deleted successfully']);
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to delete attribute: ' . $e->getMessage());
        }
    }

    /**
     * Get attributes as options for dropdowns
     */
    public function getAttributesOptions(Request $request)
    {
        $attributes = Attributes::all();

        $options = $attributes->map(function ($attribute) {
            return [
                'id' => $attribute->id,
                'title' => $attribute->name,
                'value' => $attribute->id
            ];
        });

        return response()->json($options);
    }

    /**
     * Get attribute values as options for a specific attribute
     */
    public function getAttributeValuesOptions(Request $request, $attributeId)
    {
        $attribute = Attributes::findOrFail($attributeId);
        $values = $attribute->values;

        $options = $values->map(function ($value) {
            return [
                'id' => $value->id,
                'title' => $value->value,
                'value' => $value->id
            ];
        });

        return response()->json($options);
    }
}
