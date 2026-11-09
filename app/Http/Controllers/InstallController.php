<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Artisan;
use PDO;
use Exception;

class InstallController extends Controller
{
    private string $installedLockPath;
    private string $sqlDumpPath;
    private string $settingFilePath;
    private string $licenseFilePath;

    public function __construct()
    {
        $this->installedLockPath = storage_path('installed');
        $this->sqlDumpPath = storage_path('app/import/nestifytech.sql');
        $this->settingFilePath = storage_path('app/data/setting.json');
        $this->licenseFilePath = storage_path('app/license.json');
    }

    public function getLicenseServerUrl(): string
    {
        return env('LICENSE_SERVER_URL', 'https://usamahaider.vercel.app/api/license');
    }

    public function getLicenseApiSecret(): string
    {
        return env('LICENSE_API_SECRET', 'nestify-secret-key-2026');
    }

    public function getLicenseData(): ?array
    {
        if (File::exists($this->licenseFilePath)) {
            return json_decode(File::get($this->licenseFilePath), true) ?: null;
        }
        return null;
    }

    /**
     * Fetch live pricing & methods from external License Server
     */
    public function getLicensePricing(Request $request)
    {
        $serverUrl = rtrim($this->getLicenseServerUrl(), '/') . '/pricing';
        try {
            $response = \Illuminate\Support\Facades\Http::timeout(10)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->getLicenseApiSecret(),
                    'x-api-key'     => $this->getLicenseApiSecret(),
                    'Accept'        => 'application/json',
                ])
                ->get($serverUrl);

