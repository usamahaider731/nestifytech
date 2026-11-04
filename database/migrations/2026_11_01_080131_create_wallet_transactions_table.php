<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->index();
            $table->string('type')->default('credit');        // credit | debit
            $table->decimal('amount', 12, 2)->default(0);
            $table->decimal('balance_after', 12, 2)->default(0);
            $table->string('reason')->nullable();             // e.g. 'order_refund'
            $table->unsignedBigInteger('order_id')->nullable()->index();
            $table->string('reference')->nullable();          // stripe refund id, etc.
            $table->text('note')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
    }
};
