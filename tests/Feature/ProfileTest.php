<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_page_is_displayed(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get('/profile');

        $response->assertOk();
    }

    public function test_profile_information_can_be_updated(): void
    {
        $user = User::factory()->create();
        $this->withoutMiddleware(ValidateCsrfToken::class);

        $response = $this
            ->from('/profile')
            ->actingAs($user)
            ->patch('/profile', [
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $user->refresh();

        $this->assertSame('Test User', $user->name);
        $this->assertSame('test@example.com', $user->email);
        $this->assertNull($user->email_verified_at);

        $activity = DB::table('user_activities')->where('user_id', $user->id)->latest('id')->first();
        $this->assertNotNull($activity);
        $this->assertSame('profile_updated', json_decode($activity->payload, true)['action']);
    }

    public function test_wishlist_clear_records_a_meaningful_activity(): void
    {
        $user = User::factory()->create();
        $this->withoutMiddleware(ValidateCsrfToken::class);

        $this->actingAs($user)
            ->post('/profile/wishlist/activity', [
                'action' => 'wishlist_cleared',
                'count' => 3,
            ])
            ->assertNoContent();

        $activity = DB::table('user_activities')->where('user_id', $user->id)->latest('id')->first();
        $payload = json_decode($activity->payload, true);

        $this->assertSame('wishlist_cleared', $payload['action']);
        $this->assertSame('wishlist', $payload['category']);
        $this->assertSame('Removed 3 items from your wishlist', $payload['detail']);
    }

    public function test_email_verification_status_is_unchanged_when_the_email_address_is_unchanged(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => 'Test User',
                'email' => $user->email,
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $this->assertNotNull($user->refresh()->email_verified_at);
    }

    public function test_user_can_delete_their_account(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->delete('/profile', [
                'password' => 'password',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/');

        $this->assertGuest();
        $this->assertNull($user->fresh());
    }

    public function test_correct_password_must_be_provided_to_delete_account(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from('/profile')
            ->delete('/profile', [
                'password' => 'wrong-password',
            ]);

        $response
            ->assertSessionHasErrors('password')
            ->assertRedirect('/profile');

        $this->assertNotNull($user->fresh());
    }
}
