<?php
namespace App\Http\Controllers;
use App\Models\Media;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
class LanguageController extends Controller
{
    public $data;
    public $file_lang;
    public $data_lang;
    public $file;
    function __construct()
    {
        parent::__construct();
        $this->file = $this->json_file_location . '/Form.json';
        $this->file_lang = $this->json_file_location . '/lang/language.json';
        $lang_file = $this->file_lang;
        if (File::exists($this->file)) {
            $data = file_get_contents($this->file);
            $data = json_decode($data, true);
            $this->data = $data['language'];
        }
        if (File::exists($lang_file)) {
            $data_lang = file_get_contents($lang_file);
            $this->data_lang = json_decode($data_lang, true);
        }
    }
    public function create()
    {
        $data = $this->data;
        return Inertia::render('Admin/Language/Create', ['data' => $data]);
    }
    public function index()
    {
        $data = $this->data_lang;
        return Inertia::render('Admin/Language/Index', ['data' => $data]);
    }
    protected function imageRender($key, $value, $field = [])
    {
        if (!empty($field['value'])) {
            if (file_exists(public_path('storage/uploads/image/' . $field['value']))) {
                unlink(public_path('storage/uploads/image/' . $field['value']));
            }
        }
        $filename = time() . '_' . md5('language-images') . '_' . $key . '.' . $value->getClientOriginalExtension();
        $value->move(public_path('storage/uploads/image'), $filename);
        return $filename;
    }
    public function submit(Request $request)
    {
        $data = $this->data;
        $file = $this->file;
        $data_t = json_decode(file_get_contents($this->json_file_location . '/lang/language.json'), true);
        $file = json_decode(file_get_contents($file), true);
        if ($request->prefix) {
            $file_name = "{$request->prefix}_lang.json";
            $file_location = $this->json_file_location;
            if (File::exists($file_location . '/lang/' . $file_name)) {
                return redirect()->back()->with('error', 'This Prefix is Already in Use');
            }
            if (!empty($data_t)) {
                foreach ($data_t as $key => $value) {
                    if ($value['prefix'] == $request->prefix) {
                        return redirect()->back()->with('error', 'This Prefix is Already in Use');
                    }
                    if($request->is_default && $value['is_default']==true){
                        $data_t[$key]['is_default']=false;
                    }
                }
            }
            $image = '';
            if ($request->image) {
                $image = $this->imageRender('flag', $request->image);
            }
            $stuv = [
                'prefix' => $request->prefix,
                'name' => $request->name ?? 'English',
                'direction' => $request->direction ?? 'ltr',
                'active' => $request->active ?? true,
                'is_default' => $request->is_default ?? false,
                'image' => $image
            ];
            File::put($file_location . '/lang/' . $file_name, json_encode([]));
            $data_t[] = $stuv;
            File::put($this->json_file_location . '/lang/language.json', json_encode($data_t, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            return redirect()->route('admin.lang.create')->with('success', 'Language Created Successfully');
        }
    }
    public function edit(Request $request, $prefix)
    {
        $data = $this->data;
        $data_lang = $this->data_lang;
        foreach ($data_lang as $key => $value) {
            if ($value['prefix'] == $prefix) {
                $data_lang = $value;
                break;
            }
        }
        return Inertia::render('Admin/Language/Edit', ['data' => $data, 'initialData' => $data_lang, 'prefix' => $prefix]);
    }
    public function update(Request $request, $prefix)
    {
        $data_t = json_decode(file_get_contents($this->json_file_location . '/lang/language.json'), true);
        $file_location = $this->json_file_location;
        foreach ($data_t as $key => $value) {
            if ($value['prefix'] == $prefix) {
                $image = $value['image'] ?? '';
                if ($request->image) {
                    if (is_string($request->image)) {
                        $image = $request->image;
                    } else {
                        $image = $this->imageRender('flag', $request->image, ['type' => 'image', 'value' => $value['image'] ?? '']);
                    }
                }
                if ($request->is_default && $value['is_default']==false) {
                    foreach ($data_t as $k => $v) {
                        if ($v['is_default'] == true) {
                            $data_t[$k]['is_default'] = false;
                            break;
                        }
                    }
                }
                $data_t[$key]['name'] = $request->name ?? $value['name'];
                $data_t[$key]['direction'] = $request->direction ?? $value['direction'];
                $data_t[$key]['active'] = $request->active ?? $value['active'];
                $data_t[$key]['is_default'] = $request->is_default ?? $value['is_default'];
                $data_t[$key]['image'] = $image;
                break;
            }
        }
        File::put($this->json_file_location . '/lang/language.json', json_encode($data_t, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        return redirect()->route('admin.lang.index')->with('success', 'Language Updated Successfully');
    }
}