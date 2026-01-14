<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {

        if (!Schema::hasTable('posts')) {

            Schema::create('posts', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->string('title')->default('');
                $table->string('sku')->unique('sku')->default('');
                $table->longText('description')->default('');
                $table->enum('status', ['draft', 'publish'])->default('draft');
                $table->string('type')->default('product');
                $table->timestamps();
            });

            Schema::table('posts', function (Blueprint $table) {
                $table->foreign('user_id')->references('id')->on('users');
            });
        }



        if (!Schema::hasTable('post_meta')) {

            Schema::create('post_meta', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('post_id');
                $table->string('key');
                $table->string('value')->nullable();
            });

            Schema::table('post_meta', function (Blueprint $table) {
                $table->foreign('post_id')->references('id')->on('posts');
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('post_meta');
        Schema::dropIfExists('posts');
    }
};
