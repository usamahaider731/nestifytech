<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\File;

class LayoutController extends Controller
{


    public $file;
    public $data;
  
    function __construct()
    {
        parent::__construct();
        $this->file = $this->json_file_location.'/layout.json';

        $data = file_get_contents($this->file);
        $str = json_decode($data, true);
        $this->data = $str['layout'] ?? [];
    }

    public function menu(Request $request)
    {
        if ($request->id)
            Menu::where('parent_id', $request->id)->get();
        else
            Menu::where('parent_id', 0)->get();
        $menu_options = Menu::where('parent_id', 0)->get();
        if ($request->id)
            $menu =  Menu::where('parent_id', $request->id)->with('parent')->get();
        else
            $menu = Menu::where('parent_id', 0)->with('parent')->get();
        // dd($menu);
        return Inertia::render('Admin/Layout/Menu', [
            'menu' => $menu,
            'menu_options' => $menu_options
        ]);
    }
    public function menuUpdate(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'string|required|max:50',
            'link' => 'string|required|max:50',
        ]);
        $menu = Menu::where('id', $id)->first();
        $menu->update([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'parent_id' => $request->parent,
            'link' => $request->link
        ]);
    }
    public function layout(Request $request, $type)
    {
        // if ($request->id)
        //     $menu = Menu::where('parent_id', $request->id)->get();
        // else
        //     $menu = Menu::where('parent_id', 0)->get();
        // $menu_options = Menu::where('parent_id', 0)->get();
        // return Inertia::render('Admin/Layout/Menu', [
        //     'menu' => $menu,
        //     'menu_options' => $menu_options
        // ]);
        // print_r($this->data);
        // exit();
        $type = $type ?? 'Home';
        $type = ucfirst($type);

        $data = $this->data[$type] ?? [];
        return Inertia::render('Admin/Layout/LayoutSetting', compact('data', 'type'));
    }
    public function menuSubmit(Request $request)
    {
        $validated = $request->validate([
            'name' => 'string|required|max:50',
            'link' => 'string|required|max:50',
        ]);
        if ($request->parent != 0) {
        }
        Menu::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'parent_id' => $request->parent,
            'link' => $request->link,
        ]);
    }
    public function layoutSettings(Request $request, $type)
    {

        $type = $type ?? 'Home';
        $type = Str::ucfirst($type);

        $data = $this->data[$type] ?? [];

        //Capitalize first letter
        $type = Str::ucfirst($type);
        return Inertia::render('Admin/Layout/' . $type, compact('data', 'type'));
    }
    protected function typeRender($key, $value, $field = [])
    {
        if ($field['type'] == 'image' && is_array($value)) {

            if (!empty($field['value']) && is_array($field['value'])) {

                foreach ($field['value'] as $oldFile) {
                    if (file_exists(public_path('storage/uploads/image/' . $oldFile))) {
                        unlink(public_path('storage/uploads/image/' . $oldFile));
                    }
                }
            }
            $trq = [];
            $filename = '';
            foreach ($value as $keys => $file) {

                if ($file instanceof \Illuminate\Http\UploadedFile) {
                    $filename = time() . '_' . md5('layout-images') . '_' . $key . $keys . '.' . $file->getClientOriginalExtension();
                    $file->move(public_path('storage/uploads/image'), $filename);
                    $trq[] = $filename;
                }
            }
            // dd($trq);
            return $settingItem['value'] = $trq;
        } elseif ($field['type'] == 'image' && $value instanceof \Illuminate\Http\UploadedFile) {
            if (!empty($field['value'])) {
                if (file_exists(public_path('storage/uploads/image/' . $field['value']))) {
                    unlink(public_path('storage/uploads/image/' . $field['value']));
                }
            }
            $filename = time() . '_' . md5('layout-images') . '_' . $key . '.' . $value->getClientOriginalExtension();
            $value->move(public_path('storage/uploads/image'), $filename);

            return $settingItem['value'] = $filename;
        }
    }

    public function submitLayoutPages(Request $request, $type)
    {
        $type = Str::ucfirst($type ?? 'Home');

        /*
    |--------------------------------------------------------------------------
    | Decode layout data safely
    |--------------------------------------------------------------------------
    */
        $layoutSetting = $this->data;

        if (is_string($layoutSetting)) {
            $layoutSetting = json_decode($layoutSetting, true);
        }

        $layoutSetting = is_array($layoutSetting) ? $layoutSetting : [];

        if (!isset($layoutSetting[$type])) {
            return response()->json([
                'status' => false,
                'message' => 'Invalid layout type'
            ], 422);
        }

        /*
    |--------------------------------------------------------------------------
    | Separate current & other layouts
    |--------------------------------------------------------------------------
    */
        $currentSettings = $layoutSetting[$type];

        $otherSetting = array_filter(
            $layoutSetting,
            fn($key) => $key !== $type,
            ARRAY_FILTER_USE_KEY
        );

        /*
    |--------------------------------------------------------------------------
    | Update fields
    |--------------------------------------------------------------------------
    */
        foreach ($currentSettings as &$section) {

            if (empty($section['fields']) || !is_array($section['fields'])) {
                continue;
            }

            foreach ($section['fields'] as &$field) {

                $key  = $field['name'] ?? null;
                $typeField = $field['type'] ?? null;

                if (!$key || !$typeField) {
                    continue;
                }

                switch ($typeField) {

                    case 'image':

                        if ($request->hasFile($key)) {

                            if (!empty($field['multiple'])) {

                                $files = [];
                                foreach ($request->file($key) as $file) {
                                    $files[] = $file;
                                }

                                $field['value'] = $this->typeRender($key, $files, $field);
                            } else {
                                $field['value'] = $this->typeRender(
                                    $key,
                                    $request->file($key),
                                    $field
                                );
                            }
                        } else {
                            // Ensure correct default
                            $field['value'] = $field['multiple'] ?? false
                                ? ($field['value'] ?? [])
                                : ($field['value'] ?? '');
                        }
                        break;

                    case 'checkbox':
                        // Checkbox is false if not sent
                        $field['value'] = $request->boolean($key);
                        break;

                    case 'number':
                        if ($request->has($key)) {
                            $field['value'] = (int) $request->input($key);
                        }
                        break;

                    case 'dropdown':
                        if ($request->has($key)) {
                            $value = $request->input($key);
                            $field['value'] = is_array($value) ? $value : $value;
                        }
                        break;

                    default:
                        if ($request->has($key)) {
                            $field['value'] = $request->input($key);
                        }
                        break;
                }
            }
        }

        // IMPORTANT: remove references
        unset($section, $field);

        /*
    |--------------------------------------------------------------------------
    | Save updated layout
    |--------------------------------------------------------------------------
    */
        File::put(
            $this->file,
            json_encode([
                'layout' => [
                    $type => $currentSettings,
                    ...$otherSetting
                ]
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        );

        /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */
        return response()->json([
            'status'  => true,
            'message' => 'Layout updated successfully',
            'data'    => $currentSettings,
        ]);
    }
}
