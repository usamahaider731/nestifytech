<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';

use App\Models\Module;
use Illuminate\Support\Facades\DB;

$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$modules = Module::where('config_type', 'DB')->get();

foreach ($modules as $module) {
    $content = $module->content;
    $updated = false;

    if (isset($content['model']) && !isset($content['table'])) {
        $model = $content['model'];
        $table = match ($model) {
            'App\Models\Posts' => 'posts',
            'App\Models\Taxonomy' => 'taxonomy',
            'App\Models\User' => 'users',
            'App\Models\Roles' => 'roles',
            'App\Models\Attributes' => 'attributes',
            'App\Models\Review' => 'reviews',
            'App\Models\Language' => 'languages',
            default => strtolower(class_basename($model))
        };
        $content['table'] = $table;
        // Optional: Keep model for relations if needed, but for 'complete dynamic' we might want to remove it
        // unset($content['model']); 
        $updated = true;
    }

    if ($updated) {
        $module->setAttribute('content', $content);
        $module->save();
        echo "Updated module: {$module->type} to use table '{$content['table']}'\n";
    }
}

echo "All module configurations updated to database table mapping.\n";
