<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class UserStoreAssignmentIsolationTest extends TestCase
{
    protected int $adminRoleId;
    protected int $storeAdminRoleId;
    protected int $storeManagerRoleId;
    protected int $deliveryRoleId;
    protected int $store1Id;
    protected int $store2Id;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => ':memory:',
            'session.driver' => 'array',
            'cache.default' => 'array',
        ]);

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

        // Seed Roles
        $this->adminRoleId = DB::table('roles')->insertGetId([
            'title'      => 'Administrator',
            'scope'      => 'platform',
            'permission' => json_encode(['all']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->storeAdminRoleId = DB::table('roles')->insertGetId([
            'title'      => 'Store Admin',
            'scope'      => 'store',
            'permission' => json_encode(['Store-Read', 'Store-Write', 'User-Read', 'User-Write']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->storeManagerRoleId = DB::table('roles')->insertGetId([
            'title'      => 'Store Manager',
            'scope'      => 'store',
            'permission' => json_encode(['Store-Read', 'User-Read']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->deliveryRoleId = DB::table('roles')->insertGetId([
            'title'      => 'Delivery Boy',
            'scope'      => 'store',
            'permission' => json_encode(['Order-Read']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Seed Stores
        $this->store1Id = DB::table('posts')->insertGetId([
            'title'      => 'North Store',
            'type'       => 'store',
            'sku'        => 'north-store',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->store2Id = DB::table('posts')->insertGetId([
            'title'      => 'South Store',
            'type'       => 'store',
            'sku'        => 'south-store',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    protected function makeUser(array $attrs, ?int $storeId = null): User
    {
        $verifiedAt = $attrs['email_verified_at'] ?? now();
        unset($attrs['email_verified_at']);

        $user = new User($attrs);
        $user->email_verified_at = $verifiedAt;
        $user->save();

        if ($storeId) {
            DB::table('user_meta')->insert([
                ['user_id' => $user->id, 'key' => 'store_id', 'value' => (string) $storeId, 'created_at' => now(), 'updated_at' => now()],
                ['user_id' => $user->id, 'key' => 'assigned_store', 'value' => (string) $storeId, 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        return $user;
    }

    public function test_global_admin_can_assign_eligible_employee_to_another_store(): void
    {
        $admin = $this->makeUser(['name' => 'Admin', 'email' => 'admin@ex.com', 'password' => bcrypt('pass'), 'active' => 1, 'roles' => json_encode([$this->adminRoleId])]);
        $worker = $this->makeUser(['name' => 'Worker', 'email' => 'worker@ex.com', 'password' => bcrypt('pass'), 'active' => 1, 'roles' => json_encode([$this->deliveryRoleId])], $this->store1Id);

        // Global admin moves worker from store 1 to store 2
        $response = $this->actingAs($admin)->postJson("/admin/module/user/submit/{$worker->id}", [
            'name'     => 'Worker Relocated',
            'email'    => 'worker@ex.com',
            'roles'    => [$this->deliveryRoleId],
            'store_id' => $this->store2Id,
        ]);

        $response->assertStatus(200);
        $this->assertEquals((string)$this->store2Id, DB::table('user_meta')->where('user_id', $worker->id)->where('key', 'store_id')->value('value'));
        $this->assertEquals((string)$this->store2Id, DB::table('user_meta')->where('user_id', $worker->id)->where('key', 'assigned_store')->value('value'));
    }

    public function test_store_admin_can_assign_eligible_employee_to_own_store(): void
    {
        $storeAdmin1 = $this->makeUser(['name' => 'Store Admin 1', 'email' => 'sa1@ex.com', 'password' => bcrypt('pass'), 'active' => 1, 'roles' => json_encode([$this->storeAdminRoleId])], $this->store1Id);
        $worker = $this->makeUser(['name' => 'New Worker', 'email' => 'nw@ex.com', 'password' => bcrypt('pass'), 'active' => 1, 'roles' => json_encode([$this->deliveryRoleId])], $this->store1Id);

        $response = $this->actingAs($storeAdmin1)->postJson("/admin/module/user/submit/{$worker->id}", [
            'name'     => 'New Worker Updated',
            'email'    => 'nw@ex.com',
            'roles'    => [$this->deliveryRoleId],
            'store_id' => $this->store1Id,
        ]);

        $response->assertStatus(200);
        $this->assertEquals((string)$this->store1Id, DB::table('user_meta')->where('user_id', $worker->id)->where('key', 'store_id')->value('value'));
    }

    public function test_store_admin_cannot_assign_employee_to_another_store(): void
    {
        $storeAdmin1 = $this->makeUser(['name' => 'Store Admin 1', 'email' => 'sa1_x@ex.com', 'password' => bcrypt('pass'), 'active' => 1, 'roles' => json_encode([$this->storeAdminRoleId])], $this->store1Id);
        $worker = $this->makeUser(['name' => 'Own Worker', 'email' => 'ow@ex.com', 'password' => bcrypt('pass'), 'active' => 1, 'roles' => json_encode([$this->deliveryRoleId])], $this->store1Id);

        // Store Admin 1 attempts to assign own worker to Store 2
        $response = $this->actingAs($storeAdmin1)->postJson("/admin/module/user/submit/{$worker->id}", [
            'name'     => 'Own Worker Tampered',
            'email'    => 'ow@ex.com',
            'roles'    => [$this->deliveryRoleId],
            'store_id' => $this->store2Id,
        ]);

        $response->assertStatus(403);
        // Metadata remains intact
        $this->assertEquals((string)$this->store1Id, DB::table('user_meta')->where('user_id', $worker->id)->where('key', 'store_id')->value('value'));
    }

    public function test_store_admin_cannot_edit_employee_belonging_to_another_store(): void
    {
        $storeAdmin1 = $this->makeUser(['name' => 'Store Admin 1', 'email' => 'sa1_hijack@ex.com', 'password' => bcrypt('pass'), 'active' => 1, 'roles' => json_encode([$this->storeAdminRoleId])], $this->store1Id);
        $store2Worker = $this->makeUser(['name' => 'Store 2 Worker', 'email' => 's2w@ex.com', 'password' => bcrypt('pass'), 'active' => 1, 'roles' => json_encode([$this->deliveryRoleId])], $this->store2Id);

        // Store Admin 1 attempts to edit Store 2's worker
        $response = $this->actingAs($storeAdmin1)->postJson("/admin/module/user/submit/{$store2Worker->id}", [
            'name'     => 'Store 2 Worker Hijacked',
            'email'    => 's2w@ex.com',
            'roles'    => [$this->deliveryRoleId],
            'store_id' => $this->store1Id,
        ]);

        $response->assertStatus(403);
        $this->assertEquals((string)$this->store2Id, DB::table('user_meta')->where('user_id', $store2Worker->id)->where('key', 'store_id')->value('value'));
    }

    public function test_store_admin_cannot_clear_another_stores_employee_assignment(): void
    {
        $storeAdmin1 = $this->makeUser(['name' => 'Store Admin 1', 'email' => 'sa1_clear@ex.com', 'password' => bcrypt('pass'), 'active' => 1, 'roles' => json_encode([$this->storeAdminRoleId])], $this->store1Id);
        $store2Worker = $this->makeUser(['name' => 'Store 2 Worker', 'email' => 's2w_clear@ex.com', 'password' => bcrypt('pass'), 'active' => 1, 'roles' => json_encode([$this->deliveryRoleId])], $this->store2Id);

        $response = $this->actingAs($storeAdmin1)->postJson("/admin/module/user/submit/{$store2Worker->id}", [
            'name'     => 'Store 2 Worker Cleared',
            'email'    => 's2w_clear@ex.com',
            'roles'    => [$this->deliveryRoleId],
            'store_id' => '',
        ]);

        $response->assertStatus(403);
        $this->assertEquals((string)$this->store2Id, DB::table('user_meta')->where('user_id', $store2Worker->id)->where('key', 'store_id')->value('value'));
    }

    public function test_cannot_assign_customer_without_store_role_to_store(): void
    {
        $admin = $this->makeUser(['name' => 'Admin', 'email' => 'admin_cust@ex.com', 'password' => bcrypt('pass'), 'active' => 1, 'roles' => json_encode([$this->adminRoleId])]);
        $customer = $this->makeUser(['name' => 'Customer User', 'email' => 'customer@ex.com', 'password' => bcrypt('pass'), 'active' => 1, 'roles' => json_encode([])]);

        $response = $this->actingAs($admin)->postJson("/admin/module/user/submit/{$customer->id}", [
            'name'     => 'Customer',
            'email'    => 'customer@ex.com',
            'roles'    => [],
            'store_id' => $this->store1Id,
        ]);

        $response->assertStatus(422);
        $this->assertNull(DB::table('user_meta')->where('user_id', $customer->id)->where('key', 'store_id')->value('value'));
    }

    public function test_invalid_and_malformed_store_id_is_rejected(): void
    {
        $admin = $this->makeUser(['name' => 'Admin', 'email' => 'admin_malformed@ex.com', 'password' => bcrypt('pass'), 'active' => 1, 'roles' => json_encode([$this->adminRoleId])]);
        $worker = $this->makeUser(['name' => 'Worker', 'email' => 'worker_m@ex.com', 'password' => bcrypt('pass'), 'active' => 1, 'roles' => json_encode([$this->deliveryRoleId])], $this->store1Id);

        $response = $this->actingAs($admin)->postJson("/admin/module/user/submit/{$worker->id}", [
            'name'     => 'Worker',
            'email'    => 'worker_m@ex.com',
            'roles'    => [$this->deliveryRoleId],
            'store_id' => 999999, // nonexistent store
        ]);

        $response->assertStatus(422);
    }
}