            if ($response->successful()) {
                return response()->json($response->json());
            }
        } catch (\Throwable $e) {
            // fallback if remote server has connection issues
        }

        // Default fallback package if remote call fails (matches Portfolio pricing)
        return response()->json([
            'success'         => true,
            'product_name'    => 'NestifyTech - E-Commerce Platform License',
            'product_sku'     => 'nestify-pro',
            'version'         => '2.0.0',
            'regular_price'   => 999.00,
            'sale_price'      => 700.00,
            'price'           => 700.00,
            'currency'        => 'USD',
            'currency_symbol' => '$',
            'methods'         => [
                [
                    'id'          => 'card',
                    'name'        => 'Credit / Debit Card',
                    'icon'        => 'ri-bank-card-line',
                    'description' => 'Pay securely with Visa, Mastercard, or American Express',
                ],
                [
                    'id'          => 'paypal',
                    'name'        => 'PayPal Express',
                    'icon'        => 'ri-paypal-line',
                    'description' => 'Instant checkout with PayPal balance or linked card',
                ],
                [
                    'id'          => 'license_key',
                    'name'        => 'Existing License Key',
                    'icon'        => 'ri-key-2-line',
                    'description' => 'Already purchased? Enter your activation license key',
                ],
            ],
        ]);
    }

    /**
     * Submit payment to External License Server
     */
    public function verifyLicensePayment(Request $request)
    {
        $serverUrl = rtrim($this->getLicenseServerUrl(), '/') . '/pay';
        $payload = $request->all();
        $payload['domain'] = $request->getHost();

        try {
            $response = \Illuminate\Support\Facades\Http::timeout(15)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->getLicenseApiSecret(),
                    'x-api-key'     => $this->getLicenseApiSecret(),
                    'Accept'        => 'application/json',
                ])
                ->post($serverUrl, $payload);
            $data = $response->json();

            if ($response->successful() && !empty($data['success'])) {
                // Save verified license locally
                File::put($this->licenseFilePath, json_encode($data, JSON_PRETTY_PRINT));

                return response()->json([
                    'success'     => true,
                    'message'     => $data['message'] ?? 'Payment verified & license activated!',
                    'license_key' => $data['license_key'] ?? '',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => $data['message'] ?? 'Payment verification failed on license server.',
            ], $response->status() ?: 422);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not connect to License Server: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function isInstalled(): bool
    {
        return File::exists($this->installedLockPath) || env('APP_INSTALLED', false);
    }

    /**
     * Show installer wizard
     */
    public function index(Request $request)
    {
        if ($this->isInstalled()) {
            return redirect('/')->with('error', 'NestifyTech is already installed.');
        }

        $step = (int) $request->query('step', 1);

        $requirements = $this->checkServerRequirements();
        $permissions = $this->checkDirectoryPermissions();
        $canProceedRequirements = $requirements['all_passed'] && $permissions['all_passed'];

        $licenseData = $this->getLicenseData();
        $isLicensed  = !empty($licenseData['license_key']);

        // Check if database is configured and connected
        $isDbConnected = false;
        try {
            $isDbConnected = (bool) DB::connection()->getPdo();
        } catch (\Throwable $e) {
            $isDbConnected = false;
        }

        // Check if default tables (nestifytech.sql) have been imported
        $isDbImported = false;
        if ($isDbConnected) {
            try {
                $isDbImported = \Illuminate\Support\Facades\Schema::hasTable('posts') && \Illuminate\Support\Facades\Schema::hasTable('taxonomies');
            } catch (\Throwable $e) {
                $isDbImported = false;
            }
        }

        // ── STEP ENFORCEMENT GUARD ───────────────────────────────────────────
        // If user tries to skip ahead to a step without completing previous ones:
        if ($step >= 2 && !$canProceedRequirements) {
            return redirect()->route('install.index', ['step' => 1])
                ->with('error', 'Please resolve all server requirements and permissions first.');
        }

        if ($step >= 3 && !$isLicensed) {
            return redirect()->route('install.index', ['step' => 2])
                ->with('error', 'Please activate your license and complete payment to proceed.');
        }

        if ($step >= 4 && !$isDbConnected) {
            return redirect()->route('install.index', ['step' => 3])
                ->with('error', 'Please configure and test your database connection first.');
        }

        if ($step >= 5 && !$isDbImported) {
            return redirect()->route('install.index', ['step' => 4])
                ->with('error', 'Please import the default database before setting up the administrator.');
        }

        // Existing DB configuration from .env / config
        $dbConfig = [
            'host'     => config('database.connections.mysql.host', '127.0.0.1'),
            'port'     => config('database.connections.mysql.port', '3306'),
            'database' => config('database.connections.mysql.database', 'nestifytech'),
            'username' => config('database.connections.mysql.username', 'root'),
            'password' => config('database.connections.mysql.password', ''),
        ];

        // Existing Settings from setting.json if available
        $currentSettings = [];
        if (File::exists($this->settingFilePath)) {
            $currentSettings = json_decode(File::get($this->settingFilePath), true) ?: [];
        }

        return view('install.index', [
            'step'                   => $step,
            'requirements'           => $requirements,
            'permissions'            => $permissions,
            'canProceedRequirements' => $canProceedRequirements,
            'dbConfig'               => $dbConfig,
            'currentSettings'        => $currentSettings,
            'sqlExists'              => File::exists($this->sqlDumpPath),
            'licenseData'            => $licenseData,
            'isLicensed'             => $isLicensed,
            'isDbConnected'          => $isDbConnected,
            'isDbImported'           => $isDbImported,
        ]);
    }

    /**
     * Test Database Connection
     */
    public function testDatabase(Request $request)
    {
        if ($this->isInstalled()) {
            return response()->json(['success' => false, 'message' => 'Already installed.'], 403);
        }

        $validated = $request->validate([
            'db_host'     => 'required|string',
            'db_port'     => 'required|numeric',
            'db_database' => 'required|string',
            'db_username' => 'required|string',
            'db_password' => 'nullable|string',
        ]);

        try {
            $dsn = "mysql:host={$validated['db_host']};port={$validated['db_port']};charset=utf8mb4";
            $pdo = new PDO($dsn, $validated['db_username'], $validated['db_password'] ?? '', [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 5,
            ]);

            // Check if database exists, create if not
            $dbName = str_replace('`', '``', $validated['db_database']);
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");

            return response()->json([
                'success' => true,
                'message' => "Successfully connected! Database '{$validated['db_database']}' is ready.",
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Connection failed: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Save Database Configuration to .env
     */
    public function saveDatabase(Request $request)
    {
        if ($this->isInstalled()) {
            return response()->json(['success' => false, 'message' => 'Already installed.'], 403);
        }

        $validated = $request->validate([
            'db_host'     => 'required|string',
            'db_port'     => 'required|numeric',
            'db_database' => 'required|string',
            'db_username' => 'required|string',
            'db_password' => 'nullable|string',
        ]);

        try {
            // Verify connection first
            $dsn = "mysql:host={$validated['db_host']};port={$validated['db_port']};charset=utf8mb4";
            $pdo = new PDO($dsn, $validated['db_username'], $validated['db_password'] ?? '', [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 5,
            ]);
            $dbName = str_replace('`', '``', $validated['db_database']);
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");

            // Update .env file
            $this->updateEnvFile([
                'DB_HOST'     => $validated['db_host'],
                'DB_PORT'     => $validated['db_port'],
                'DB_DATABASE' => $validated['db_database'],
                'DB_USERNAME' => $validated['db_username'],
                'DB_PASSWORD' => $validated['db_password'] ?? '',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Database configured successfully in .env!',
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Import default database dump from storage/app/import/nestifytech.sql
     */
    public function importDatabase(Request $request)
    {
        if ($this->isInstalled()) {
            return response()->json(['success' => false, 'message' => 'Already installed.'], 403);
        }

        if (!File::exists($this->sqlDumpPath)) {
            return response()->json([
                'success' => false,
                'message' => 'Default SQL dump file not found at: storage/app/import/nestifytech.sql',
            ], 404);
        }

        // Increase memory and execution time for large SQL import
        @ini_set('memory_limit', '512M');
        @set_time_limit(600);

        try {
            $host = config('database.connections.mysql.host', '127.0.0.1');
            $port = config('database.connections.mysql.port', '3306');
            $database = config('database.connections.mysql.database', 'nestifytech');
            $username = config('database.connections.mysql.username', 'root');
            $password = config('database.connections.mysql.password', '');

            $dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";
            $pdo = new PDO($dsn, $username, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);

            $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
            $pdo->exec("SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';");

            // Execute SQL dump statement by statement to avoid memory overflow
            $handle = fopen($this->sqlDumpPath, 'r');
            if (!$handle) {
                throw new Exception("Unable to open SQL dump file.");
            }

            $query = '';
            $executedStatements = 0;

            while (($line = fgets($handle)) !== false) {
                // Skip comments and empty lines
                $trimmed = trim($line);
                if (empty($trimmed) || str_starts_with($trimmed, '--') || str_starts_with($trimmed, '/*')) {
                    continue;
                }

                $query .= $line;

                // Check if end of statement
                if (str_ends_with(rtrim($trimmed), ';')) {
                    try {
                        $pdo->exec($query);
                        $executedStatements++;
                    } catch (Exception $sqlEx) {
                        // Ignore harmless duplicate or warnings, continue
                    }
                    $query = '';
                }
            }
            fclose($handle);

            $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

            return response()->json([
                'success' => true,
                'message' => "Database imported successfully! ({$executedStatements} statements executed).",
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Database import failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create Administrator Account & Setup Store Name
     */
    public function setupAdmin(Request $request)
    {
        if ($this->isInstalled()) {
            return response()->json(['success' => false, 'message' => 'Already installed.'], 403);
        }

        $validated = $request->validate([
            'site_name'     => 'required|string|max:100',
            'site_tagline'  => 'nullable|string|max:200',
            'admin_name'    => 'required|string|max:100',
            'admin_email'   => 'required|email|max:150',
            'admin_password'=> 'required|string|min:6',
        ]);

        try {
            // Update site name and tagline in setting.json
            $this->updateSiteSettings([
                'name'    => $validated['site_name'],
                'tagline' => $validated['site_tagline'] ?? 'Shop the World',
                'email'   => $validated['admin_email'],
            ]);

            // Update or create Super Administrator (ID 1)
            $existingAdmin = DB::table('users')->where('id', 1)->first();
            $hashedPassword = Hash::make($validated['admin_password']);

            if ($existingAdmin) {
                DB::table('users')->where('id', 1)->update([
                    'name'              => $validated['admin_name'],
                    'email'             => $validated['admin_email'],
                    'password'          => $hashedPassword,
                    'roles'             => json_encode(["1"]),
                    'email_verified_at' => now(),
                    'active'            => 1,
                    'updated_at'        => now(),
                ]);
            } else {
                DB::table('users')->insert([
                    'id'                => 1,
                    'name'              => $validated['admin_name'],
                    'email'             => $validated['admin_email'],
                    'password'          => $hashedPassword,
                    'roles'             => json_encode(["1"]),
                    'email_verified_at' => now(),
                    'active'            => 1,
                    'wallet_balance'    => 0.00,
                    'created_at'        => now(),
                    'updated_at'        => now(),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Super Administrator account created and configured successfully!',
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Admin setup failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Save Payment Gateways Settings & Finalize Installation
     */
    public function setupPaymentAndFinalize(Request $request)
    {
        if ($this->isInstalled()) {
            return response()->json(['success' => false, 'message' => 'Already installed.'], 403);
        }

        $validated = $request->validate([
            // COD
            'cod_enabled'            => 'nullable|boolean',
            'cod_instructions'       => 'nullable|string',
            // Stripe
            'stripe_enabled'         => 'nullable|boolean',
            'stripe_mode'            => 'nullable|in:test,live',
            'stripe_publishable_key' => 'nullable|string',
            'stripe_secret_key'      => 'nullable|string',
            'stripe_currency'        => 'nullable|string',
            // PayPal
            'paypal_enabled'         => 'nullable|boolean',
            'paypal_mode'            => 'nullable|in:sandbox,live',
            'paypal_client_id'       => 'nullable|string',
            'paypal_secret'          => 'nullable|string',
            'paypal_currency'        => 'nullable|string',
            // Payoneer
            'payoneer_enabled'       => 'nullable|boolean',
            'payoneer_username'      => 'nullable|string',
            'payoneer_api_password'  => 'nullable|string',
            'payoneer_currency'      => 'nullable|string',
        ]);

        try {
            // Update payment in setting.json
            $this->updatePaymentSettings($validated);

            // Generate App key if needed
            if (empty(env('APP_KEY'))) {
                Artisan::call('key:generate', ['--force' => true]);
            }

            // Create lock file & update .env with APP_INSTALLED=true
            $installData = [
                'installed_at' => now()->toIso8601String(),
                'version'      => '2.0.0',
                'installer'    => 'NestifyTech Web Installer',
            ];
            @File::put($this->installedLockPath, json_encode($installData, JSON_PRETTY_PRINT));
            
            try {
                $this->updateEnvFile([
                    'APP_INSTALLED' => 'true',
                ]);
            } catch (\Throwable $ignore) {}

            // Clear cache safely
            try {
                Artisan::call('config:clear');
            } catch (\Throwable $ignore) {}
            try {
                Artisan::call('cache:clear');
            } catch (\Throwable $ignore) {}
            try {
                Artisan::call('view:clear');
            } catch (\Throwable $ignore) {}

            $redirectUrl = \Illuminate\Support\Facades\Route::has('admin.login')
                ? route('admin.login', [], false)
                : (\Illuminate\Support\Facades\Route::has('login') ? route('login', [], false) : '/login');

            return response()->json([
                'success'     => true,
                'message'     => 'NestifyTech has been installed successfully!',
                'redirect_url'=> $redirectUrl,
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Installation finalize error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Finalization failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Check System PHP & Extension Requirements
     */
    private function checkServerRequirements(): array
    {
        $requirements = [
            'PHP Version (>= 8.2)' => [
                'current' => phpversion(),
                'pass'    => version_compare(phpversion(), '8.2.0', '>='),
            ],
            'PDO PHP Extension' => [
                'current' => extension_loaded('pdo') ? 'Enabled' : 'Disabled',
                'pass'    => extension_loaded('pdo'),
            ],
            'PDO MySQL Extension' => [
                'current' => extension_loaded('pdo_mysql') ? 'Enabled' : 'Disabled',
                'pass'    => extension_loaded('pdo_mysql'),
            ],
            'OpenSSL Extension' => [
                'current' => extension_loaded('openssl') ? 'Enabled' : 'Disabled',
                'pass'    => extension_loaded('openssl'),
            ],
            'Mbstring Extension' => [
                'current' => extension_loaded('mbstring') ? 'Enabled' : 'Disabled',
                'pass'    => extension_loaded('mbstring'),
            ],
            'Tokenizer Extension' => [
                'current' => extension_loaded('tokenizer') ? 'Enabled' : 'Disabled',
                'pass'    => extension_loaded('tokenizer'),
            ],
            'XML Extension' => [
                'current' => extension_loaded('xml') ? 'Enabled' : 'Disabled',
                'pass'    => extension_loaded('xml'),
            ],
            'CURL Extension' => [
                'current' => (extension_loaded('curl') || function_exists('curl_version') || function_exists('curl_init') || in_array('curl', get_loaded_extensions()) || file_exists(dirname(PHP_BINARY) . '/ext/php_curl.dll')) ? 'Enabled' : 'Disabled',
                'pass'    => true, // Optional in modern Laravel / handled via Guzzle / stream wrapper fallback
            ],
            'Fileinfo Extension' => [
                'current' => extension_loaded('fileinfo') ? 'Enabled' : 'Disabled',
                'pass'    => extension_loaded('fileinfo'),
            ],
            'JSON Extension' => [
                'current' => extension_loaded('json') ? 'Enabled' : 'Disabled',
                'pass'    => extension_loaded('json'),
            ],
        ];

        $allPassed = !in_array(false, array_column($requirements, 'pass'), true);

        return [
            'items'      => $requirements,
            'all_passed' => $allPassed,
        ];
    }

    /**
     * Check Writable Directory Permissions
     */
    private function checkDirectoryPermissions(): array
    {
        $directories = [
            'storage/app' => [
                'path'     => storage_path('app'),
                'writable' => is_writable(storage_path('app')),
            ],
            'storage/framework' => [
                'path'     => storage_path('framework'),
                'writable' => is_writable(storage_path('framework')),
            ],
            'storage/logs' => [
                'path'     => storage_path('logs'),
                'writable' => is_writable(storage_path('logs')),
            ],
            'bootstrap/cache' => [
                'path'     => base_path('bootstrap/cache'),
                'writable' => is_writable(base_path('bootstrap/cache')),
            ],
            '.env (Configuration)' => [
                'path'     => base_path('.env'),
                'writable' => is_writable(base_path('.env')) || is_writable(base_path()),
            ],
        ];

        $allPassed = !in_array(false, array_column($directories, 'writable'), true);

        return [
            'items'      => $directories,
            'all_passed' => $allPassed,
        ];
    }

    /**
     * Helper to safely update keys in .env
     */
    private function updateEnvFile(array $data): void
    {
        $envPath = base_path('.env');
        if (!File::exists($envPath)) {
            if (File::exists(base_path('.env.example'))) {
                File::copy(base_path('.env.example'), $envPath);
            } else {
                File::put($envPath, '');
            }
        }

        $envContent = File::get($envPath);

        foreach ($data as $key => $value) {
            // Escape values with spaces or special characters
            if (preg_match('/\s/', (string) $value) || str_contains((string) $value, '#') || str_contains((string) $value, '=')) {
                $escapedValue = '"' . addcslashes((string) $value, '"\\') . '"';
            } else {
                $escapedValue = (string) $value;
            }

            if (preg_match("/^{$key}=.*/m", $envContent)) {
                $envContent = preg_replace("/^{$key}=.*/m", "{$key}={$escapedValue}", $envContent);
            } else {
                $envContent .= "\n{$key}={$escapedValue}";
            }
        }

        File::put($envPath, $envContent);
    }

    /**
     * Helper to update site title and email in setting.json
     */
    private function updateSiteSettings(array $siteData): void
    {
        if (!File::exists($this->settingFilePath)) {
            return;
        }

        $settings = json_decode(File::get($this->settingFilePath), true) ?: [];

        if (isset($settings['site']['name'])) {
            $settings['site']['name']['value'] = $siteData['name'];
        }
        if (isset($settings['site']['tagline'])) {
            $settings['site']['tagline']['value'] = $siteData['tagline'];
        }
        if (isset($settings['site']['email'])) {
            $settings['site']['email']['value'] = $siteData['email'];
        }

        File::put($this->settingFilePath, json_encode($settings, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    }

    /**
     * Helper to update payment settings in setting.json
     */
    private function updatePaymentSettings(array $paymentData): void
    {
        if (!File::exists($this->settingFilePath)) {
            return;
        }

        $settings = json_decode(File::get($this->settingFilePath), true) ?: [];

        // COD
        if (isset($paymentData['cod_enabled'])) {
            $settings['payment']['cod_enabled']['value'] = (bool) $paymentData['cod_enabled'];
        }
        if (!empty($paymentData['cod_instructions'])) {
            $settings['payment']['cod_instructions']['value'] = $paymentData['cod_instructions'];
        }

        // Stripe
        if (isset($paymentData['stripe_enabled'])) {
            $settings['payment']['stripe_enabled']['value'] = (bool) $paymentData['stripe_enabled'];
        }
        if (!empty($paymentData['stripe_mode'])) {
            $settings['payment']['stripe_mode']['value'] = $paymentData['stripe_mode'];
        }
        if (!empty($paymentData['stripe_publishable_key'])) {
            $settings['payment']['stripe_publishable_key']['value'] = $paymentData['stripe_publishable_key'];
        }
        if (!empty($paymentData['stripe_secret_key'])) {
            $settings['payment']['stripe_secret_key']['value'] = $paymentData['stripe_secret_key'];
        }
        if (!empty($paymentData['stripe_currency'])) {
            $settings['payment']['stripe_currency']['value'] = $paymentData['stripe_currency'];
        }

        // PayPal
        if (isset($paymentData['paypal_enabled'])) {
            $settings['payment']['paypal_enabled']['value'] = (bool) $paymentData['paypal_enabled'];
        }
        if (!empty($paymentData['paypal_mode'])) {
            $settings['payment']['paypal_mode']['value'] = $paymentData['paypal_mode'];
        }
        if (!empty($paymentData['paypal_client_id'])) {
            $settings['payment']['paypal_client_id']['value'] = $paymentData['paypal_client_id'];
        }
        if (!empty($paymentData['paypal_secret'])) {
            $settings['payment']['paypal_secret']['value'] = $paymentData['paypal_secret'];
        }
        if (!empty($paymentData['paypal_currency'])) {
            $settings['payment']['paypal_currency']['value'] = $paymentData['paypal_currency'];
        }

        // Payoneer
        if (isset($paymentData['payoneer_enabled'])) {
            $settings['payment']['payoneer_enabled']['value'] = (bool) $paymentData['payoneer_enabled'];
        }
        if (!empty($paymentData['payoneer_username'])) {
            $settings['payment']['payoneer_username']['value'] = $paymentData['payoneer_username'];
        }
        if (!empty($paymentData['payoneer_api_password'])) {
            $settings['payment']['payoneer_api_password']['value'] = $paymentData['payoneer_api_password'];
        }
        if (!empty($paymentData['payoneer_currency'])) {
            $settings['payment']['payoneer_currency']['value'] = $paymentData['payoneer_currency'];
        }

        File::put($this->settingFilePath, json_encode($settings, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    }
}

