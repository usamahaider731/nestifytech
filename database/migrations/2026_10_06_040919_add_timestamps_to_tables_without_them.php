<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tables = array_map(function ($t) { return (array) $t; }, DB::select('SHOW TABLES'));
        $tables = array_map(function ($t) { return array_values($t)[0]; }, $tables);
        $ignoreTables = ['migrations', 'jobs', 'failed_jobs', 'personal_access_tokens', 'password_reset_tokens', 'cache', 'cache_locks', 'sessions'];

        foreach ($tables as $table) {
            if (in_array($table, $ignoreTables)) {
                continue;
            }

            if (!Schema::hasColumn($table, 'created_at') && !Schema::hasColumn($table, 'updated_at')) {
                Schema::table($table, function (Blueprint $table) {
                    $table->timestamps();
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 
    }
};
