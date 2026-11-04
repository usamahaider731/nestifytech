<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class StoreRolesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Update any existing roles default scope to platform
        \Illuminate\Support\Facades\DB::table('roles')
            ->whereNull('scope')
            ->orWhere('scope', '')
            ->update(['scope' => 'platform']);

        // 2. Define Store-Specific Roles
        // NOTE: 'Product-Create' is REQUIRED for editing/creating stock on the Inventory
        //       and IncomingStock pages (routes use permission:product-create middleware).
        $storeRoles = [
            [
                'title' => 'Store Admin',
                'scope' => 'store',
                'status' => 'publish',
                'permission' => json_encode([
                    'dashboard' => ['Dashboard-Read'],
                    'content'   => [
                        'Product-Read', 'Product-Write', 'Product-Create',
                        'Category-Read', 'Brand-Read',
                        'Store-Read', 'Store-Write',
                    ],
                    'sales'     => ['Order-Read', 'Order-Write'],
                    'delivery'  => ['Delivery-Read', 'Delivery-Write'],
                ]),
            ],
            [
                'title' => 'Store Manager',
                'scope' => 'store',
                'status' => 'publish',
                'permission' => json_encode([
                    'dashboard' => ['Dashboard-Read'],
                    'content'   => [
                        'Product-Read', 'Product-Write', 'Product-Create',
                        'Store-Read',
                    ],
                    'sales'     => ['Order-Read', 'Order-Write'],
                    'delivery'  => ['Delivery-Read', 'Delivery-Write'],
                ]),
            ],
            [
                'title' => 'Delivery Boy',
                'scope' => 'store',
                'status' => 'publish',
                'permission' => json_encode([
                    'dashboard' => ['Dashboard-Read'],
                    'sales'     => ['Order-Read'],
                    'delivery'  => ['Delivery-Read', 'Delivery-Write'],
                ]),
            ],
        ];

        foreach ($storeRoles as $role) {
            $existing = \Illuminate\Support\Facades\DB::table('roles')->where('title', $role['title'])->first();
            if ($existing) {
                \Illuminate\Support\Facades\DB::table('roles')->where('id', $existing->id)->update([
                    'scope'      => 'store',
                    'status'     => $existing->status ?: 'publish',
                    'permission' => $role['permission'],   // always refresh permissions
                    'updated_at' => \Illuminate\Support\Carbon::now(),
                ]);
            } else {
                \Illuminate\Support\Facades\DB::table('roles')->insert([
                    'title'      => $role['title'],
                    'scope'      => 'store',
                    'status'     => $role['status'],
                    'permission' => $role['permission'],
                    'created_at' => \Illuminate\Support\Carbon::now(),
                    'updated_at' => \Illuminate\Support\Carbon::now(),
                ]);
            }
        }

        // Also ensure any roles with 'delivery' or 'store' in title are tagged with scope store
        \Illuminate\Support\Facades\DB::table('roles')
            ->where(function ($q) {
                $q->where('title', 'like', '%store%')
                  ->orWhere('title', 'like', '%delivery%')
                  ->orWhere('title', 'like', '%rider%');
            })
            ->update(['scope' => 'store']);
    }
}
