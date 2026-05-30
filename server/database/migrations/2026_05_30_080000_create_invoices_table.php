<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * UC13 - Bang `invoices` (hoa don thanh toan chi phi kham benh).
 *
 * Mot phien kham (examination_sessions) khi chuyen `cho_thanh_toan` se tao
 * 1 invoice "main" (auto-create trong ExaminationService::complete). VR13:
 * tai moi thoi diem chi co 1 invoice main "song" (status NOT IN cancelled)
 * cho cung examination_id - enforce trong InvoiceService.
 *
 * Snapshot fields (`patient_name_snapshot`, `patient_phone_snapshot`) bao
 * dam hoa don khong thay doi khi BN edit thong tin sau (DR86-87).
 *
 * Field `type=adjustment` voi `parent_invoice_id` cho phep luu but toan
 * dieu chinh (VR4) - khong ghi de `invoices` goc.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('invoices')) {
            return;
        }

        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('code', 32)->unique();

            // UC12 source.
            $table->foreignId('examination_id')
                ->constrained('examination_sessions')
                ->cascadeOnDelete();
            $table->foreignId('appointment_id')->nullable()
                ->constrained('appointments')->nullOnDelete();

            // Patient + snapshot (DR85-87).
            $table->foreignId('patient_id')->constrained('patients')->restrictOnDelete();
            $table->string('patient_name_snapshot', 191);
            $table->string('patient_phone_snapshot', 32)->nullable();

            // Doctor + exam metadata (DR88-90).
            $table->foreignId('doctor_id')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->dateTime('exam_date');
            $table->foreignId('branch_id')->nullable()
                ->constrained('branches')->nullOnDelete();

            // Money fields (DR95-101).
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->string('discount_reason', 255)->nullable();
            $table->text('discount_note')->nullable();
            $table->decimal('surcharge_amount', 15, 2)->default(0);
            $table->string('surcharge_reason', 255)->nullable();
            $table->decimal('total', 15, 2)->default(0);
            $table->decimal('amount_paid', 15, 2)->default(0);
            $table->decimal('amount_due', 15, 2)->default(0);

            // Status (DR102) + type (main/adjustment).
            $table->string('status', 32)->default('pending');
            $table->string('type', 16)->default('main');
            $table->foreignId('parent_invoice_id')->nullable()
                ->constrained('invoices')->nullOnDelete();

            // Notes + audit (DR108-109).
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->foreignId('cancelled_by')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->dateTime('cancelled_at')->nullable();
            $table->string('cancelled_reason', 255)->nullable();
            $table->text('cancelled_note')->nullable();
            $table->dateTime('adjusted_at')->nullable();

            $table->timestamps();

            $table->index(['patient_id', 'status']);
            $table->index(['status', 'created_at']);
            $table->index(['branch_id', 'exam_date']);
            $table->index('examination_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
