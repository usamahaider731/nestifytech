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
        if (!Schema::hasTable('incoming_stock_orders')) {
            Schema::create('incoming_stock_orders', function (Blueprint $table) {
                $table->id();
                $table->string('po_number')->unique(); // e.g. PO-2026-001
                $table->unsignedBigInteger('supplier_id')->nullable();
                $table->string('supplier_name')->nullable();
                $table->enum('status', ['ordered', 'in_transit', 'received', 'cancelled'])->default('ordered');
                $table->date('order_date')->nullable();
                $table->date('expected_delivery_date')->nullable();
                $table->date('received_date')->nullable();
                $table->string('tracking_number')->nullable();
                $table->decimal('total_cost', 12, 2)->default(0.00);
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('incoming_stock_items')) {
            Schema::create('incoming_stock_items', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('incoming_order_id');
                $table->unsignedBigInteger('product_id');
                $table->unsignedBigInteger('variation_id')->nullable(); // null for simple products, id for child combos
                $table->string('product_title');
                $table->string('sku')->nullable();
                $table->unsignedInteger('quantity_ordered');
                $table->unsignedInteger('quantity_received')->default(0);
                $table->decimal('unit_cost', 10, 2)->default(0.00);
                $table->decimal('subtotal', 10, 2)->default(0.00);
                $table->timestamps();

                $table->foreign('incoming_order_id')->references('id')->on('incoming_stock_orders')->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('incoming_stock_items');
        Schema::dropIfExists('incoming_stock_orders');
    }
};
