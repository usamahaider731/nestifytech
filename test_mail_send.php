<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Mail;

try {
    echo "Testing Mail sending via configured SMTP...\n";
    echo "Host: " . config('mail.mailers.smtp.host') . "\n";
    echo "Port: " . config('mail.mailers.smtp.port') . "\n";
    echo "Username: " . config('mail.mailers.smtp.username') . "\n";
    echo "From: " . config('mail.from.address') . "\n";

    Mail::raw('This is a test email from NestifyTech verifying Gmail SMTP connection.', function ($message) {
        $message->to('usamahaiderkhokher@gmail.com')
                ->subject('NestifyTech SMTP Test Verification');
    });

    echo "SUCCESS: Email sent successfully!\n";
} catch (\Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}

