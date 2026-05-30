<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * UC13 - Bang `invoice_items` (DR91-94).
 *
 * Tai thoi diem InvoiceService::createFromExamination, moi
 * `examination_service_items` cua phien kham se sinh ra 1 dong
 * `invoice_items`, copy thang snapshot tu UC12 (don gia, he so phuc tap,
 * processing_level, tooth_codes, subtotal_snapshot). `line_total` =
 * `examination_service_items.subtotal_snapshot` (da bao gom complexity).
 *
 * Co FK `examination_service_item_id` de UC13 set `is_paid=true` khi
 * invoice paid full.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('invoice_items')) {
            return;
        }

        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('invoices')->cascadeOnDelete();
            $table->foreignId('examination_service_item_id')->nullable()
                ->constrained('examination_service_items')->nullOnDelete();
            $table->foreignId('service_id')->nullable()
                ->constrained('services')->nullOnDelete();

            $table->string('service_code_snapshot', 64);
            $table->string('service_name_snapshot', 255);
            $table->json('tooth_codes')->nullable();
            $table->string('processing_level', 32)->default('thong_thuong');
            $table->decimal('complexity_coefficient', 4, 2)->default(0);
            $table->decimal('unit_price_snapshot', 15, 2)->default(0);
            $table->unsignedSmallInteger('quantity')->default(1);
            $table->decimal('line_total', 15, 2)->default(0);
            $table->timestamps();

            $table->index('invoice_id');
            $table->index('examination_service_item_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_items');
    }
};
