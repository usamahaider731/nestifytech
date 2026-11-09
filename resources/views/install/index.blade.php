<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NestifyTech Installation & License Wizard</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <!-- Remix Icons CDN -->
    <link href="https://cdn.jsdelivr.net/npm/remixicon@4.2.0/fonts/remixicon.css" rel="stylesheet"/>
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <style>
        :root {
            --primary: #4f46e5;
            --primary-hover: #4338ca;
            --primary-light: #eef2ff;
            --success: #10b981;
            --danger: #ef4444;
            --warning: #f59e0b;
            --bg: #f8fafc;
            --card-bg: #ffffff;
            --text-heading: #0f172a;
            --text-muted: #64748b;
            --border: #e2e8f0;
            --radius: 16px;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Plus Jakarta Sans', sans-serif;
        }

        body {
            background-color: var(--bg);
            color: var(--text-heading);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 32px 16px;
            background-image: radial-gradient(#e2e8f0 1px, transparent 1px);
            background-size: 24px 24px;
        }

        .installer-container {
            width: 100%;
            max-width: 820px;
            background: var(--card-bg);
            border-radius: var(--radius);
            box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.08), 0 0 1px 1px rgba(15, 23, 42, 0.05);
            overflow: hidden;
            border: 1px solid var(--border);
        }

        /* Header */
        .installer-header {
            padding: 36px 40px 24px;
            background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
            border-bottom: 1px solid var(--border);
            text-align: center;
        }

        .logo-box {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 12px;
        }

        .logo-icon {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: linear-gradient(135deg, var(--primary), #818cf8);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            box-shadow: 0 8px 16px -4px rgba(79, 70, 229, 0.35);
        }

        .logo-title {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: var(--text-heading);
        }

        .installer-subtitle {
            color: var(--text-muted);
            font-size: 14px;
            margin-top: 4px;
        }

        /* Step Indicator */
        .steps-nav {
            display: flex;
            justify-content: space-between;
            padding: 16px 32px;
            background: #fff;
            border-bottom: 1px solid var(--border);
            overflow-x: auto;
        }

        .step-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 600;
            color: var(--text-muted);
            white-space: nowrap;
        }

        .step-item.active {
            color: var(--primary);
        }

        .step-item.completed {
            color: var(--success);
        }

        .step-badge {
            width: 26px;
            height: 26px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            background: #f1f5f9;
            color: var(--text-muted);
        }

        .step-item.active .step-badge {
            background: var(--primary);
            color: #fff;
        }

        .step-item.completed .step-badge {
            background: var(--success);
            color: #fff;
        }

        /* Content Body */
        .installer-body {
            padding: 36px 40px;
        }

        .step-section-title {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .step-section-desc {
            font-size: 14px;
            color: var(--text-muted);
            margin-bottom: 24px;
        }

        /* Checklist table */
        .checklist-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            border: 1px solid var(--border);
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 24px;
        }

        .checklist-table th, .checklist-table td {
            padding: 12px 16px;
            font-size: 13px;
            text-align: left;
            border-bottom: 1px solid var(--border);
        }

        .checklist-table th {
            background: #f8fafc;
            font-weight: 700;
            color: var(--text-heading);
        }

        .checklist-table tr:last-child td {
            border-bottom: none;
        }

        .badge-status {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }

        .badge-success {
            background: #ecfdf5;
            color: #065f46;
        }

        .badge-danger {
            background: #fef2f2;
            color: #991b1b;
        }

        /* Form Controls */
        .form-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            margin-bottom: 20px;
        }

        .col-span-2 {
            grid-column: span 2;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .form-label {
            font-size: 13px;
            font-weight: 600;
            color: var(--text-heading);
        }

        .form-control {
            width: 100%;
            padding: 11px 14px;
            font-size: 14px;
            border: 1px solid var(--border);
            border-radius: 10px;
            outline: none;
            transition: all 0.2s;
            background: #fff;
        }

        .form-control:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
        }

        .form-help {
            font-size: 12px;
            color: var(--text-muted);
        }

        /* Pricing Card */
        .pricing-hero {
            background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
            border-radius: 14px;
            padding: 24px;
            color: #fff;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 10px 25px -5px rgba(49, 46, 129, 0.3);
        }

        .pricing-badge {
            background: rgba(255, 255, 255, 0.15);
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            display: inline-block;
            margin-bottom: 8px;
        }

        .price-tag {
            font-size: 36px;
            font-weight: 800;
            letter-spacing: -1px;
        }

        .payment-method-selector {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 20px;
        }

        .method-card {
            border: 2px solid var(--border);
            border-radius: 12px;
            padding: 16px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            background: #fff;
        }

        .method-card:hover {
            border-color: #cbd5e1;
        }

        .method-card.selected {
            border-color: var(--primary);
            background: #fafbff;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.1);
        }

        .method-card-title {
            font-size: 14px;
            font-weight: 700;
            color: var(--text-heading);
        }

        .method-card-desc {
            font-size: 12px;
            color: var(--text-muted);
            margin-top: 2px;
        }

        /* Buttons & Footer */
        .installer-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 28px;
            padding-top: 20px;
            border-top: 1px solid var(--border);
        }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 11px 22px;
            font-size: 14px;
            font-weight: 600;
            border-radius: 10px;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.2s;
            border: 1px solid transparent;
        }

        .btn-primary {
            background: var(--primary);
            color: #fff;
        }

        .btn-primary:hover {
            background: var(--primary-hover);
            transform: translateY(-1px);
        }

        .btn-secondary {
            background: #fff;
            color: var(--text-heading);
            border-color: var(--border);
        }

        .btn-secondary:hover {
            background: #f8fafc;
        }

        .btn-success {
            background: var(--success);
            color: #fff;
        }

        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none !important;
        }

        /* Alert notifications */
        .alert {
            padding: 14px 18px;
            border-radius: 10px;
            font-size: 13px;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 20px;
        }

        .alert-danger {
            background: #fef2f2;
            color: #991b1b;
            border: 1px solid #fee2e2;
        }

        .alert-success {
            background: #ecfdf5;
            color: #065f46;
            border: 1px solid #d1fae5;
        }

        .alert-info {
            background: #f0f9ff;
            color: #075985;
            border: 1px solid #e0f2fe;
        }

        /* Progress spinner */
        .spinner {
            width: 18px;
            height: 18px;
            border: 2px solid rgba(255, 255, 255, 0.4);
            border-top-color: #fff;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
            .installer-header, .steps-nav, .installer-body {
                padding-left: 20px;
                padding-right: 20px;
            }
            .form-grid, .payment-method-selector {
                grid-template-columns: 1fr;
            }
            .col-span-2 {
                grid-column: span 1;
            }
            .pricing-hero {
                flex-direction: column;
                align-items: flex-start;
                gap: 12px;
            }
        }
    </style>
