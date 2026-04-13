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
        $allMenus = DB::table('menu')->get();
        return Inertia::render('Admin/Layout/Menu', [
            'menu' => $allMenus,
            'menu_options' => DB::table('menu')->where('parent_id', 0)->get()
        ]);
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

                if ($typeField === 'image' && $request->has($key)) {
                    $field['value'] = $this->typeRender($key, $request->$key, $field);
                } elseif ($typeField === 'checkbox') {
                    $val = $request->input($key);
                    $field['value'] = ($val === "true" || $val === true);
                } elseif ($request->has($key)) {
                    $field['value'] = $request->input($key);
                }
            }
        }

        File::put($this->file, json_encode(['layout' => array_merge([$type => $currentSettings], $otherSetting)], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        return response()->json(['status' => true, 'message' => 'Layout updated successfully', 'data' => $currentSettings]);
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
            return $trq;
        } elseif ($field['type'] == 'image' && $value instanceof \Illuminate\Http\UploadedFile) {
            $filename = time() . '_' . md5('layout-images') . '_' . $key . '.' . $value->getClientOriginalExtension();
            $value->move(public_path('storage/uploads/image'), $filename);
            return $filename;
        }
        return $value;
    }
}
