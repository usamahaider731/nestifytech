<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$users = Illuminate\Support\Facades\DB::table('users')->get(['id', 'name', 'email', 'roles']);
foreach ($users as $u) {
    echo "ID: {$u->id} | Name: {$u->name} | Roles: {$u->roles}\n";
}

$stores = Illuminate\Support\Facades\DB::table('posts')->where('type', 'store')->get(['id', 'title']);
echo "\n--- STORES ---\n";
foreach ($stores as $s) {
    echo "ID: {$s->id} | Title: {$s->title}\n";
}
