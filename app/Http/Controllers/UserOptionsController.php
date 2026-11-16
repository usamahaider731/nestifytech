<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserOptionsRequest;
use App\Http\Resources\UserOptionResource;
use App\Models\User;
use App\Services\UserAuthorizationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class UserOptionsController extends Controller
{
    /**
     * Get user options for administrative assignment dropdowns.
     * Enforces authentication, authorization, store-isolation, search, and pagination.
     */
    public function index(UserOptionsRequest $request): JsonResponse
    {
        /** @var User|null $authUser */
        $authUser = $request->user();

        if (!$authUser) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (!UserAuthorizationService::canAccessUserOptions($authUser)) {
            return response()->json(['message' => 'Unauthorized action.'], 403);
        }

        $isGlobalAdmin = UserAuthorizationService::isAdministrator($authUser);
        $userStoreId   = UserAuthorizationService::getAssignedStoreId($authUser);

        $query = DB::table('users')
            ->where('active', 1)
            ->select('users.id', 'users.name');

        // ── Store Isolation ─────────────────────────────────────────────────────────
        if (!$isGlobalAdmin) {
            // Non-global admins (Store Admin, Store Staff) can only see users belonging to their own store.
            if (empty($userStoreId)) {
                // If the user has no assigned store, they cannot see any store users
                return response()->json([]);
            }

            $query->join('user_meta', 'users.id', '=', 'user_meta.user_id')
                ->whereIn('user_meta.key', ['store_id', 'assigned_store'])
                ->where('user_meta.value', (string) $userStoreId)
                ->distinct();
        }

        // ── Search Filtering ────────────────────────────────────────────────────────
        if ($search = trim((string) $request->input('search'))) {
            $query->where('users.name', 'like', '%' . addcslashes($search, '%_') . '%');
        }

        // ── Role Filtering ──────────────────────────────────────────────────────────
        if ($roleFilter = $request->input('role')) {
            $matchedRoleId = DB::table('roles')
                ->where('title', $roleFilter)
                ->value('id');

            if ($matchedRoleId) {
                $query->where(function ($q) use ($matchedRoleId, $roleFilter) {
                    $q->whereJsonContains('users.roles', $matchedRoleId)
                      ->orWhereJsonContains('users.roles', (string) $matchedRoleId)
                      ->orWhereJsonContains('users.roles', $roleFilter);
                });
            } else {
                $query->where(function ($q) use ($roleFilter) {
                    $q->whereJsonContains('users.roles', $roleFilter);
                });
            }
        }

        $perPage = min((int) ($request->input('per_page', 50)), 100);

        if ($request->has('page')) {
            $paginated = $query->orderBy('users.name')->paginate($perPage);

            return response()->json([
                'data'         => UserOptionResource::collection($paginated->items()),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'per_page'     => $paginated->perPage(),
                'total'        => $paginated->total(),
            ]);
        }

        // Standard dropdown listing (capped at $perPage to prevent full table memory exhaustion)
        $users = $query->orderBy('users.name')->limit($perPage)->get();

        return response()->json(UserOptionResource::collection($users));
    }
}
