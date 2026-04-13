<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Artisan;

class AdminBuilderController extends Controller
{
    protected $schemaPath;

    public function __construct()
    {
        parent::__construct();
        $this->schemaPath = storage_path('app/schema');
        if (!File::exists($this->schemaPath)) {
            File::makeDirectory($this->schemaPath, 0755, true);
        }
    }

    /**
     * Display all dynamic modules from files.
     */
    public function index()
    {
        $files = File::files($this->schemaPath);
        $modules = [];

        foreach ($files as $file) {
            $name = $file->getFilenameWithoutExtension();
            if (preg_match('/^(.*)_(DB|Form|Table|Schema)$/', $name, $matches)) {
                $type = $matches[1];
                $configType = $matches[2];
                if (!isset($modules[$type])) $modules[$type] = [];
                $modules[$type][$configType] = [
                    'type' => $type,
                    'config_type' => $configType,
                    'filename' => $file->getFilename()
                ];
            }
        }

        return Inertia::render('Admin/Builder/Modules', [
            'modules' => $modules
        ]);
    }

    /**
     * Edit a specific module configuration.
     */
    public function edit($type, $config_type)
    {
        $path = "{$this->schemaPath}/{$type}_{$config_type}.json";
        if (!File::exists($path)) abort(404);

        return Inertia::render('Admin/Builder/EditModule', [
            'module' => [
                'type' => $type,
                'config_type' => $config_type,
                'content' => json_decode(File::get($path), true)
            ]
        ]);
    }

    /**
     * Update module configuration file.
     */
    public function update(Request $request, $id) // $id is actually $type_$configType now or passed from frontend
    {
        // For simplicity, we expect 'type' and 'config_type' in request if $id is not enough
        $type = $request->type;
        $config_type = $request->config_type;
        
        $request->validate([
            'content' => 'required|array'
        ]);

        $path = "{$this->schemaPath}/{$type}_{$config_type}.json";
        File::put($path, json_encode($request->input('content'), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        Artisan::call('optimize:clear');

        return redirect()->route('admin.builder.index')->with('success', "Module {$type} ({$config_type}) saved to file.");
    }

    /**
     * Create a new module configuration file.
     */
    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|string|alpha_dash',
            'config_type' => 'required|in:DB,Form,Table,Schema'
        ]);

        $path = "{$this->schemaPath}/{$request->type}_{$request->config_type}.json";
        if (!File::exists($path)) {
            File::put($path, json_encode([], JSON_PRETTY_PRINT));
        }

        return redirect()->back()->with('success', 'Module configuration file created.');
    }
    
    /**
     * Delete a module configuration file.
     */
    public function destroy($id) // $id = type_configType
    {
        if (preg_match('/^(.*)_(DB|Form|Table|Schema)$/', $id, $matches)) {
            $path = "{$this->schemaPath}/{$id}.json";
            if (File::exists($path)) File::delete($path);
        }
        return redirect()->back()->with('success', 'Configuration file deleted.');
    }
}
