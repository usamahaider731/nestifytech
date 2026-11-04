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
            if (! Schema::hasColumn('post_variations', 'buy_price')) {
                $table->decimal('buy_price', 12, 2)->nullable()->after('price');
            }
            if (! Schema::hasColumn('post_variations', 'first_price')) {
                $table->decimal('first_price', 12, 2)->nullable()->after('buy_price');
            }
            if (! Schema::hasColumn('post_variations', 'second_price')) {
                $table->decimal('second_price', 12, 2)->nullable()->after('first_price');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('post_variations', function (Blueprint $table) {
            $columns = array_values(array_filter([
                Schema::hasColumn('post_variations', 'buy_price') ? 'buy_price' : null,
                Schema::hasColumn('post_variations', 'first_price') ? 'first_price' : null,
                Schema::hasColumn('post_variations', 'second_price') ? 'second_price' : null,
            ]));

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
