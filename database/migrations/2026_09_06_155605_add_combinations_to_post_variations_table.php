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
        Schema::table('post_variations', function (Blueprint $table) {
            $table->longText('combinations')->nullable()->after('color');
            $table->longText('shared_attributes')->nullable()->after('combinations');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('post_variations', function (Blueprint $table) {
            $table->dropColumn(['combinations', 'shared_attributes']);
        });
    }
};
