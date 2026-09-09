<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('post_variations') && !Schema::hasColumn('post_variations', 'color')) {
            Schema::table('post_variations', function (Blueprint $table) {
                $table->string('color', 100)->nullable()->after('stock');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('post_variations') && Schema::hasColumn('post_variations', 'color')) {
            Schema::table('post_variations', function (Blueprint $table) {
                $table->dropColumn('color');
            });
        }
    }
};
