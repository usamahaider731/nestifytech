<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

use function PHPSTORM_META\type;

class LanguageController extends Controller
{
    protected $file;
    protected $form_file;
    public function __construct()
    {
        parent::__construct();
        $this->file = storage_path('app/data/lang/language.json');
        $this->form_file = storage_path('app/data/lang/form.json');
        if (!File::exists(dirname($this->file))) {
            File::makeDirectory(dirname($this->file), 0755, true);
        }
        if (!File::exists($this->file)) {
            File::put($this->file, json_encode([], JSON_PRETTY_PRINT));
        }
        if (!File::exists(dirname($this->form_file))) {
            File::makeDirectory(dirname($this->form_file), 0755, true);
        }
        if (!File::exists($this->form_file)) {
            File::put($this->form_file, json_encode([], JSON_PRETTY_PRINT));
        }
    }

    /**
     * Display languages from JSON.
     */
    public function index()
    {
        $languages = json_decode(File::get($this->file), true) ?: [];
        return Inertia::render('Admin/Language/Index', [
            'languages' => $languages
        ]);
    }

    /**
     * Create language view.
     */
    public function create()
    {
        $data = [];
        if (File::exists($this->form_file)) {
            $data = json_decode(file_get_contents($this->form_file), true);
        }
        return Inertia::render('Admin/Language/Create', [
            'data' => $data
        ]);
    }

    /**
     * Store new language in JSON.
     */
    public function submit(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'prefix' => 'required|string|size:2'
        ]);

        $languages = json_decode(File::get($this->file), true) ?: [];
        foreach ($languages as $key => $value) {
            if ($value['prefix'] == $request->prefix) {
                return redirect()->with('error', 'Language added to JSON file.');
            }
        }
        $file = $request->file("image");
        $image = null;
        if ($file) {
            $filename = time() . '_' . md5("language") . '_' . $request->prefix . '.' . $file->getClientOriginalExtension();
            Storage::disk('public')->putFileAs('uploads/image', $file, $filename);
            $image = $filename;
        }
        $languages[] = [
            'name' => $request->name,
            'prefix' => strtolower($request->prefix),
            'direction' => $request->direction,
            'is_default' => $request->is_default,
            'active' => $request->active,
            'image' => $image
        ];

        File::put($this->file, json_encode($languages, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        // Create initial translation file if not exists
        $transPath = storage_path("app/data/lang/" . strtolower($request->prefix) . "_lang.json");
        if (!File::exists($transPath)) {
            File::put($transPath, json_encode((object)[], JSON_PRETTY_PRINT));
        }

        return redirect()->route('admin.lang.index')->with('success', 'Language added to JSON file.');
    }

    /**
     * Edit language view.
     */
    public function edit($prefix)
    {
        $languages = json_decode(File::get($this->file), true) ?: [];
        $language = collect($languages)->firstWhere('prefix', $prefix);
        if (!$language) abort(404);
        // dd($language);
        if (File::exists($this->form_file)) {
            $data = json_decode(file_get_contents($this->form_file), true);
        }
        if ($language['is_default']=="true") {
            $language['is_default'] = true;
        }
        else{
            $language['is_default'] = false;
        }
        if ($language['active']=="true") {
            $language['active'] = true;
        }
        else{
            $language['active'] = false;
        }
        return Inertia::render('Admin/Language/Edit', [
            'initialData' => $language,
            'data' => $data
        ]);
    }

    /**
     * Update language in JSON.
     */
    public function update(Request $request, $prefix)
    {
        $request->validate([
            'name' => 'required|string',
        ]);
        $languages = json_decode(File::get($this->file), true) ?: [];

        $image = $request->image;
        $is_previs_image = true;
        $previs_image = null;
        foreach ($languages as $key => $value) {
            if ($value['prefix'] == $prefix) {
                if (!is_string($request->image)) {
                    $is_previs_image = false;
                    $previs_image = $value['image'];
                }
            }
            if ($request->is_default && $value['is_default'] == true) {
                $value['is_default'] = false;
            }
        }
        if (!$is_previs_image) {
            Storage::disk('public')->delete('uploads/image/' . $previs_image);
            $file = $request->file("image");
            $filename = time() . '_' . md5("language") . '_' . $prefix . '.' . $file->getClientOriginalExtension();
            Storage::disk('public')->putFileAs('uploads/image', $file, $filename);
            $flag = $filename;
        } else {
            $flag = $request->image;
        }

        foreach ($languages as &$lang) {
            if ($lang['prefix'] === $prefix) {
                $lang['name'] = $request->name;
                $lang['image'] = $flag;
                $lang['direction'] = $request->direction;
                $lang['active'] = $request->active;
                $lang['is_default'] = $request->is_default;
            }
        }

        File::put($this->file, json_encode($languages, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        return redirect()->route('admin.lang.index')->with('success', 'Language updated in JSON file.');
    }
}
