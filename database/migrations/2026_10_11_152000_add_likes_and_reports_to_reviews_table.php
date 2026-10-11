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
        Schema::table('reviews', function (Blueprint $table) {
            if (!Schema::hasColumn('reviews', 'likes')) {
                $table->integer('likes')->default(0)->after('status');
            }
            if (!Schema::hasColumn('reviews', 'reports')) {
                $table->integer('reports')->default(0)->after('likes');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            if (Schema::hasColumn('reviews', 'reports')) {
                $table->dropColumn('reports');
            }
            if (Schema::hasColumn('reviews', 'likes')) {
                $table->dropColumn('likes');
            }
        });
    }
};
