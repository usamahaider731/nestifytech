<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    /**
     * Allowed social providers.
     */
    protected array $allowedProviders = ['google', 'facebook'];

    /**
     * Redirect the user to the OAuth provider.
     */
    public function redirect(string $provider): RedirectResponse
    {
        if (!in_array($provider, $this->allowedProviders)) {
            return redirect()->route('login')->withErrors([
                'email' => "Provider [{$provider}] is not supported.",
            ]);
        }

        $clientId = config("services.{$provider}.client_id");
        $clientSecret = config("services.{$provider}.client_secret");

        if (empty($clientId) || empty($clientSecret)) {
            return redirect()->route('login')->withErrors([
                'email' => ucfirst($provider) . " login is not configured yet. Please add " . strtoupper($provider) . "_CLIENT_ID and " . strtoupper($provider) . "_CLIENT_SECRET in your .env file.",
            ]);
        }

        try {
            return Socialite::driver($provider)->redirect();
        } catch (\Throwable $e) {
            Log::error("Social login redirect error for [{$provider}]: " . $e->getMessage());
            return redirect()->route('login')->withErrors([
                'email' => "Unable to connect with " . ucfirst($provider) . ". Please check API credentials.",
            ]);
        }
    }

    /**
     * Obtain the user information from the OAuth provider callback.
     */
    public function callback(string $provider): RedirectResponse
    {
        if (!in_array($provider, $this->allowedProviders)) {
            return redirect()->route('login')->withErrors([
                'email' => "Provider [{$provider}] is not supported.",
            ]);
        }

        try {
            $socialUser = Socialite::driver($provider)->user();
        } catch (\Throwable $e) {
            Log::error("Social login callback error for [{$provider}]: " . $e->getMessage());
            return redirect()->route('login')->withErrors([
                'email' => "Authentication with " . ucfirst($provider) . " failed or was canceled. Please try again.",
            ]);
        }

        if (!$socialUser || empty($socialUser->getEmail())) {
            return redirect()->route('login')->withErrors([
                'email' => "Could not retrieve verified email address from " . ucfirst($provider) . ".",
            ]);
        }

        // Find existing user by provider ID or by email
        $user = User::where('email', $socialUser->getEmail())->first();

        DB::beginTransaction();
        try {
            if (!$user) {
                // Create brand new user
                $name = $socialUser->getName() ?: ($socialUser->getNickname() ?: 'Customer');
                $user = User::create([
                    'name' => $name,
                    'email' => $socialUser->getEmail(),
                    'password' => Hash::make(Str::random(32)),
                    'active' => true,
                    'roles' => [], // Default customer (no admin/delivery staff role)
                    'email_verified_at' => now(),
                ]);
            } else {
                // Ensure user is marked verified
                if (empty($user->email_verified_at)) {
                    $user->email_verified_at = now();
                    $user->save();
                }
            }

            // Save provider details in user_meta
            DB::table('user_meta')->updateOrInsert(
                ['user_id' => $user->id, 'key' => "{$provider}_id"],
                ['value' => (string) $socialUser->getId(), 'updated_at' => now()]
            );

            // Store avatar if provided by provider
            if ($socialUser->getAvatar()) {
                DB::table('user_meta')->updateOrInsert(
                    ['user_id' => $user->id, 'key' => "{$provider}_avatar"],
                    ['value' => (string) $socialUser->getAvatar(), 'updated_at' => now()]
                );
            }

            DB::commit();

            // Log the user in
            Auth::login($user, true);
            request()->session()->regenerate();

            return redirect()->intended(route('profile.index'));
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Error saving social user for [{$provider}]: " . $e->getMessage());
            return redirect()->route('login')->withErrors([
                'email' => "Failed to complete login. Please try again.",
            ]);
        }
    }
}
