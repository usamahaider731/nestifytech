<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class LoyaltyRewardService
{
    /**
     * Check if a customer has reached the order milestone and award a loyalty gift card.
     *
     * @param int|null $userId
     * @return array|null Awarded gift card details or null
     */
    public static function checkAndAwardLoyaltyGiftCard(?int $userId): ?array
    {
        if (empty($userId)) {
            return null;
        }

        // Read settings from storage/app/data/setting.json
        $settingPath = storage_path('app/data/setting.json');
        $settings = file_exists($settingPath) ? json_decode(file_get_contents($settingPath), true) : [];
        $site = $settings['site'] ?? [];

        // Check if loyalty reward is enabled
        $isEnabled = filter_var($site['loyalty_reward_enabled']['value'] ?? true, FILTER_VALIDATE_BOOLEAN);
        if (!$isEnabled) {
            return null;
        }

        $milestoneOrders = (int) ($site['loyalty_milestone_orders']['value'] ?? 10);
        $rewardPercentage = (float) ($site['loyalty_reward_percentage']['value'] ?? 5.0);
        $minSpendRequirement = (float) ($site['loyalty_min_total_spend']['value'] ?? 0.0);

        if ($milestoneOrders < 1 || $rewardPercentage <= 0) {
            return null;
        }

        // Count all completed / delivered orders for this user
        $deliveredOrders = DB::table('orders')
            ->where('user_id', $userId)
            ->whereIn('status', ['delivered', 'completed'])
            ->orderBy('id', 'asc')
            ->get();

        $deliveredCount = $deliveredOrders->count();

        // Check if this count is at or above a milestone multiple (e.g. 10, 20, 30...)
        if ($deliveredCount < $milestoneOrders) {
            return null;
        }

        $milestoneNumber = (int) floor($deliveredCount / $milestoneOrders);
        $milestoneTag = "loyalty_milestone_{$milestoneOrders}orders_batch_{$milestoneNumber}";

        // Prevent issuing duplicate gift card for the same milestone batch
        $alreadyIssued = DB::table('gift_cards')
            ->where('issued_to_user_id', $userId)
            ->where('note', 'like', "%{$milestoneTag}%")
            ->exists();

        if ($alreadyIssued) {
            return null;
        }

        // Calculate total spend across these delivered orders (or this milestone block of orders)
        $totalSpend = (float) $deliveredOrders->sum('total_price');

        if ($minSpendRequirement > 0 && $totalSpend < $minSpendRequirement) {
            Log::info("User #{$userId} reached {$deliveredCount} orders but total spend PKR {$totalSpend} is below minimum requirement PKR {$minSpendRequirement}.");
            return null;
        }

        // Calculate gift card reward amount
        $rewardAmount = round(($totalSpend * ($rewardPercentage / 100)), 2);

        if ($rewardAmount <= 0) {
            return null;
        }

        // Generate unique VIP Loyalty Gift Card Code
        $code = 'VIP-' . strtoupper(Str::random(4)) . '-' . strtoupper(Str::random(4));
        $now = now();
        $title = "VIP Loyalty Reward ({$rewardPercentage}% of {$deliveredCount} Orders)";
        $note = "Auto-reward: Completed {$deliveredCount} orders with PKR " . number_format($totalSpend, 2) . " total spend. [{$milestoneTag}]";

        DB::table('gift_cards')->insert([
            'code'               => $code,
            'title'              => $title,
            'initial_balance'    => $rewardAmount,
            'remaining_balance'  => $rewardAmount,
            'purchase_price'     => 0.00, // 100% Free gift reward
            'is_for_sale'        => 0,
            'status'             => 'active',
            'issued_to_user_id'  => $userId,
            'note'               => $note,
            'created_at'         => $now,
            'updated_at'         => $now,
        ]);

        Log::info("Loyalty Gift Card {$code} worth PKR {$rewardAmount} awarded to User #{$userId} for milestone {$milestoneTag}.");

        return [
            'code'           => $code,
            'reward_amount'  => $rewardAmount,
            'total_spend'    => $totalSpend,
            'total_orders'   => $deliveredCount,
            'percentage'     => $rewardPercentage,
        ];
    }
}
