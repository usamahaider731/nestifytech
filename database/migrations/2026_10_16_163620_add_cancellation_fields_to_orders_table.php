<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'cancellation_deduction')) {
                $table->decimal('cancellation_deduction', 10, 2)->nullable()->default(0)->after('total_price');
            }
            if (!Schema::hasColumn('orders', 'refund_amount')) {
                $table->decimal('refund_amount', 10, 2)->nullable()->default(0)->after('cancellation_deduction');
            }
            if (!Schema::hasColumn('orders', 'cancellation_fee_percentage')) {
                $table->decimal('cancellation_fee_percentage', 5, 2)->nullable()->default(0)->after('refund_amount');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['cancellation_deduction', 'refund_amount', 'cancellation_fee_percentage']);
        });
    }
};
