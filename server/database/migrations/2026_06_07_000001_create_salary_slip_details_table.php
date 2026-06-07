<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('salary_slip_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('salary_slip_id')->constrained('salary_slips')->cascadeOnDelete();
            $table->foreignId('work_schedule_id')->nullable()->constrained('work_schedules')->nullOnDelete();

            // Snapshot thong tin ca lam.
            $table->date('work_date');
            $table->string('shift_template_code', 32)->nullable();
            $table->string('shift_name', 150)->nullable();
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->decimal('shift_hours', 6, 2)->default(0);
            $table->string('day_type', 20)->nullable();
            $table->string('shift_type', 20)->nullable();

            // Cac he so cau thanh tien mot ca.
            $table->decimal('shift_coefficient', 5, 2)->default(0);
            $table->decimal('total_patient_coefficient', 8, 2)->default(0);
            $table->decimal('converted_hours', 10, 2)->default(0);
            $table->decimal('doctor_coefficient', 4, 2)->default(0);
            $table->decimal('hourly_rate', 15, 2)->default(0);
            $table->decimal('shift_amount', 15, 2)->default(0);

            // Danh sach phien kham + he so phuc tap da cong vao ca (truy vet UC12).
            $table->json('examination_breakdown')->nullable();
            $table->timestamps();

            $table->index('salary_slip_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('salary_slip_details');
    }
};
