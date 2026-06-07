<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('salary_slips', function (Blueprint $table) {
            $table->id();
            $table->string('code', 32)->unique();
            $table->foreignId('staff_id')->constrained('staff')->restrictOnDelete();
            $table->unsignedTinyInteger('period_month');
            $table->unsignedSmallInteger('period_year');
            // Loai phieu: 'main' = phieu luong chinh (UC16). Du chong cho ban dieu chinh sau (A5).
            $table->string('slip_type', 20)->default('main');

            // Snapshot thong tin bac si tai thoi diem tinh.
            $table->string('doctor_name_snapshot', 150)->nullable();
            $table->string('qualification_code_snapshot', 64)->nullable();
            $table->string('qualification_name_snapshot', 150)->nullable();
            $table->decimal('doctor_coefficient_snapshot', 4, 2)->nullable();
            $table->decimal('hourly_rate_snapshot', 15, 2)->nullable();

            // Tong hop ket qua tinh luong.
            $table->unsignedInteger('total_shifts')->default(0);
            $table->decimal('total_shift_hours', 8, 2)->default(0);
            $table->decimal('total_converted_hours', 10, 2)->default(0);
            $table->decimal('total_patient_coefficient', 8, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);

            $table->enum('status', ['draft', 'calculated', 'needs_recalculate', 'finalized'])->default('draft');
            // Snapshot toan bo du lieu tinh luong, ghi khi chot.
            $table->json('calculation_snapshot')->nullable();
            $table->string('note', 500)->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('calculated_at')->nullable();
            $table->foreignId('finalized_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('finalized_at')->nullable();
            $table->timestamps();

            // VR3 / DR160 - moi bac si chi co 1 phieu luong chinh trong mot ky.
            $table->unique(['staff_id', 'period_year', 'period_month', 'slip_type'], 'salary_slips_period_unique');
            $table->index(['status', 'period_year', 'period_month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('salary_slips');
    }
};
