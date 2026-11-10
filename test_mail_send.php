<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Mail;

echo "SMTP User:  " . config('mail.mailers.smtp.username') . "\n";
echo "From Addr:  " . config('mail.from.address') . "\n";
echo "Match:      " . (config('mail.mailers.smtp.username') === config('mail.from.address') ? "✅ YES" : "❌ NO - Sent tab won't show!") . "\n\n";

try {
    Mail::raw('Test: From address now matches SMTP user. Sent tab should show this!', function ($msg) {
        $msg->to('usamahaiderkhokher@gmail.com')->subject('NestifyTech - Sent Tab Test ' . now()->format('H:i:s'));
    });
    echo "SUCCESS ✅ Check Gmail → Sent!\n";
} catch (\Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}

