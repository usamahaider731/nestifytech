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
    //   function __construct()
    //     {
    //         $this->file = file_get_contents(public_path('data/layout.json'));

    //         $this->data = json_decode($this->file);
    //         $this->data = $this->data->layout ?? [];
    //     }
    function __construct()
    {
        $this->file = public_path('data/layout.json');

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
        return Inertia::render('Admin/Layout/LayoutSetting', compact('data'));
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
                    $filename = time() . '_' . md5('layout-images') . '_' . $key . $keys. '.' . $file->getClientOriginalExtension();
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
        // dd($request->all());
        $currentSettings = json_decode(json_encode($this->data[$type] ?? []), true);

        foreach ($currentSettings as &$section) {
            if (!isset($section['fields']) || !is_array($section['fields'])) {
                continue;
            }

            foreach ($section['fields'] as &$field) {
                $key = $field['name'] ?? null;
                if (!$key) continue;
                if ($field['type'] === 'image' && $request->hasFile($key)) {
                    if (isset($field['multiple']) && $field['multiple']) {
                        $strv = [];
                        foreach ($request->file($key) as $file) {
                            $strv[] = $file;
                        }
                        $uploadedNames = $this->typeRender($key, $strv, $field);
                        // dd($request->file($key));/
                    } else {
                        $files = $request->file($key);
                        $uploadedNames = $this->typeRender($key, $files, $field);
                    }
                    $field['value'] = $uploadedNames;
                } elseif ($request->has($key)) {
                    $field['value'] = $request->input($key);
                }
            }
        }
        File::put($this->file, json_encode([
            'layout' => [
                $type => $currentSettings
            ]
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        return response()->json([
            'status' => true,
            'message' => 'Layout updated successfully',
            'data' => $currentSettings,
        ]);
    }
}
