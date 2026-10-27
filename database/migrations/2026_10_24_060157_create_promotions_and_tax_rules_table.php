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
        Schema::create('promotions_and_tax_rules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['discount', 'tax'])->default('discount');
            $table->enum('rate_type', ['percentage', 'fixed'])->default('percentage');
            $table->decimal('rate_value', 12, 2)->default(0);
            
            // Targeting: 'all', 'product', 'category', 'brand', 'collection', 'user_role', 'user'
            $table->enum('target_type', ['all', 'product', 'category', 'brand', 'collection', 'user_role', 'user'])->default('all');
            
            // Array of target IDs or keys (e.g. [1, 2, 5] or ['customer', 'vip'])
            $table->json('target_ids')->nullable();
            
            // Optional coupon/promo code
            $table->string('code')->nullable();
            
            // Minimum spend threshold to qualify
            $table->decimal('min_spend', 12, 2)->nullable();
            
            // Validity window
            $table->dateTime('start_date')->nullable();
            $table->dateTime('end_date')->nullable();
            
            // Priority ordering (higher priority applies first)
            $table->integer('priority')->default(0);
            
            // Active toggle
            $table->enum('status', ['active', 'inactive'])->default('active');
            
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('promotions_and_tax_rules');
    }
};
