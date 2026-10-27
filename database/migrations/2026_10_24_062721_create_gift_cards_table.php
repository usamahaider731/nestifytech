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
        Schema::create('gift_cards', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->decimal('initial_balance', 12, 2)->default(0);
            $table->decimal('remaining_balance', 12, 2)->default(0);
            $table->enum('status', ['active', 'inactive', 'exhausted'])->default('active');
            $table->dateTime('expires_at')->nullable();
            $table->unsignedBigInteger('issued_to_user_id')->nullable(); // null = public gift card
            $table->string('note')->nullable(); // Admin note
            $table->timestamps();

            $table->foreign('issued_to_user_id')->references('id')->on('users')->onDelete('set null');
        });

        // Track gift card usage per order
        Schema::create('gift_card_usages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('gift_card_id');
            $table->unsignedBigInteger('order_id')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->decimal('amount_used', 12, 2);
            $table->timestamps();

            $table->foreign('gift_card_id')->references('id')->on('gift_cards')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gift_card_usages');
        Schema::dropIfExists('gift_cards');
    }
};
