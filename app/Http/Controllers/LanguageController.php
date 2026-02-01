<?php

namespace App\Http\Controllers;

use App\Models\Media;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;

class LanguageController extends Controller
{
    public $data;
    public $file;
    function __construct()
    {
        parent::__construct();
        $this->file = $this->json_file_location . '/Form.json';

        if (File::exists($this->file)) {
            $data = file_get_contents($this->file);
            $data = json_decode($data, true);
            $this->data = $data['language'];
        }
    }
    public function create()
    {
        $data = $this->data;
        return Inertia::render('Admin/Language/Create', ['data' => $data]);
    }
    protected function typeRender($key, $value, $field = [])
    {
        // if ($field['type'] == 'image' && is_array($value)) {

        //     if (!empty($field['value']) && is_array($field['value'])) {

        //         foreach ($field['value'] as $oldFile) {
        //             if (file_exists(public_path('storage/uploads/image/' . $oldFile))) {
        //                 unlink(public_path('storage/uploads/image/' . $oldFile));
        //             }
        //         }
        //     }
        //     $trq = [];
        //     $filename = '';
        //     foreach ($value as $keys => $file) {

        //         if ($file instanceof \Illuminate\Http\UploadedFile) {
        //             $filename = time() . '_' . md5('language-images') . '_' . $key . $keys . '.' . $file->getClientOriginalExtension();
        //             $file->move(public_path('storage/uploads/image'), $filename);
        //             $trq[] = $filename;
        //         }
        //     }
        //     // dd($trq);
        //     return $settingItem['value'] = $trq;
        // } elseif ($field['type'] == 'image' && $value instanceof \Illuminate\Http\UploadedFile) {
            if (!empty($field['value'])) {
                if (file_exists(public_path('storage/uploads/image/' . $field['value']))) {
                    unlink(public_path('storage/uploads/image/' . $field['value']));
                }
            }
            $filename = time() . '_' . md5('language-images') . '_' . $key . '.' . $value->getClientOriginalExtension();
            $value->move(public_path('storage/uploads/image'), $filename);

            return $filename;
        // }
    }
    public function submit(Request $request)
    {
        $data = $this->data;
        $file = $this->file;
        $file = json_decode(file_get_contents($file), true);
        if ($request->prefix) {
            $file_name = "{$request->prefix}_lang.json";
            $file_location = $this->json_file_location;
            if (File::exists($file_location . '/lang/' . $file_name)) {
                return redirect()->back()->with('error', 'This Prefix is Already in Use');
            }
            if (!empty($data)) {
                foreach ($data as $key => $value) {

                    if ($value['prefix'] == $request->prefix) {
                        return redirect()->back()->with('error', 'This Prefix is Already in Use');
                    }
                }
            }
            if ($request->image) {
            }
            $stuv = [
                'prefix' => $request->prefix,
                'name' => $request->name ?? 'English',
                'direction' => $request->direction ?? 'ltr',
                'active' => $request->active ?? true,
                'is_default' => $request->is_default ?? false,

            ];
        }
    }
}
