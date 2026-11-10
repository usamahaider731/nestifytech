<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$key = 'xpl_7b9416585ae2f56dfd31485f0779986238e2141b';

echo "Testing Experientiallabs API directly with new key: " . substr($key, 0, 10) . "...\n\n";

try {
    $response = \Illuminate\Support\Facades\Http::timeout(15)
        ->withToken($key)
        ->acceptJson()
        ->post('https://api.experientiallabs.ai/v1/chat/completions', [
            'model' => 'gpt-5.6-luna',
            'messages' => [
                ['role' => 'user', 'content' => 'Say hello in 3 words.']
            ],
            'max_tokens' => 50,
        ]);

    echo "HTTP Status Code: " . $response->status() . "\n";
    echo "Raw Response Body:\n";
    echo $response->body() . "\n";

} catch (\Throwable $e) {
    echo "Request Exception: " . $e->getMessage() . "\n";
}

