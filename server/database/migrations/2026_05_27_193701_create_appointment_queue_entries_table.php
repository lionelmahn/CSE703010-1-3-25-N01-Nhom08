<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * UC11 - Bang hang cho kham (DR52, DR53).
 *
 * Moi appointment khi check-in se tao 1 row "active" (bucket waiting /
 * unassigned / ready / in_progress). Khi cancel-checkin hoac no-show se
 * chuyen bucket sang `cancelled`. Bac si bat dau kham (UC3.2 tuong lai)
 * se chuyen sang `in_progress` va `completed`.
 *
 * Code (W0001...) reset per branch per day.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointment_queue_entries', function (Blueprint $table) {
            $table->id();
            $table->string('code', 16);
            $table->foreignId('appointment_id')->constrained('appointments')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('assigned_doctor_id')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->string('branch_id', 64)->nullable();
            $table->string('bucket', 16)->default('waiting');
            $table->unsignedSmallInteger('queue_number')->nullable();
            $table->timestamp('entered_at');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->foreignId('created_by')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['branch_id', 'bucket', 'entered_at']);
            $table->index(['assigned_doctor_id', 'bucket']);
            $table->index(['appointment_id', 'bucket']);
            $table->unique(['code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointment_queue_entries');
    }
};
