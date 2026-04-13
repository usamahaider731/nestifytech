<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class LanguageController extends Controller
{
    protected $file;

    public function __construct()
    {
        parent::__construct();
        $this->file = storage_path('app/data/lang/language.json');
        if (!File::exists(dirname($this->file))) {
            File::makeDirectory(dirname($this->file), 0755, true);
        }
        if (!File::exists($this->file)) {
            File::put($this->file, json_encode([], JSON_PRETTY_PRINT));
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
        return Inertia::render('Admin/Language/Create');
    }

    /**
     * Store new language in JSON.
     */
    public function submit(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'prefix' => 'required|string|size:2|unique_in_json:' . $this->file
        ]);

        $languages = json_decode(File::get($this->file), true) ?: [];
        $languages[] = [
            'name' => $request->name,
            'prefix' => strtolower($request->prefix),
            'status' => 'publish'
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

        return Inertia::render('Admin/Language/Edit', [
            'language' => $language
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
        foreach ($languages as &$lang) {
            if ($lang['prefix'] === $prefix) {
                $lang['name'] = $request->name;
            }
        }

        File::put($this->file, json_encode($languages, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        return redirect()->route('admin.lang.index')->with('success', 'Language updated in JSON file.');
    }
}