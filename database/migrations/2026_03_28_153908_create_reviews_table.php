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
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('post_id')->constrained('posts')->onDelete('cascade');
            $table->integer('parent_id')->nullable()->default(0);
            $table->integer('rating')->default(5);
            $table->text('comment')->nullable();
            $table->enum('type', ['general', 'verified'])->default('general');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->integer('likes')->default(0);
            $table->integer('reports')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
