<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class UserAuthorizationService
{
    /**
     * Check if a user is an Administrator (full system bypass).
     */
    public static function isAdministrator(?User $user): bool
    {
        if (!$user) {
            return false;
        }

        $roles = is_string($user->roles) ? json_decode($user->roles, true) : (array) $user->roles;
        if (empty($roles)) {
            return false;
        }

        return DB::table('roles')
            ->whereIn('id', $roles)
            ->where('title', 'Administrator')
            ->exists();
    }

    /**
     * Check if a user is a Store Admin.
     */
    public static function isStoreAdmin(?User $user): bool
    {
        if (!$user) {
            return false;
        }

        $userRoles = $user->user_role ?? [];
        if (!is_array($userRoles)) {
            $userRoles = [$userRoles];
        }

        foreach ($userRoles as $roleTitle) {
            if (is_string($roleTitle) && preg_match('/store\s*admin/i', $roleTitle)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get the store ID assigned to the given user.
     * Checks both store_id and assigned_store in user_meta.
     */
    public static function getAssignedStoreId(?User $user): ?int
    {
        if (!$user) {
            return null;
        }

        $meta = $user->meta ?? [];
        $storeId = $meta['store_id'] ?? $meta['assigned_store'] ?? null;

        if ($storeId !== null && is_numeric($storeId)) {
            return (int) $storeId;
        }

        // Direct DB fallback
        $val = DB::table('user_meta')
            ->where('user_id', $user->id)
            ->whereIn('key', ['store_id', 'assigned_store'])
            ->whereNotNull('value')
            ->where('value', '!=', '')
            ->value('value');

        return ($val !== null && is_numeric($val)) ? (int) $val : null;
    }

    /**
     * Determine whether the user can access user-options for assignment dropdowns.
     * Allowed:
     * - Global Administrator
     * - Store Admin
     * - Users with user-read or user-write permissions
     */
    public static function canAccessUserOptions(?User $user): bool
    {
        if (!$user) {
            return false;
        }

        if (self::isAdministrator($user)) {
            return true;
        }

        if (self::isStoreAdmin($user)) {
            return true;
        }

        $permissions = $user->user_permissions ?? [];
        if (in_array('user-read', $permissions, true) || in_array('user-write', $permissions, true)) {
            return true;
        }

        return false;
    }

    /**
     * Check if the user is authorized to create a store.
     * Only Global Administrators or platform users with explicit store-create permissions may create stores.
     */
    public static function canCreateStore(?User $user): bool
    {
        if (!$user) {
            return false;
        }

        if (self::isAdministrator($user)) {
            return true;
        }

        $permissions = $user->user_permissions ?? [];
        return in_array('store-create', $permissions, true) || in_array('store-write', $permissions, true);
    }

    /**
     * Check if the user is authorized to edit a specific store.
     */
    public static function canManageStore(?User $user, int $storeId): bool
    {
        if (!$user) {
            return false;
        }

        if (self::isAdministrator($user)) {
            return true;
        }

        $assignedStore = self::getAssignedStoreId($user);
        return $assignedStore !== null && (int) $assignedStore === (int) $storeId;
    }

    /**
     * Validate and authorize store assignment for an employee via the user-management endpoint.
     * Enforces:
     * - Isolation: Non-global admins can only modify employees of their own store and assign to their own store.
     * - Role Eligibility: Only users with store-scoped roles ('Store Admin', 'Store Manager', 'Delivery Boy') can be assigned to a store.
     * - Valid Store: Submitted store ID must reference an existing store.
     */
    public static function validateUserStoreAssignment(?User $authUser, $targetUserOrId, $submittedStoreId, bool $lockForUpdate = false): bool
    {
        $isGlobalAdmin = self::isAdministrator($authUser);
        $authStoreId   = self::getAssignedStoreId($authUser);

        // Normalize target user
        $targetUser = null;
        if ($targetUserOrId instanceof User) {
            $targetUser = $targetUserOrId;
        } elseif (!empty($targetUserOrId)) {
            $query = User::where('id', $targetUserOrId);
            if ($lockForUpdate) {
                $query->lockForUpdate();
            }
            $targetUser = $query->first();
        }

        // Clean submitted store ID
        if (is_array($submittedStoreId) && isset($submittedStoreId['id'])) {
            $submittedStoreId = $submittedStoreId['id'];
        }
        $submittedStoreId = (!empty($submittedStoreId) && is_numeric($submittedStoreId)) ? (int) $submittedStoreId : null;

        // 1. Non-global admin isolation check on target user (if editing existing user)
        if (!$isGlobalAdmin && $targetUser) {
            $targetStoreId = self::getAssignedStoreId($targetUser);
            // If the user already belongs to another store, Store Admin cannot edit them
            if ($targetStoreId !== null && (int) $targetStoreId !== (int) $authStoreId) {
                abort(403, 'Unauthorized: You cannot modify employees belonging to another store.');
            }
            // If user has no store assigned and Store Admin attempts to edit without assigning to their own store
            if ($targetStoreId === null && empty($authStoreId)) {
                abort(403, 'Unauthorized: You are not assigned to any store.');
            }
        }

        // 2. Validate submitted store ID
        if (!empty($submittedStoreId)) {
            // Must reference an existing store post
            $storeExists = DB::table('posts')
                ->where('id', $submittedStoreId)
                ->where('type', 'store')
                ->exists();
            if (!$storeExists) {
                abort(422, 'The selected store does not exist.');
            }

            // Non-global admin can ONLY assign to their own store
            if (!$isGlobalAdmin) {
                if (empty($authStoreId) || (int) $submittedStoreId !== (int) $authStoreId) {
                    abort(403, 'Unauthorized: You can only assign employees to your own authorized store.');
                }
            }

            // 3. Target Role Eligibility
            // When assigning a store, the user must hold at least one store-scoped role
            // Roles seeded with scope 'store': 'Store Admin', 'Store Manager', 'Delivery Boy'
            $rolesToCheck = [];
            if (request()->has('roles')) {
                $rawRoles = request()->input('roles');
                $rolesToCheck = is_array($rawRoles) ? $rawRoles : (is_string($rawRoles) ? json_decode($rawRoles, true) : [$rawRoles]);
                $rolesToCheck = is_array($rolesToCheck) ? $rolesToCheck : [$rolesToCheck];
                $rolesToCheck = array_map(fn($r) => is_array($r) ? ($r['id'] ?? null) : (is_object($r) ? ($r->id ?? null) : $r), $rolesToCheck);
                $rolesToCheck = array_values(array_filter($rolesToCheck));
            } elseif ($targetUser) {
                $userRoles = is_string($targetUser->roles ?? null) ? json_decode($targetUser->roles, true) : (array) ($targetUser->roles ?? []);
                $rolesToCheck = array_values(array_filter((array) $userRoles));
            }

            if (!empty($rolesToCheck)) {
                $hasStoreRole = DB::table('roles')
                    ->whereIn('id', array_values($rolesToCheck))
                    ->where('scope', 'store')
                    ->exists();

                if (!$hasStoreRole) {
                    abort(422, 'Store assignment requires a store-scoped role (Store Admin, Store Manager, or Delivery Boy).');
                }
            } else {
                abort(422, 'Cannot assign a store to a user without any store roles.');
            }
        } elseif (request()->has('store_id') && !$isGlobalAdmin && $targetUser) {
            // Store Admin cannot clear another store's employee assignment
            $targetStoreId = self::getAssignedStoreId($targetUser);
            if ($targetStoreId !== null && (int) $targetStoreId !== (int) $authStoreId) {
                abort(403, 'Unauthorized: You cannot clear store assignments for other stores.');
            }
        }

        return true;
    }

    /**
     * Validate and authorize manager assignment to a store.
     * Returns true on success, throws HttpResponseException / abort() on violation.
     */
    public static function validateManagerAssignment(?User $authUser, int $targetStoreId, $managerId, bool $lockForUpdate = false): bool
    {
        if (empty($managerId)) {
            return true; // Clearing manager is allowed if authorized to manage store
        }

        $isGlobalAdmin = self::isAdministrator($authUser);

        // 1. Target manager must exist, be locked if requested, and be active
        $query = User::where('id', $managerId);
        if ($lockForUpdate) {
            $query->lockForUpdate();
        }
        $managerUser = $query->first();

        if (!$managerUser || !$managerUser->active) {
            abort(422, 'The selected store manager must be an active user.');
        }

        // 2. Validate Manager Role Eligibility
        // Only Store Admin, Store Manager, or platform Administrator are eligible
        $userRoles = $managerUser->user_role ?? [];
        if (!is_array($userRoles)) {
            $userRoles = [$userRoles];
        }

        $eligibleRoles = ['Administrator', 'Store Admin', 'Store Manager'];
        $hasEligibleRole = false;
        foreach ($userRoles as $roleTitle) {
            if (is_string($roleTitle) && in_array(trim($roleTitle), $eligibleRoles, true)) {
                $hasEligibleRole = true;
                break;
            }
        }

        if (!$hasEligibleRole) {
            abort(422, 'The selected user is not eligible to be assigned as a store manager.');
        }

        // 3. Cross-store protection for non-global admins
        if (!$isGlobalAdmin) {
            $currentManagerStore = self::getAssignedStoreId($managerUser);

            // If the user already belongs to another store, Store Admin cannot hijack them
            if ($currentManagerStore !== null && (int) $currentManagerStore !== (int) $targetStoreId) {
                abort(403, 'Cannot assign a user belonging to another store without an authorized transfer.');
            }
        }

        return true;
    }
}
