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
            // Delivery boy / rider assigned to deliver order
            if (!Schema::hasColumn('orders', 'delivery_boy_id')) {
                $table->unsignedBigInteger('delivery_boy_id')->nullable()->after('user_id');
            }

            // Customer verification OTP (sent to customer WhatsApp, entered on delivery device)
            if (!Schema::hasColumn('orders', 'delivery_otp')) {
                $table->string('delivery_otp', 10)->nullable()->after('status');
            }
            if (!Schema::hasColumn('orders', 'delivery_otp_expires_at')) {
                $table->timestamp('delivery_otp_expires_at')->nullable()->after('delivery_otp');
            }
            if (!Schema::hasColumn('orders', 'delivery_otp_verified_at')) {
                $table->timestamp('delivery_otp_verified_at')->nullable()->after('delivery_otp_expires_at');
            }

            // Cash on delivery collected by rider & settlement to office
            if (!Schema::hasColumn('orders', 'cod_collected_amount')) {
                $table->decimal('cod_collected_amount', 10, 2)->nullable()->default(0)->after('payment_status');
            }
            if (!Schema::hasColumn('orders', 'cod_collected_at')) {
                $table->timestamp('cod_collected_at')->nullable()->after('cod_collected_amount');
            }
            // Settlement status from delivery boy to office: 'unsettled', 'settled'
            if (!Schema::hasColumn('orders', 'office_settlement_status')) {
                $table->string('office_settlement_status', 20)->default('unsettled')->after('cod_collected_at');
            }
            if (!Schema::hasColumn('orders', 'office_settlement_otp')) {
                $table->string('office_settlement_otp', 10)->nullable()->after('office_settlement_status');
            }
            if (!Schema::hasColumn('orders', 'office_settlement_at')) {
                $table->timestamp('office_settlement_at')->nullable()->after('office_settlement_otp');
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
                'delivery_boy_id',
                'delivery_otp',
                'delivery_otp_expires_at',
                'delivery_otp_verified_at',
                'cod_collected_amount',
                'cod_collected_at',
                'office_settlement_status',
                'office_settlement_otp',
                'office_settlement_at',
            ]);
        });
    }
};
