<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    $res = \Illuminate\Support\Facades\Http::timeout(10)
        ->post('https://openrouter.ai/api/v1/chat/completions', [
            'model' => 'meta-llama/llama-3.2-3b-instruct:free',
            'messages' => [['role' => 'user', 'content' => 'Say hello in 5 words']],
        ]);
    echo "OPENROUTER NO KEY STATUS: " . $res->status() . "\n";
    echo "BODY: " . substr($res->body(), 0, 150) . "\n";
} catch (\Throwable $e) {
    echo "ERR: " . $e->getMessage() . "\n";
}


// Test DuckDuckGo AI / Pollinations / HuggingFace free endpoints
try {
    $res = \Illuminate\Support\Facades\Http::timeout(15)
        ->post('https://text.pollinations.ai/', [
            'messages' => [
                ['role' => 'system', 'content' => 'You are an ecommerce assistant.'],
                ['role' => 'user', 'content' => 'Say hello in 5 words']
            ],
            'model' => 'openai',
            'jsonMode' => false
        ]);
    echo "POLLINATIONS STATUS: " . $res->status() . "\n";
    echo "POLLINATIONS BODY: " . substr($res->body(), 0, 150) . "\n";
} catch (\Throwable $e) {
    echo "POLLINATIONS ERR: " . $e->getMessage() . "\n";
}

