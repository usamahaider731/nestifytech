<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class UserOptionsApiTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => ':memory:',
            'session.driver' => 'array',
            'cache.default' => 'array',
        ]);

        // Set up in-memory tables needed for testing
        Schema::dropIfExists('posts');
        Schema::dropIfExists('post_meta');
        Schema::dropIfExists('taxonomies');
        Schema::dropIfExists('user_meta');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('users');

        Schema::create('users', function ($table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->boolean('active')->default(1);
            $table->text('roles')->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('roles', function ($table) {
            $table->id();
            $table->string('title');
            $table->string('scope')->default('platform');
            $table->text('permission')->nullable();
            $table->timestamps();
        });

        Schema::create('user_meta', function ($table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('key');
            $table->text('value')->nullable();
            $table->timestamps();
        });

        Schema::create('posts', function ($table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->nullable();
            $table->string('sku')->nullable();
            $table->string('type')->default('post');
            $table->string('status')->default('publish');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->timestamps();
        });

        Schema::create('post_meta', function ($table) {
            $table->id();
            $table->unsignedBigInteger('post_id');
            $table->string('key');
            $table->text('value')->nullable();
            $table->timestamps();
        });

        Schema::create('taxonomies', function ($table) {
            $table->id();
            $table->string('title')->nullable();
            $table->string('type')->nullable();
            $table->string('slug')->nullable();
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Helper to create a verified user via trusted attribute assignment
     */
    protected function createVerifiedUser(array $attributes): User
    {
        $emailVerifiedAt = $attributes['email_verified_at'] ?? now();
        unset($attributes['email_verified_at']);

        $user = new User($attributes);
        $user->email_verified_at = $emailVerifiedAt;
        $user->save();

        return $user;
    }

    public function test_guest_cannot_access_user_options(): void
    {
        $response = $this->getJson('/api/user-options');
        $response->assertStatus(401);
    }

    public function test_normal_customer_receives_403_forbidden(): void
    {
        $customer = $this->createVerifiedUser([
            'name'     => 'Regular Customer',
            'email'    => 'customer@example.com',
            'password' => bcrypt('password'),
            'active'   => 1,
            'roles'    => json_encode([]),
        ]);

        $response = $this->actingAs($customer)->getJson('/api/user-options');
        $response->assertStatus(403);
    }

    public function test_global_administrator_can_retrieve_users(): void
    {
        $adminRoleId = DB::table('roles')->insertGetId([
            'title'      => 'Administrator',
            'permission' => json_encode(['all']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $admin = $this->createVerifiedUser([
            'name'     => 'Super Admin',
            'email'    => 'admin@example.com',
            'password' => bcrypt('password'),
            'active'   => 1,
            'roles'    => json_encode([$adminRoleId]),
        ]);

        $this->createVerifiedUser([
            'name'     => 'Alice User',
            'email'    => 'alice@example.com',
            'password' => bcrypt('password'),
            'active'   => 1,
            'roles'    => json_encode([]),
        ]);

        $response = $this->actingAs($admin)->getJson('/api/user-options');
        $response->assertStatus(200);

        $json = $response->json();
        $this->assertIsArray($json);
        $this->assertNotEmpty($json);

        // Sensitive data check
        foreach ($json as $item) {
            $this->assertArrayHasKey('id', $item);
            $this->assertArrayHasKey('title', $item);
            $this->assertArrayNotHasKey('email', $item);
            $this->assertArrayNotHasKey('password', $item);
            $this->assertArrayNotHasKey('remember_token', $item);
        }
    }

    public function test_authorized_staff_can_access_own_store_users(): void
    {
        $staffRoleId = DB::table('roles')->insertGetId([
            'title'      => 'Store Staff',
            'permission' => json_encode(['user-read']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $staffUser = $this->createVerifiedUser([
            'name'     => 'Authorized Staff',
            'email'    => 'staff@example.com',
            'password' => bcrypt('password'),
            'active'   => 1,
            'roles'    => json_encode([$staffRoleId]),
        ]);

        DB::table('user_meta')->insert([
            'user_id'    => $staffUser->id,
            'key'        => 'store_id',
            'value'      => '10',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // User in Store 10
        $store10User = $this->createVerifiedUser([
            'name'     => 'Store 10 Worker',
            'email'    => 'worker10@example.com',
            'password' => bcrypt('password'),
            'active'   => 1,
            'roles'    => json_encode([]),
        ]);
        DB::table('user_meta')->insert([
            'user_id'    => $store10User->id,
            'key'        => 'store_id',
            'value'      => '10',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($staffUser)->getJson('/api/user-options');
        $response->assertStatus(200);

        $titles = collect($response->json())->pluck('title')->toArray();
        $this->assertContains('Store 10 Worker', $titles);
    }

    public function test_unauthorized_staff_receives_403(): void
    {
        $staffNoPermRole = DB::table('roles')->insertGetId([
            'title'      => 'Junior Staff',
            'permission' => json_encode(['dashboard-read']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $staffUser = $this->createVerifiedUser([
            'name'     => 'Junior Staff Worker',
            'email'    => 'junior@example.com',
            'password' => bcrypt('password'),
            'active'   => 1,
            'roles'    => json_encode([$staffNoPermRole]),
        ]);

        $response = $this->actingAs($staffUser)->getJson('/api/user-options');
        $response->assertStatus(403);
    }

    public function test_request_store_id_tampering_is_ignored(): void
    {
        $storeAdminRoleId = DB::table('roles')->insertGetId([
            'title'      => 'Store Admin',
            'permission' => json_encode(['store-read', 'store-write', 'user-read']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $storeAdmin = $this->createVerifiedUser([
            'name'     => 'Store Manager 1',
            'email'    => 'mgr1@example.com',
            'password' => bcrypt('password'),
            'active'   => 1,
            'roles'    => json_encode([$storeAdminRoleId]),
        ]);

        DB::table('user_meta')->insert([
            'user_id'    => $storeAdmin->id,
            'key'        => 'store_id',
            'value'      => '10',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Worker in Store 20
        $store20User = $this->createVerifiedUser([
            'name'     => 'Store 20 Secret Worker',
            'email'    => 'worker20@example.com',
            'password' => bcrypt('password'),
            'active'   => 1,
            'roles'    => json_encode([]),
        ]);
        DB::table('user_meta')->insert([
            'user_id'    => $store20User->id,
            'key'        => 'store_id',
            'value'      => '20',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Attempt to pass store_id=20 in the request
        $response = $this->actingAs($storeAdmin)->getJson('/api/user-options?store_id=20');
        $response->assertStatus(200);

        $titles = collect($response->json())->pluck('title')->toArray();
        $this->assertNotContains('Store 20 Secret Worker', $titles);
    }

    public function test_inactive_users_are_excluded(): void
    {
        $adminRoleId = DB::table('roles')->insertGetId([
            'title'      => 'Administrator',
            'permission' => json_encode(['all']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $admin = $this->createVerifiedUser([
            'name'     => 'Admin User',
            'email'    => 'admin2@example.com',
            'password' => bcrypt('password'),
            'active'   => 1,
            'roles'    => json_encode([$adminRoleId]),
        ]);

        $this->createVerifiedUser([
            'name'     => 'Inactive Bob',
            'email'    => 'bob.inactive@example.com',
            'password' => bcrypt('password'),
            'active'   => 0,
            'roles'    => json_encode([]),
        ]);

        $response = $this->actingAs($admin)->getJson('/api/user-options?search=Inactive');
        $response->assertStatus(200);

        $titles = collect($response->json())->pluck('title')->toArray();
        $this->assertNotContains('Inactive Bob', $titles);
    }

    public function test_pagination_and_invalid_role_filter(): void
    {
        $adminRoleId = DB::table('roles')->insertGetId([
            'title'      => 'Administrator',
            'permission' => json_encode(['all']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $admin = $this->createVerifiedUser([
            'name'     => 'Master Admin',
            'email'    => 'm.admin@example.com',
            'password' => bcrypt('password'),
            'active'   => 1,
            'roles'    => json_encode([$adminRoleId]),
        ]);

        // Request with non-existent role returns empty list safely
        $response = $this->actingAs($admin)->getJson('/api/user-options?role=non_existent_role_xyz');
        $response->assertStatus(200);
        $this->assertEmpty($response->json());

        // Bounded per_page check: exceeding 100 should be rejected by validation (422)
        $pResponse = $this->actingAs($admin)->getJson('/api/user-options?page=1&per_page=500');
        $pResponse->assertStatus(422);

        // Valid per_page
        $pValid = $this->actingAs($admin)->getJson('/api/user-options?page=1&per_page=50');
        $pValid->assertStatus(200);
        $this->assertSame(50, $pValid->json('per_page'));
    }

    public function test_store_creation_authorization(): void
    {
        $storeStaffRoleId = DB::table('roles')->insertGetId([
            'title'      => 'Store Staff',
            'permission' => json_encode(['store-read']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $storeStaff = $this->createVerifiedUser([
            'name'     => 'Store Staff User',
            'email'    => 'storestaff@example.com',
            'password' => bcrypt('password'),
            'active'   => 1,
            'roles'    => json_encode([$storeStaffRoleId]),
        ]);

        // Non-admin without store-write attempting to create a new store directly
        $response = $this->actingAs($storeStaff)->postJson('/admin/module/store/submit', [
            'title'       => 'Unauthorized Store Branch',
            'description' => 'Test branch',
        ]);

        $response->assertStatus(403);
    }

    public function test_inactive_and_nonexistent_manager_assignment_is_rejected(): void
    {
        $adminRoleId = DB::table('roles')->insertGetId([
            'title'      => 'Administrator',
            'permission' => json_encode(['all']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $admin = $this->createVerifiedUser([
            'name'              => 'Admin User',
            'email'             => 'admin_mgr@example.com',
            
            'password'          => bcrypt('password'),
            'active'            => 1,
            'roles'             => json_encode([$adminRoleId]),
        ]);

        $inactiveUser = $this->createVerifiedUser([
            'name'              => 'Inactive Candidate',
            'email'             => 'inactive_cand@example.com',
            
            'password'          => bcrypt('password'),
            'active'            => 0,
            'roles'             => json_encode([]),
        ]);

        // 1. Inactive user assignment rejected with 422
        $responseInactive = $this->actingAs($admin)->postJson('/admin/module/store/submit', [
            'title'      => 'Flagship Store',
            'manager_id' => $inactiveUser->id,
        ]);
        $responseInactive->assertStatus(422);

        // 2. Nonexistent user assignment rejected with 422
        $responseNonexistent = $this->actingAs($admin)->postJson('/admin/module/store/submit', [
            'title'      => 'Flagship Store Nonexistent',
            'manager_id' => 999999,
        ]);
        $responseNonexistent->assertStatus(422);
    }

    public function test_cross_store_manager_assignment_protection(): void
    {
        $storeAdminRoleId = DB::table('roles')->insertGetId([
            'title'      => 'Store Admin',
            'permission' => json_encode(['store-read', 'store-write']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $store1 = DB::table('posts')->insertGetId([
            'title'      => 'Store 1',
            'type'       => 'store',
            'status'     => 'publish',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $store2 = DB::table('posts')->insertGetId([
            'title'      => 'Store 2',
            'type'       => 'store',
            'status'     => 'publish',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $storeAdmin1 = $this->createVerifiedUser([
            'name'     => 'Store 1 Admin',
            'email'    => 'st1admin@example.com',
            'password' => bcrypt('password'),
            'active'   => 1,
            'roles'    => json_encode([$storeAdminRoleId]),
        ]);

        DB::table('user_meta')->insert([
            'user_id'    => $storeAdmin1->id,
            'key'        => 'store_id',
            'value'      => (string) $store1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // User already assigned to Store 2 with a valid store role
        $storeManagerRoleId = DB::table('roles')->insertGetId([
            'title'      => 'Store Manager',
            'scope'      => 'store',
            'permission' => json_encode(['Store-Read']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $store2User = $this->createVerifiedUser([
            'name'     => 'Store 2 User',
            'email'    => 'st2user@example.com',
            'password' => bcrypt('password'),
            'active'   => 1,
            'roles'    => json_encode([$storeManagerRoleId]),
        ]);
        DB::table('user_meta')->insert([
            'user_id'    => $store2User->id,
            'key'        => 'store_id',
            'value'      => (string) $store2,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Store 1 Admin attempting to assign Store 2's worker to Store 1
        $response = $this->actingAs($storeAdmin1)->postJson("/admin/module/store/submit/{$store1}", [
            'title'      => 'Store 1 Updated',
            'manager_id' => $store2User->id,
        ]);

        $response->assertStatus(403);
    }

    public function test_global_administrator_can_transfer_manager_across_stores(): void
    {
        $adminRoleId = DB::table('roles')->insertGetId([
            'title'      => 'Administrator',
            'permission' => json_encode(['all']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $admin = $this->createVerifiedUser([
            'name'              => 'Admin Transfer',
            'email'             => 'admin_transfer@example.com',
            
            'password'          => bcrypt('password'),
            'active'            => 1,
            'roles'             => json_encode([$adminRoleId]),
        ]);

        $storeA = DB::table('posts')->insertGetId([
            'title'      => 'Store Alpha',
            'type'       => 'store',
            'status'     => 'publish',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $storeB = DB::table('posts')->insertGetId([
            'title'      => 'Store Beta',
            'type'       => 'store',
            'status'     => 'publish',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $managerRoleId = DB::table('roles')->insertGetId([
            'title'      => 'Store Manager',
            'scope'      => 'store',
            'permission' => json_encode(['Store-Read']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $movableManager = $this->createVerifiedUser([
            'name'              => 'Versatile Manager',
            'email'             => 'versatile@example.com',
            
            'password'          => bcrypt('password'),
            'active'            => 1,
            'roles'             => json_encode([$managerRoleId]),
        ]);

        // User initially assigned to Store Alpha
        DB::table('user_meta')->insert([
            'user_id'    => $movableManager->id,
            'key'        => 'store_id',
            'value'      => (string) $storeA,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('user_meta')->insert([
            'user_id'    => $movableManager->id,
            'key'        => 'assigned_store',
            'value'      => (string) $storeA,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Global admin transfers Versatile Manager to Store Beta
        $response = $this->actingAs($admin)->postJson("/admin/module/store/submit/{$storeB}", [
            'title'      => 'Store Beta Updated',
            'manager_id' => $movableManager->id,
        ]);
        $response->assertStatus(200);

        // Metadata must now reflect Store Beta
        $this->assertEquals((string)$storeB, DB::table('user_meta')->where('user_id', $movableManager->id)->where('key', 'store_id')->value('value'));
        $this->assertEquals((string)$storeB, DB::table('user_meta')->where('user_id', $movableManager->id)->where('key', 'assigned_store')->value('value'));
    }

    public function test_manager_assignment_lifecycle_and_removal(): void
    {
        $adminRoleId = DB::table('roles')->insertGetId([
            'title'      => 'Administrator',
            'permission' => json_encode(['all']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $managerRoleId = DB::table('roles')->insertGetId([
            'title'      => 'Store Manager',
            'scope'      => 'store',
            'permission' => json_encode(['Store-Read']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $admin = $this->createVerifiedUser([
            'name'              => 'Admin User',
            'email'             => 'admin_atomic@example.com',
            
            'password'          => bcrypt('password'),
            'active'            => 1,
            'roles'             => json_encode([$adminRoleId]),
        ]);

        $userA = $this->createVerifiedUser([
            'name'              => 'Manager Candidate A',
            'email'             => 'cand_a@example.com',
            
            'password'          => bcrypt('password'),
            'active'            => 1,
            'roles'             => json_encode([$managerRoleId]),
        ]);

        $userB = $this->createVerifiedUser([
            'name'              => 'Manager Candidate B',
            'email'             => 'cand_b@example.com',
            
            'password'          => bcrypt('password'),
            'active'            => 1,
            'roles'             => json_encode([$managerRoleId]),
        ]);

        // 1. Create Store with unassigned active User A
        $response1 = $this->actingAs($admin)->postJson('/admin/module/store/submit', [
            'title'      => 'Downtown Store',
            'manager_id' => $userA->id,
        ]);
        $response1->assertStatus(200);

        $storeId = DB::table('posts')->where('type', 'store')->where('title', 'Downtown Store')->value('id');
        $this->assertNotNull($storeId);

        // Verify User A has store_id and assigned_store
        $this->assertEquals((string)$storeId, DB::table('user_meta')->where('user_id', $userA->id)->where('key', 'store_id')->value('value'));
        $this->assertEquals((string)$storeId, DB::table('user_meta')->where('user_id', $userA->id)->where('key', 'assigned_store')->value('value'));

        // 2. Reassigning the SAME manager keeps metadata intact
        $responseSame = $this->actingAs($admin)->postJson("/admin/module/store/submit/{$storeId}", [
            'title'      => 'Downtown Store',
            'manager_id' => $userA->id,
        ]);
        $responseSame->assertStatus(200);
        $this->assertEquals((string)$storeId, DB::table('user_meta')->where('user_id', $userA->id)->where('key', 'store_id')->value('value'));

        // 3. Replace Manager with User B
        $response2 = $this->actingAs($admin)->postJson("/admin/module/store/submit/{$storeId}", [
            'title'      => 'Downtown Store',
            'manager_id' => $userB->id,
        ]);
        $response2->assertStatus(200);

        // User A's store assignment must be removed
        $this->assertNull(DB::table('user_meta')->where('user_id', $userA->id)->where('key', 'store_id')->value('value'));
        $this->assertNull(DB::table('user_meta')->where('user_id', $userA->id)->where('key', 'assigned_store')->value('value'));

        // User B must now have the store assignment
        $this->assertEquals((string)$storeId, DB::table('user_meta')->where('user_id', $userB->id)->where('key', 'store_id')->value('value'));
        $this->assertEquals((string)$storeId, DB::table('user_meta')->where('user_id', $userB->id)->where('key', 'assigned_store')->value('value'));

        // 4. Remove Manager entirely by passing empty string / null
        $responseRemove = $this->actingAs($admin)->postJson("/admin/module/store/submit/{$storeId}", [
            'title'      => 'Downtown Store',
            'manager_id' => '',
        ]);
        $responseRemove->assertStatus(200);

        // User B's store assignment must now be removed
        $this->assertNull(DB::table('user_meta')->where('user_id', $userB->id)->where('key', 'store_id')->value('value'));
        $this->assertNull(DB::table('user_meta')->where('user_id', $userB->id)->where('key', 'assigned_store')->value('value'));
    }

    public function test_customer_cannot_become_store_manager(): void
    {
        $adminRoleId = DB::table('roles')->insertGetId([
            'title'      => 'Administrator',
            'permission' => json_encode(['all']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $admin = $this->createVerifiedUser([
            'name'              => 'Super Admin',
            'email'             => 'admin_elig@example.com',
            
            'password'          => bcrypt('password'),
            'active'            => 1,
            'roles'             => json_encode([$adminRoleId]),
        ]);

        $customer = $this->createVerifiedUser([
            'name'              => 'Plain Customer',
            'email'             => 'customer_elig@example.com',
            
            'password'          => bcrypt('password'),
            'active'            => 1,
            'roles'             => json_encode([]), // No roles
        ]);

        $response = $this->actingAs($admin)->postJson('/admin/module/store/submit', [
            'title'      => 'Customer Run Store',
            'manager_id' => $customer->id,
        ]);

        $response->assertStatus(422);
    }

    public function test_delivery_boy_cannot_become_store_manager(): void
    {
        $adminRoleId = DB::table('roles')->insertGetId([
            'title'      => 'Administrator',
            'permission' => json_encode(['all']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $deliveryRoleId = DB::table('roles')->insertGetId([
            'title'      => 'Delivery Boy',
            'scope'      => 'store',
            'permission' => json_encode(['Order-Read', 'Delivery-Read', 'Delivery-Write']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $admin = $this->createVerifiedUser([
            'name'              => 'Super Admin',
            'email'             => 'admin_deliv@example.com',
            
            'password'          => bcrypt('password'),
            'active'            => 1,
            'roles'             => json_encode([$adminRoleId]),
        ]);

        $deliveryUser = $this->createVerifiedUser([
            'name'              => 'Delivery Worker',
            'email'             => 'delivery@example.com',
            
            'password'          => bcrypt('password'),
            'active'            => 1,
            'roles'             => json_encode([$deliveryRoleId]),
        ]);

        $response = $this->actingAs($admin)->postJson('/admin/module/store/submit', [
            'title'      => 'Delivery Run Store',
            'manager_id' => $deliveryUser->id,
        ]);

        $response->assertStatus(422);
    }

    public function test_store_admin_and_store_manager_are_eligible(): void
    {
        $adminRoleId = DB::table('roles')->insertGetId([
            'title'      => 'Administrator',
            'permission' => json_encode(['all']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $storeAdminRoleId = DB::table('roles')->insertGetId([
            'title'      => 'Store Admin',
            'scope'      => 'store',
            'permission' => json_encode(['Store-Read', 'Store-Write']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $storeManagerRoleId = DB::table('roles')->insertGetId([
            'title'      => 'Store Manager',
            'scope'      => 'store',
            'permission' => json_encode(['Store-Read']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $admin = $this->createVerifiedUser([
            'name'              => 'Super Admin',
            'email'             => 'admin_check@example.com',
            
            'password'          => bcrypt('password'),
            'active'            => 1,
            'roles'             => json_encode([$adminRoleId]),
        ]);

        $storeAdminUser = $this->createVerifiedUser([
            'name'              => 'Store Admin User',
            'email'             => 'store_admin_cand@example.com',
            
            'password'          => bcrypt('password'),
            'active'            => 1,
            'roles'             => json_encode([$storeAdminRoleId]),
        ]);

        $storeManagerUser = $this->createVerifiedUser([
            'name'              => 'Store Manager User',
            'email'             => 'store_mgr_cand@example.com',
            
            'password'          => bcrypt('password'),
            'active'            => 1,
            'roles'             => json_encode([$storeManagerRoleId]),
        ]);

        // Both should be accepted
        $response1 = $this->actingAs($admin)->postJson('/admin/module/store/submit', [
            'title'      => 'Store Managed by Store Admin',
            'manager_id' => $storeAdminUser->id,
        ]);
        $response1->assertStatus(200);

        $response2 = $this->actingAs($admin)->postJson('/admin/module/store/submit', [
            'title'      => 'Store Managed by Store Manager',
            'manager_id' => $storeManagerUser->id,
        ]);
        $response2->assertStatus(200);
    }

    public function test_production_error_does_not_leak_server_paths(): void
    {
        config(['app.debug' => false]);
        putenv('APP_ENV=production');

        $adminRoleId = DB::table('roles')->insertGetId([
            'title'      => 'Administrator',
            'permission' => json_encode(['all']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $admin = $this->createVerifiedUser([
            'name'              => 'Admin Path Test',
            'email'             => 'admin_path@example.com',
            
            'password'          => bcrypt('password'),
            'active'            => 1,
            'roles'             => json_encode([$adminRoleId]),
        ]);

        // Deliberately trigger an exception by creating duplicate on a table or invalid request to handleSubmission
        // If an exception occurs, ensure the response message doesn't contain '.php' or 'on line'
        $response = $this->actingAs($admin)->postJson('/admin/module/store/submit', [
            'title'      => 'Store Triggering Error',
            'manager_id' => 9999999, // non-existent triggers 422 abort
        ]);

        $this->assertStringNotContainsString('.php', $response->getContent());
        $this->assertStringNotContainsString('on line', $response->getContent());
    }
}
