<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\DB;

class LayoutController extends Controller
{
    public $file;
    public $data;

    function __construct()
    {
        parent::__construct();
        $this->file = $this->json_file_location . '/layout.json';
        $data = file_get_contents($this->file);
        $str = json_decode($data, true);
        $this->data = $str['layout'] ?? [];
    }

    public function menu(Request $request)
    {
        $allMenus = DB::table('menu')->orderBy('sort_order', 'asc')->get();
        return Inertia::render('Admin/Layout/Menu', [
            'menu' => $allMenus,
            'menu_options' => DB::table('menu')->where('parent_id', 0)->orderBy('sort_order', 'asc')->get()
        ]);
    }

    public function menuReorder(Request $request)
    {
        $items = $request->input('items', []);
        foreach ($items as $item) {
            if (isset($item['id']) && isset($item['sort_order'])) {
                DB::table('menu')->where('id', $item['id'])->update([
                    'sort_order' => $item['sort_order']
                ]);
            }
        }
        return response()->json(['success' => true]);
    }

    public function menuDestroy(Request $request, $id)
    {
        DB::table('menu')->where('parent_id', $id)->delete();
        DB::table('menu')->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }

    public function menuUpdate(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'string|required|max:50',
            'link' => 'string|required|max:50',
            'location' => 'string|nullable|max:50',
        ]);

        DB::table('menu')->where('id', $id)->update([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'parent_id' => $request->parent,
            'link' => $request->link,
            'location' => $validated['location'],
        ]);

        $menu = DB::table('menu')->where('id', $id)->first();
        return response()->json($menu);
    }

    public function menuSubmit(Request $request)
    {
        $validated = $request->validate([
            'name' => 'string|required|max:50',
            'link' => 'string|required|max:50',
            'location' => 'string|nullable|max:50',
        ]);

        $id = DB::table('menu')->insertGetId([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'parent_id' => $request->parent,
            'link' => $request->link,
            'location' => $validated['location'],
        ]);

        $menu = DB::table('menu')->where('id', $id)->first();
        return response()->json($menu);
    }

    public function layout(Request $request, $type)
    {
        $type = ucfirst($type ?? 'Home');
        $data = $this->data[$type] ?? [];
        return Inertia::render('Admin/Layout/LayoutSetting', compact('data', 'type'));
    }

    public function submitLayoutPages(Request $request, $type)
    {
        $type = Str::ucfirst($type ?? 'Home');
        $layoutSetting = $this->data;
        if (is_string($layoutSetting)) $layoutSetting = json_decode($layoutSetting, true);
        $layoutSetting = is_array($layoutSetting) ? $layoutSetting : [];

        if (!isset($layoutSetting[$type])) abort(422);

        $currentSettings = $layoutSetting[$type];
        $otherSetting = array_filter($layoutSetting, fn($key) => $key !== $type, ARRAY_FILTER_USE_KEY);

        foreach ($currentSettings as &$section) {
            if (empty($section['fields']) || !is_array($section['fields'])) continue;

            foreach ($section['fields'] as &$field) {
                $key = $field['name'] ?? null;
                $typeField = $field['type'] ?? null;
                if (!$key || !$typeField) continue;

                // ── Repeater ─────────────────────────────────────────────────
                if ($typeField === 'repeater') {
                    $submittedItems = $request->input($key, []);
                    if (!is_array($submittedItems)) {
                        $submittedItems = [];
                    }

                    $subFieldDefs  = $field['fields'] ?? [];
                    $existingItems = $field['value'] ?? [];
                    $processedItems = [];

                    foreach ($submittedItems as $itemIndex => $itemData) {
                        // Start from existing item so we don't lose untouched values
                        $existingItem = $existingItems[$itemIndex] ?? [];
                        $newItem = is_array($existingItem) ? $existingItem : [];

                        foreach ($subFieldDefs as $subField) {
                            $subKey  = $subField['name']  ?? null;
                            $subType = $subField['type']  ?? null;
                            if (!$subKey || !$subType) continue;

                            // Dot-notation key for nested file: key.itemIndex.subKey
                            $fileKey = "{$key}.{$itemIndex}.{$subKey}";

                            if ($subType === 'image') {
                                if ($request->hasFile($fileKey)) {
                                    // A new file was uploaded for this item slot
                                    $uploadedFile = $request->file($fileKey);
                                    $newItem[$subKey] = $this->typeRender($subKey, $uploadedFile, $subField);
                                } elseif (array_key_exists($subKey, $itemData)) {
                                    // No new file – keep whatever was submitted (existing filename or null)
                                    $submitted = $itemData[$subKey];
                                    $newItem[$subKey] = $submitted !== null ? $submitted : ($existingItem[$subKey] ?? null);
                                }
                                // else: untouched – keep existing value already in $newItem
                            } else {
                                // Regular scalar field
                                if (array_key_exists($subKey, $itemData)) {
                                    $newItem[$subKey] = $itemData[$subKey];
                                }
                            }
                        }

                        $processedItems[] = $newItem;
                    }

                    $field['value'] = $processedItems;
                    continue;
                }

                // ── Image ─────────────────────────────────────────────────────
                if ($typeField === 'image' && $request->hasFile($key)) {
                    $newValue = $this->typeRender($key, $request->file($key), $field);

                    if (is_array($request->file($key))) {
                        $oldValue = $field['value'] ?? [];
                        $oldArray = is_array($oldValue) ? $oldValue : ($oldValue ? [$oldValue] : []);
                        $newArray = is_array($newValue) ? $newValue : [$newValue];
                        $field['value'] = array_merge($oldArray, $newArray);
                    } else {
                        $oldValue = $field['value'] ?? null;
                        if ($oldValue) {
                            $oldFiles = is_array($oldValue) ? $oldValue : [$oldValue];
                            foreach ($oldFiles as $oldFile) {
                                if (is_string($oldFile) && File::exists(public_path('storage/uploads/image/' . $oldFile))) {
                                    File::delete(public_path('storage/uploads/image/' . $oldFile));
                                }
                            }
                        }
                        $field['value'] = $newValue;
                    }
                } elseif ($typeField === 'image') {
                    if ($request->has($key)) {
                        $submitted = $request->input($key);
                        $field['value'] = $submitted !== null ? $submitted : $field['value'];
                    }
                } elseif ($typeField === 'checkbox') {
                    $val = $request->input($key);
                    $field['value'] = ($val === "true" || $val === true);
                } elseif ($request->has($key)) {
                    $field['value'] = $request->input($key);
                }
            }
            unset($field); // break reference
        }

        File::put($this->file, json_encode(['layout' => array_merge([$type => $currentSettings], $otherSetting)], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        return redirect()->back()->with('success', "{$type} updated successfully");
    }

    protected function typeRender($key, $value, $field = [])
    {
        if ($field['type'] == 'image' && is_array($value)) {
            $trq = [];
            foreach ($value as $keys => $file) {
                if ($file instanceof \Illuminate\Http\UploadedFile) {
                    $filename = time() . '_' . md5('layout-images') . '_' . $key . $keys . '.' . $file->getClientOriginalExtension();
                    $file->move(public_path('storage/uploads/image'), $filename);
                    $trq[] = $filename;
                } else if (is_string($file)) {
                    $trq[] = $file;
                }
            }
            $value = $trq;
            // return $trq;
            return $value;
        } elseif ($field['type'] == 'image' && $value instanceof \Illuminate\Http\UploadedFile) {
            $filename = time() . '_' . md5('layout-images') . '_' . $key . '.' . $value->getClientOriginalExtension();
            $value->move(public_path('storage/uploads/image'), $filename);
            return $filename;
        }

        return $value;
    }
}
