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
        Schema::create('attribute_values', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('attribute_id');
            $table->string('value');
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->string('parent_type')->nullable();
            $table->timestamps();
            
            // Add index for faster lookups
            $table->index(['attribute_id']);
            $table->index(['parent_id', 'parent_type']);
            
            // Add foreign key constraint
            $table->foreign('attribute_id')
                  ->references('id')
                  ->on('attributes')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attribute_values');
    }
};