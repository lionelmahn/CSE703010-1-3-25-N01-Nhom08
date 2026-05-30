<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * UC12 - Bang `examination_sessions` (phien kham / ho so benh an).
 *
 * Tao moi khi bac si bat dau kham (POST /api/examinations/start) tu hang
 * cho `appointment_queue_entries.bucket=ready`. Status mac dinh `dang_kham`.
 *
 * Cot du lieu chuyen mon (chief_complaint, diagnosis,...) ban dau nullable
 * - bat buoc khi complete (VR4). Code BA-YYYY-XXXXXX sinh server-side.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('examination_sessions')) {
            return;
        }

        Schema::create('examination_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('code', 32)->unique();

            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('appointment_id')->constrained('appointments')->cascadeOnDelete();
            $table->foreignId('queue_entry_id')->nullable()
                ->constrained('appointment_queue_entries')->nullOnDelete();
            $table->foreignId('doctor_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('work_schedule_id')->nullable()
                ->constrained('work_schedules')->nullOnDelete();
            $table->boolean('unlinked_shift')->default(false);

            $table->string('status', 32)->default('dang_kham');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();

            // Du lieu chuyen mon - DR66/DR67.
            $table->text('chief_complaint')->nullable();
            $table->text('symptoms')->nullable();
            $table->text('clinical_findings')->nullable();
            $table->text('diagnosis')->nullable();
            $table->text('clinical_notes')->nullable();
            $table->text('treatment_outcome')->nullable();
            $table->text('conclusion')->nullable();

            // De xuat tai kham (A2).
            $table->date('recall_date')->nullable();
            $table->string('recall_note', 500)->nullable();

            // Note + lock fields.
            $table->text('completion_note')->nullable();
            $table->string('lock_reason', 500)->nullable();
            $table->timestamp('locked_at')->nullable();
            $table->foreignId('locked_by')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->string('last_edit_reason', 500)->nullable();

            // Audit fields (DR79/DR80).
            $table->foreignId('created_by')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->foreignId('completed_by')->nullable()
                ->constrained('users')->nullOnDelete();

            $table->timestamps();

            $table->index(['patient_id', 'started_at']);
            $table->index(['doctor_id', 'status']);
            $table->index('status');
            $table->index('appointment_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('examination_sessions');
    }
};
