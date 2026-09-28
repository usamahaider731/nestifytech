<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('stripe_payment_intent_id')->nullable()->after('payment_status');
            $table->string('refund_id')->nullable()->after('stripe_payment_intent_id');
            $table->string('refund_status')->nullable()->after('refund_id'); // pending, succeeded, failed
            $table->timestamp('cancelled_date')->nullable()->after('completed_date');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['stripe_payment_intent_id', 'refund_id', 'refund_status', 'cancelled_date']);
        });
    }
};
