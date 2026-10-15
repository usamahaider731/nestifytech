<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with complete base data.
     */
    public function run(): void
    {
        // 1. Ensure primary administrator account exists
        $adminUser = User::firstOrCreate(
            ['email' => 'info@nestifytech.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('password'),
                'roles' => json_encode(['1']),
                'active' => 1,
            ]
        );

        // 2. Seed Administrator roles & all administrative permissions
        $this->call(AdminRoleSeeder::class);

        // 3. Import full product catalog, categories, brands, tags
        $this->command->info('Importing catalog (products, categories, brands, tags)...');
        Artisan::call('catalog:import', ['--user' => $adminUser->id]);
        $this->command->line(Artisan::output());

        // 4. Seed dynamic pages (About Us, Privacy Policy, Terms, etc.)
        $this->call(DynamicPagesSeeder::class);

        // 5. Seed blog articles & blog categories
        $this->call(BlogSeeder::class);

        // 6. Ensure default FAQs exist
        $controller = new \App\Http\Controllers\FrontendController();
        $controller->faqs(request());

        $this->command->info('Database seeding completed with complete data.');
    }
}