</head>
<body>

<div class="installer-container">
    <!-- Header -->
    <div class="installer-header">
        <div class="logo-box">
            <div class="logo-icon"><i class="ri-shopping-bag-3-fill"></i></div>
            <div class="logo-title">NestifyTech</div>
        </div>
        <p class="installer-subtitle">Web Installation & License Activation Wizard</p>
    </div>

    <!-- Steps Navigation -->
    <div class="steps-nav">
        <div class="step-item {{ $step == 1 ? 'active' : ($step > 1 ? 'completed' : '') }}">
            <span class="step-badge">{!! $step > 1 ? '<i class="ri-check-line"></i>' : '1' !!}</span>
            <span>1. Requirements</span>
        </div>
        <div class="step-item {{ $step == 2 ? 'active' : ($step > 2 ? 'completed' : '') }}">
            <span class="step-badge">{!! $step > 2 || $isLicensed ? '<i class="ri-check-line"></i>' : '2' !!}</span>
            <span>2. Activation & Payment</span>
        </div>
        <div class="step-item {{ $step == 3 ? 'active' : ($step > 3 ? 'completed' : '') }}">
            <span class="step-badge">{!! $step > 3 || $isDbConnected ? '<i class="ri-check-line"></i>' : '3' !!}</span>
            <span>3. Database</span>
        </div>
        <div class="step-item {{ $step == 4 ? 'active' : ($step > 4 ? 'completed' : '') }}">
            <span class="step-badge">{!! $step > 4 || $isDbImported ? '<i class="ri-check-line"></i>' : '4' !!}</span>
            <span>4. Import Data</span>
        </div>
        <div class="step-item {{ $step == 5 ? 'active' : '' }}">
            <span class="step-badge">5</span>
            <span>5. Administrator</span>
        </div>
    </div>

    <!-- Body Content -->
    <div class="installer-body">
        @if(session('error'))
            <div class="alert alert-danger" style="margin-bottom: 20px;">
                <i class="ri-error-warning-fill" style="font-size: 20px;"></i>
                <div>
                    <strong>Action Blocked:</strong> {{ session('error') }}
                </div>
            </div>
        @endif

        <div id="alertBox" style="display: none;" class="alert"></div>

        <!-- ========================================== -->
        <!-- STEP 1: SERVER REQUIREMENTS & PERMISSIONS  -->
        <!-- ========================================== -->
        @if($step == 1)
            <div class="step-section-title"><i class="ri-server-line"></i> System Check & Permissions</div>
            <p class="step-section-desc">Ensure your server environment satisfies all the required PHP extensions and directory permissions before proceeding.</p>

            <table class="checklist-table">
                <thead>
                    <tr>
                        <th>Requirement / Extension</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($requirements['items'] as $label => $req)
                    <tr>
                        <td><strong>{{ $label }}</strong></td>
                        <td>
                            @if($req['pass'])
                                <span class="badge-status badge-success"><i class="ri-checkbox-circle-fill"></i> Passed ({{ $req['current'] }})</span>
                            @else
                                <span class="badge-status badge-danger"><i class="ri-close-circle-fill"></i> Failed ({{ $req['current'] }})</span>
                            @endif
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>

            <div class="step-section-title" style="margin-top: 24px;"><i class="ri-folder-shield-2-line"></i> Directory Permissions</div>
            <table class="checklist-table">
                <thead>
                    <tr>
                        <th>Directory Path</th>
                        <th>Permission</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($permissions['items'] as $label => $perm)
                    <tr>
                        <td><code>{{ $label }}</code></td>
                        <td>
                            @if($perm['writable'])
                                <span class="badge-status badge-success"><i class="ri-checkbox-circle-fill"></i> Writable</span>
                            @else
                                <span class="badge-status badge-danger"><i class="ri-close-circle-fill"></i> Not Writable</span>
                            @endif
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>

            <div class="installer-footer">
                <div></div>
                @if($canProceedRequirements)
                    <a href="{{ route('install.index', ['step' => 2]) }}" class="btn btn-primary">
                        Next: License & Payment <i class="ri-arrow-right-line"></i>
                    </a>
                @else
                    <button disabled class="btn btn-primary" title="Please fix failing requirements to continue">
                        Requirements Not Met <i class="ri-alert-line"></i>
                    </button>
                @endif
            </div>
        @endif

        <!-- ========================================== -->
        <!-- STEP 2: LICENSE PAYMENT & ACTIVATION       -->
        <!-- ========================================== -->
        @if($step == 2)
            <div class="step-section-title"><i class="ri-shield-keyhole-line"></i> Project License & Payment</div>
            <p class="step-section-desc">This project requires an active license to install and run. Pricing and payment methods are managed securely via our central licensing API.</p>

            @if($isLicensed)
                <div class="alert alert-success">
                    <i class="ri-checkbox-circle-fill" style="font-size: 20px;"></i>
                    <div>
                        <strong>License Active & Verified!</strong>
                        <p style="margin-top: 4px;">License Key: <code>{{ $licenseData['license_key'] ?? 'ACTIVE' }}</code></p>
                        <p style="font-size: 12px; margin-top: 2px;">Transaction: {{ $licenseData['transaction_id'] ?? 'N/A' }}</p>
                    </div>
                </div>

                <div class="installer-footer">
                    <a href="{{ route('install.index', ['step' => 1]) }}" class="btn btn-secondary"><i class="ri-arrow-left-line"></i> Back</a>
                    <a href="{{ route('install.index', ['step' => 3]) }}" class="btn btn-primary">
                        Next: Database Setup <i class="ri-arrow-right-line"></i>
                    </a>
                </div>
            @else
                <!-- Project License Verification Notice -->
                <div class="pricing-hero">
                    <div>
                        <span class="pricing-badge" id="productBadge"><i class="ri-shield-check-fill"></i> Verified Project Activation</span>
                        <h3 style="font-size: 18px; font-weight: 700;" id="productTitle">NestifyTech E-Commerce Platform</h3>
                        <p style="font-size: 13px; opacity: 0.85; margin-top: 4px;">
                            Enter the official license key you received after purchasing the project to activate and unlock your installation.
                        </p>
                    </div>
                </div>

                <!-- Activation Form -->
                <form id="licensePaymentForm">
                    <input type="hidden" name="selected_method" id="selected_method" value="license_key">

                    <!-- Installation Domain Field -->
                    <div class="form-group">
                        <label class="form-label">Installation Domain / Hostname</label>
                        <input type="text" name="domain" id="domain" class="form-control" value="{{ request()->getHost() }}" readonly style="background-color: var(--card-bg); font-family: monospace; font-weight: 600;">
                        <span class="form-help">Your license key will be permanently registered and bound to this domain.</span>
                    </div>

                    <!-- License Key Field -->
                    <div class="form-group" style="margin-top: 15px;">
                        <label class="form-label" style="font-weight: 700; color: var(--primary); font-size: 14px;">
                            <i class="ri-key-2-line"></i> License Activation Code
                        </label>
                        <input type="text" name="license_key" id="license_key" class="form-control" placeholder="NESTIFY-XXXX-XXXX-XXXX-PRO" required style="font-family: monospace; font-size: 16px; letter-spacing: 1px; text-transform: uppercase; font-weight: 700; border-color: var(--primary);">
                        <span class="form-help">Paste your 16-character license key issued upon project purchase.</span>
                    </div>

                    <div class="installer-footer" style="margin-top: 25px;">
                        <a href="{{ route('install.index', ['step' => 1]) }}" class="btn btn-secondary">
                            <i class="ri-arrow-left-line"></i> Back
                        </a>
                        <button type="button" id="btnPayLicense" class="btn btn-primary">
                            <i class="ri-shield-keyhole-line"></i> Verify License & Continue
                        </button>
                    </div>
                </form>
            @endif
        @endif

        <!-- ========================================== -->
        <!-- STEP 3: DATABASE CONFIGURATION             -->
        <!-- ========================================== -->
        @if($step == 3)
            <div class="step-section-title"><i class="ri-database-2-line"></i> Database Connection</div>
            <p class="step-section-desc">Enter your MySQL database credentials. The installer will test the connection and save it to your <code>.env</code> file.</p>

            <form id="dbForm">
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Database Host</label>
                        <input type="text" name="db_host" id="db_host" value="{{ $dbConfig['host'] }}" class="form-control" required placeholder="127.0.0.1">
                        <span class="form-help">Usually <code>127.0.0.1</code> or <code>localhost</code></span>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Port</label>
                        <input type="number" name="db_port" id="db_port" value="{{ $dbConfig['port'] }}" class="form-control" required placeholder="3306">
                    </div>

                    <div class="form-group col-span-2">
                        <label class="form-label">Database Name</label>
                        <input type="text" name="db_database" id="db_database" value="{{ $dbConfig['database'] }}" class="form-control" required placeholder="nestifytech">
                        <span class="form-help">If the database does not exist, the installer will attempt to create it.</span>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Username</label>
                        <input type="text" name="db_username" id="db_username" value="{{ $dbConfig['username'] }}" class="form-control" required placeholder="root">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <input type="password" name="db_password" id="db_password" value="{{ $dbConfig['password'] }}" class="form-control" placeholder="Leave blank if none">
                    </div>
                </div>

                <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                    <button type="button" id="btnTestDb" class="btn btn-secondary">
                        <i class="ri-wifi-line"></i> Test Connection
                    </button>
                </div>

                <div class="installer-footer">
                    <a href="{{ route('install.index', ['step' => 2]) }}" class="btn btn-secondary">
                        <i class="ri-arrow-left-line"></i> Back
                    </a>
                    <button type="button" id="btnSaveDb" class="btn btn-primary">
                        Save & Continue <i class="ri-arrow-right-line"></i>
                    </button>
                </div>
            </form>
        @endif

        <!-- ========================================== -->
        <!-- STEP 4: IMPORT DEFAULT DATA (SQL DUMP)     -->
        <!-- ========================================== -->
        @if($step == 4)
            <div class="step-section-title"><i class="ri-file-download-line"></i> Default Data Import</div>
            <p class="step-section-desc">We will import all base tables, taxonomies, catalog settings, and demo structures from <code>storage/app/import/nestifytech.sql</code>.</p>

            @if($sqlExists)
                <div class="alert alert-info">
                    <i class="ri-information-line" style="font-size: 20px;"></i>
                    <div>
                        <strong>Default SQL dump is ready!</strong>
                        <p style="margin-top: 4px;">Click the button below to populate the database tables and starter data. This may take a few moments.</p>
                    </div>
                </div>

                <div id="importProgressBox" style="display: none; margin: 24px 0; text-align: center;">
                    <div class="spinner" style="width: 32px; height: 32px; border-width: 3px; border-color: var(--primary); border-top-color: transparent; margin: 0 auto 12px;"></div>
                    <h4 style="font-size: 15px; font-weight: 700;">Importing Database Tables & Data...</h4>
                    <p style="color: var(--text-muted); font-size: 13px; margin-top: 4px;">Please do not refresh or close this page.</p>
                </div>

                <div class="installer-footer">
                    <a href="{{ route('install.index', ['step' => 3]) }}" class="btn btn-secondary">
                        <i class="ri-arrow-left-line"></i> Back
                    </a>
                    <button type="button" id="btnStartImport" class="btn btn-primary">
                        <i class="ri-play-circle-line"></i> Start Database Import
                    </button>
                </div>
            @else
                <div class="alert alert-danger">
                    <i class="ri-error-warning-line" style="font-size: 20px;"></i>
                    <div>
                        <strong>Missing SQL file!</strong>
                        <p>File <code>storage/app/import/nestifytech.sql</code> was not found. Please place the file in the directory to proceed.</p>
                    </div>
                </div>
                <div class="installer-footer">
                    <a href="{{ route('install.index', ['step' => 3]) }}" class="btn btn-secondary"><i class="ri-arrow-left-line"></i> Back</a>
                </div>
            @endif
        @endif

        <!-- ========================================== -->
        <!-- STEP 5: ADMINISTRATOR SETUP & FINALIZE     -->
        <!-- ========================================== -->
        @if($step == 5)
            <div class="step-section-title"><i class="ri-user-star-line"></i> Super Administrator Account</div>
            <p class="step-section-desc">Create your primary administrator account. This user will have full access to the admin dashboard, modules, and store settings.</p>

            <form id="adminForm">
                <div class="form-grid">
                    <div class="form-group col-span-2">
                        <label class="form-label">Store / Site Name</label>
                        <input type="text" name="site_name" id="site_name" value="{{ $currentSettings['site']['name']['value'] ?? 'NestifyTech' }}" class="form-control" required placeholder="e.g. NestifyTech">
                    </div>

                    <div class="form-group col-span-2">
                        <label class="form-label">Site Tagline</label>
                        <input type="text" name="site_tagline" id="site_tagline" value="{{ $currentSettings['site']['tagline']['value'] ?? 'Shop the World' }}" class="form-control" placeholder="e.g. Shop the World">
                    </div>

                    <div class="form-group col-span-2">
                        <label class="form-label">Admin Full Name</label>
                        <input type="text" name="admin_name" id="admin_name" class="form-control" required placeholder="e.g. John Doe">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Admin Email</label>
                        <input type="email" name="admin_email" id="admin_email" class="form-control" required placeholder="admin@example.com">
                        <span class="form-help">Used for login and administrative alerts</span>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Admin Password</label>
                        <input type="password" name="admin_password" id="admin_password" class="form-control" required minlength="6" placeholder="••••••••">
                        <span class="form-help">Minimum 6 characters</span>
                    </div>
                </div>

                <div class="installer-footer">
                    <a href="{{ route('install.index', ['step' => 4]) }}" class="btn btn-secondary">
                        <i class="ri-arrow-left-line"></i> Back
                    </a>
                    <button type="button" id="btnSaveAdminAndFinalize" class="btn btn-success">
                        <i class="ri-checkbox-circle-line"></i> Complete Installation
                    </button>
                </div>
            </form>
        @endif
    </div>
