<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';

use App\Models\Module;
use Illuminate\Support\Facades\File;

$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$modules = Module::all();
$schemaPath = storage_path('app/schema');

if (!File::exists($schemaPath)) {
    File::makeDirectory($schemaPath, 0755, true);
}

foreach ($modules as $module) {
    $filename = "{$module->type}_{$module->config_type}.json";
    $path = "{$schemaPath}/{$filename}";
    
    File::put($path, json_encode($module->content, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo "Exported to file: {$filename}\n";
}

echo "All modules exported to storage/app/schema/\n";
