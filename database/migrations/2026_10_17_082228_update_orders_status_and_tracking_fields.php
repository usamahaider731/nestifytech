<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Expand status enum to support modern order processing lifecycle:
        // pending -> processing -> shipped -> delivered -> completed -> cancelled
        DB::statement("ALTER TABLE `orders` MODIFY `status` ENUM('pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled') NOT NULL DEFAULT 'pending'");

        // 2. Add tracking and shipping details if not exist
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'tracking_number')) {
                $table->string('tracking_number')->nullable()->after('status');
            }
            if (!Schema::hasColumn('orders', 'shipping_carrier')) {
                $table->string('shipping_carrier')->nullable()->after('tracking_number');
            }
            if (!Schema::hasColumn('orders', 'shipping_address')) {
                $table->text('shipping_address')->nullable()->after('shipping_carrier');
            }
            if (!Schema::hasColumn('orders', 'shipping_city')) {
                $table->string('shipping_city')->nullable()->after('shipping_address');
            }
            if (!Schema::hasColumn('orders', 'shipping_state')) {
                $table->string('shipping_state')->nullable()->after('shipping_city');
            }
            if (!Schema::hasColumn('orders', 'shipping_country')) {
                $table->string('shipping_country')->nullable()->after('shipping_state');
            }
            if (!Schema::hasColumn('orders', 'customer_notes')) {
                $table->text('customer_notes')->nullable()->after('shipping_country');
            }
            if (!Schema::hasColumn('orders', 'admin_notes')) {
                $table->text('admin_notes')->nullable()->after('customer_notes');
            }
            if (!Schema::hasColumn('orders', 'shipped_date')) {
                $table->timestamp('shipped_date')->nullable()->after('completed_date');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'tracking_number',
                'shipping_carrier',
                'shipping_address',
                'shipping_city',
                'shipping_state',
                'shipping_country',
                'customer_notes',
                'admin_notes',
                'shipped_date',
            ]);
        });

        DB::statement("ALTER TABLE `orders` MODIFY `status` ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending'");
    }
};