</div>

<script>
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

    function showAlert(type, message) {
        const box = document.getElementById('alertBox');
        box.className = 'alert alert-' + type;
        box.innerHTML = `<i class="ri-${type === 'danger' ? 'close-circle-line' : (type === 'success' ? 'checkbox-circle-line' : 'information-line')}" style="font-size: 18px;"></i> <div>${message}</div>`;
        box.style.display = 'flex';
        box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function hideAlert() {
        const box = document.getElementById('alertBox');
        if (box) box.style.display = 'none';
    }

    // Store live methods configuration from portfolio
    let availableMethodsConfig = [];

    function selectPaymentMethod(method, elem) {
        document.getElementById('selected_method').value = method;
        document.querySelectorAll('.method-card').forEach(c => c.classList.remove('selected'));
        if (elem) {
            elem.classList.add('selected');
        }

        // Hide all fields
        const cardFields = document.getElementById('method_card_fields');
        const paypalFields = document.getElementById('method_paypal_fields');
        const bankFields = document.getElementById('method_bank_transfer_fields');
        const licenseKeyFields = document.getElementById('method_license_key_fields');

        if (cardFields) cardFields.style.display = 'none';
        if (paypalFields) paypalFields.style.display = 'none';
        if (bankFields) bankFields.style.display = 'none';
        if (licenseKeyFields) licenseKeyFields.style.display = 'none';

        // Update button text accordingly
        const btnPay = document.getElementById('btnPayLicense');

        // Show matching fields
        if (method === 'card' || method === 'stripe') {
            if (cardFields) cardFields.style.display = 'grid';
            if (btnPay) btnPay.innerHTML = '<i class="ri-lock-2-line"></i> Pay & Activate License';
        } else if (method === 'paypal') {
            if (paypalFields) paypalFields.style.display = 'block';
            if (btnPay) btnPay.innerHTML = '<i class="ri-paypal-line"></i> Pay via PayPal & Activate';
        } else if (method === 'bank_transfer') {
            if (bankFields) {
                bankFields.style.display = 'block';
                const methodObj = availableMethodsConfig.find(m => m.id === 'bank_transfer');
                const notice = document.getElementById('bankDetailsNotice');
                if (notice && methodObj && methodObj.extraConfig) {
                    notice.style.display = 'block';
                    notice.innerHTML = '<strong>Bank Details:</strong><br>' +
                        (methodObj.extraConfig.bankName ? 'Bank: ' + methodObj.extraConfig.bankName + '<br>' : '') +
                        (methodObj.extraConfig.accountTitle ? 'Title: ' + methodObj.extraConfig.accountTitle + '<br>' : '') +
                        (methodObj.extraConfig.accountNumber ? 'IBAN/Account: <code>' + methodObj.extraConfig.accountNumber + '</code>' : '');
                }
            }
            if (btnPay) btnPay.innerHTML = '<i class="ri-check-line"></i> Submit Bank Reference & Activate';
        } else if (method === 'license_key') {
            if (licenseKeyFields) licenseKeyFields.style.display = 'block';
            if (btnPay) btnPay.innerHTML = '<i class="ri-check-double-line"></i> Confirm & Activate Project';
        }
    }

    // STEP 2: Verify License Key
    const btnPayLicense = document.getElementById('btnPayLicense');
    if (btnPayLicense) {
        btnPayLicense.addEventListener('click', async () => {
            hideAlert();
            const enteredKey = document.getElementById('license_key')?.value.trim();

            if (!enteredKey) {
                showAlert('danger', 'Please enter your license key (e.g. NESTIFY-XXXX-XXXX-XXXX-PRO).');
                return;
            }

            const payload = {
                method: 'license_key',
                project_id: 'proj-1', // NestifyTech E-Commerce Platform ID
                license_key: enteredKey,
                domain: document.getElementById('domain')?.value || window.location.hostname,
            };

            btnPayLicense.disabled = true;
            btnPayLicense.innerHTML = '<span class="spinner"></span> Verifying License with Central Server...';

            try {
                const res = await fetch("{{ route('install.license.pay') }}", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();

                if (data.success) {
                    showAlert('success', 'License Verified Successfully! Redirecting to database setup...');
                    setTimeout(() => {
                        window.location.href = "{{ route('install.index', ['step' => 3]) }}";
                    }, 1000);
                } else {
                    showAlert('danger', data.message || 'License verification failed.');
                    btnPayLicense.disabled = false;
                    btnPayLicense.innerHTML = '<i class="ri-shield-keyhole-line"></i> Verify License & Continue';
                }
            } catch (err) {
                showAlert('danger', 'Could not connect to central licensing server. Please check internet connection.');
                btnPayLicense.disabled = false;
                btnPayLicense.innerHTML = '<i class="ri-shield-keyhole-line"></i> Verify License & Continue';
            }
        });
    }

    // STEP 3: Database Setup
    const btnTestDb = document.getElementById('btnTestDb');
    if (btnTestDb) {
        btnTestDb.addEventListener('click', async () => {
            hideAlert();
            btnTestDb.disabled = true;
            btnTestDb.innerHTML = '<span class="spinner"></span> Testing Connection...';

            const payload = {
                db_host: document.getElementById('db_host').value,
                db_port: document.getElementById('db_port').value,
                db_database: document.getElementById('db_database').value,
                db_username: document.getElementById('db_username').value,
                db_password: document.getElementById('db_password').value,
            };

            try {
                const res = await fetch("{{ route('install.db.test') }}", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.success) {
                    showAlert('success', data.message);
                } else {
                    showAlert('danger', data.message);
                }
            } catch (err) {
                showAlert('danger', 'Network or server error during test.');
            } finally {
                btnTestDb.disabled = false;
                btnTestDb.innerHTML = '<i class="ri-wifi-line"></i> Test Connection';
            }
        });
    }

    const btnSaveDb = document.getElementById('btnSaveDb');
    if (btnSaveDb) {
        btnSaveDb.addEventListener('click', async () => {
            hideAlert();
            btnSaveDb.disabled = true;
            btnSaveDb.innerHTML = '<span class="spinner"></span> Saving Database...';

            const payload = {
                db_host: document.getElementById('db_host').value,
                db_port: document.getElementById('db_port').value,
                db_database: document.getElementById('db_database').value,
                db_username: document.getElementById('db_username').value,
                db_password: document.getElementById('db_password').value,
            };

            try {
                const res = await fetch("{{ route('install.db.save') }}", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.success) {
                    window.location.href = "{{ route('install.index', ['step' => 4]) }}";
                } else {
                    showAlert('danger', data.message);
                    btnSaveDb.disabled = false;
                    btnSaveDb.innerHTML = 'Save & Continue <i class="ri-arrow-right-line"></i>';
                }
            } catch (err) {
                showAlert('danger', 'Error saving database credentials.');
                btnSaveDb.disabled = false;
                btnSaveDb.innerHTML = 'Save & Continue <i class="ri-arrow-right-line"></i>';
            }
        });
    }

    // STEP 4: Database Import
    const btnStartImport = document.getElementById('btnStartImport');
    if (btnStartImport) {
        btnStartImport.addEventListener('click', async () => {
            hideAlert();
            btnStartImport.disabled = true;
            btnStartImport.style.display = 'none';
            document.getElementById('importProgressBox').style.display = 'block';

            try {
                const res = await fetch("{{ route('install.db.import') }}", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken }
                });
                const data = await res.json();
                if (data.success) {
                    window.location.href = "{{ route('install.index', ['step' => 5]) }}";
                } else {
                    document.getElementById('importProgressBox').style.display = 'none';
                    btnStartImport.disabled = false;
                    btnStartImport.style.display = 'inline-flex';
                    showAlert('danger', data.message || 'Import failed.');
                }
            } catch (err) {
                document.getElementById('importProgressBox').style.display = 'none';
                btnStartImport.disabled = false;
                btnStartImport.style.display = 'inline-flex';
                showAlert('danger', 'An error occurred during SQL dump import.');
            }
        });
    }

    // STEP 5: Admin Setup & Complete
    const btnSaveAdminAndFinalize = document.getElementById('btnSaveAdminAndFinalize');
    if (btnSaveAdminAndFinalize) {
        btnSaveAdminAndFinalize.addEventListener('click', async () => {
            hideAlert();
            const payload = {
                site_name: document.getElementById('site_name').value.trim(),
                site_tagline: document.getElementById('site_tagline').value.trim(),
                admin_name: document.getElementById('admin_name').value.trim(),
                admin_email: document.getElementById('admin_email').value.trim(),
                admin_password: document.getElementById('admin_password').value,
            };

            if (!payload.admin_name || !payload.admin_email || !payload.admin_password) {
                showAlert('danger', 'Please fill in all required administrator fields.');
                return;
            }

            btnSaveAdminAndFinalize.disabled = true;
            btnSaveAdminAndFinalize.innerHTML = '<span class="spinner"></span> Finalizing Installation...';

            try {
                // First save admin
                const resAdmin = await fetch("{{ route('install.admin.save') }}", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
                    body: JSON.stringify(payload)
                });
                const dataAdmin = await resAdmin.json();

                if (!dataAdmin.success) {
                    showAlert('danger', dataAdmin.message);
                    btnSaveAdminAndFinalize.disabled = false;
                    btnSaveAdminAndFinalize.innerHTML = '<i class="ri-checkbox-circle-line"></i> Complete Installation';
                    return;
                }

                // Finalize install & lock
                const resFin = await fetch("{{ route('install.finalize') }}", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
                    body: JSON.stringify({})
                });
                const dataFin = await resFin.json().catch(() => null);

                if (dataFin && dataFin.success) {
                    showAlert('success', 'Installation Completed! Redirecting to login...');
                    setTimeout(() => {
                        window.location.href = dataFin.redirect_url || '/login';
                    }, 1200);
                } else {
                    const errorMsg = (dataFin && dataFin.message) ? dataFin.message : 'Error finalizing installation.';
                    showAlert('danger', errorMsg);
                    btnSaveAdminAndFinalize.disabled = false;
                    btnSaveAdminAndFinalize.innerHTML = '<i class="ri-checkbox-circle-line"></i> Complete Installation';
                }
            } catch (err) {
                showAlert('danger', 'Error finalizing installation: ' + (err.message || 'Network/Server Error'));
                btnSaveAdminAndFinalize.disabled = false;
                btnSaveAdminAndFinalize.innerHTML = '<i class="ri-checkbox-circle-line"></i> Complete Installation';
            }
        });
    }
</script>

</body>
</html>
