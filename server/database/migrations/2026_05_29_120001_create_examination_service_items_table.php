<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * UC12 - Bang `examination_service_items` (DR69-DR76).
 *
 * Moi dong la mot dich vu chi dinh trong phien kham. Snapshot service_code,
 * service_name, unit_price, complexity_coefficient tai thoi diem ghi nhan
 * de khong bi anh huong khi cau hinh sau nay thay doi (xac nhan #6 cua PO).
 *
 * `subtotal_snapshot` = `quantity * unit_price * (1 + complexity_coefficient)`.
 *
 * `is_paid` mac dinh false; UC13 thanh toan se cap nhat sau (chua co UC13).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('examination_service_items')) {
            return;
        }

        Schema::create('examination_service_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('examination_id')
                ->constrained('examination_sessions')
                ->cascadeOnDelete();
            $table->foreignId('service_id')->constrained('services')->restrictOnDelete();

            $table->string('service_code_snapshot', 64);
            $table->string('service_name_snapshot', 255);

            // tooth_codes JSON (vd ["18","17"]) - FDI numbering.
            $table->json('tooth_codes')->nullable();

            // DR71 muc xu ly: thong_thuong / kho / phuc_tap / rat_phuc_tap.
            $table->string('processing_level', 32)->default('thong_thuong');

            // DR72 / AC9: he so cong them 0..0.5 (additive).
            $table->decimal('complexity_coefficient', 4, 2)->default(0);
            $table->string('complexity_reason', 500)->nullable();

            $table->decimal('unit_price_snapshot', 15, 2)->default(0);
            $table->unsignedSmallInteger('quantity')->default(1);
            $table->decimal('subtotal_snapshot', 15, 2)->default(0);

            $table->foreignId('performed_by')->nullable()
                ->constrained('users')->nullOnDelete();

            $table->boolean('is_paid')->default(false);

            $table->timestamps();

            $table->index('examination_id');
            $table->index('service_id');
            $table->index(['examination_id', 'is_paid']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('examination_service_items');
    }
};
