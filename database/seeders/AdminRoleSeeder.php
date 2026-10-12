<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class AdminRoleSeeder extends Seeder
{
    /**
     * Creates an "Administrator" role with ALL permissions and assigns it
     * to the admin user identified by ADMIN_EMAIL env var (default: info@nestifytech.com).
     */
    public function run(): void
    {
        // ── 1. Build the full permission payload ──────────────────────────────
        // Stored as nested JSON: { "dashboard": ["Dashboard-Read"], ... }
        // User model flattens these to lowercase: "dashboard-read", "product-read", etc.
        $permission = [
            // Dashboard
            'dashboard' => [
                'Dashboard-Read',
            ],

            // Content Management
            'content' => [
                'Product-Read',       'Product-Write',       'Product-Delete',
                'Blog-Read',          'Blog-Write',          'Blog-Delete',
                'Blog Category-Read', 'Blog Category-Write', 'Blog Category-Delete',
                'Faq-Read',           'Faq-Write',           'Faq-Delete',
                'Faq Category-Read',  'Faq Category-Write',  'Faq Category-Delete',
                'Page-Read',          'Page-Write',          'Page-Delete',
                'Category-Read',      'Category-Write',      'Category-Delete',
                'Brand-Read',         'Brand-Write',         'Brand-Delete',
                'Tag-Read',           'Tag-Write',           'Tag-Delete',
                'Attributes-Read',    'Attributes-Write',    'Attributes-Delete',
            ],

            // System / Administrative
            'system' => [
                'User-Read',       'User-Write',       'User-Delete',
                'Role-Read',       'Role-Write',       'Role-Delete',
                'Setting-Read',    'Setting-Write',    'Setting-Delete',
                'Transition-Read', 'Transition-Write', 'Transition-Delete',
                'Layout-Read',     'Layout-Write',     'Layout-Delete',
                'Developer-Read',  'Developer-Write',  'Developer-Delete',
                'Ads-Read',        'Ads-Write',        'Ads-Delete',
            ],

            // Sales / Customer Engagement
            'sales' => [
                'Reviews-Read',  'Reviews-Write',  'Reviews-Delete',
                'Review-Read',   'Review-Write',   'Review-Delete',
                'Order-Read',    'Order-Write',    'Order-Delete',
            ],

            // Extra flat permissions referenced in sidebar-menu.json
            'extra' => [
                'Product-Create',
                'Blog-Create',
                'Faq-Create',
                'Page-Create',
                'Attribute-Read',  'Attribute-Write',  'Attribute-Delete',
            ],
        ];

        // ── 2. Upsert the Administrator role ──────────────────────────────────
        $existing = DB::table('roles')->where('title', 'Administrator')->first();

        if ($existing) {
            DB::table('roles')->where('id', $existing->id)->update([
                'status'     => 'publish',
                'permission' => json_encode($permission),
                'updated_at' => Carbon::now(),
            ]);
            $roleId = $existing->id;
            $this->command->info("Updated existing 'Administrator' role (id: {$roleId}).");
        } else {
            $roleId = DB::table('roles')->insertGetId([
                'title'      => 'Administrator',
                'status'     => 'publish',
                'permission' => json_encode($permission),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
            $this->command->info("Created 'Administrator' role (id: {$roleId}).");
        }

        // ── 3. Assign role to the admin user ──────────────────────────────────
        $adminEmail = env('ADMIN_EMAIL', 'info@nestifytech.com');

        $users = DB::table('users')->where('email', $adminEmail)->get();

        foreach ($users as $user) {
            DB::table('users')->where('id', $user->id)->update([
                'roles'      => json_encode([$roleId]),
                'updated_at' => Carbon::now(),
            ]);
            $this->command->info("Assigned 'Administrator' role to user: {$user->email} (id: {$user->id}).");
        }

        if ($users->isEmpty()) {
            $this->command->warn("No user found with email '{$adminEmail}'.");
            $this->command->warn("Role created (id: {$roleId}) but not assigned to any user.");
        }

        $this->command->newLine();
        $this->command->info('Administrator role seeded successfully.');
        $this->command->info("Role ID: {$roleId} | Status: publish | Permissions: ALL");
    }
}
