<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contact_inquiries', function (Blueprint $table) {
            $table->enum('priority', ['low', 'normal', 'urgent'])->default('normal')->after('status');
            $table->text('admin_reply')->nullable()->after('admin_notes');
            $table->boolean('is_starred')->default(false)->after('priority');
            $table->string('assigned_to')->nullable()->after('is_starred'); // admin name/email handling this
            $table->index('priority');
            $table->index('is_starred');
        });
    }

    public function down(): void
    {
        Schema::table('contact_inquiries', function (Blueprint $table) {
            $table->dropIndex(['priority']);
            $table->dropIndex(['is_starred']);
            $table->dropColumn(['priority', 'admin_reply', 'is_starred', 'assigned_to']);
        });
    }
};

