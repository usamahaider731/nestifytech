<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$metas = \Illuminate\Support\Facades\DB::table('post_meta')->where('post_id', 1)->get()->toArray();
foreach($metas as $meta) {
    if ($meta->key == 'category' || $meta->key == 'brand') {
        print_r($meta);
    }
}
