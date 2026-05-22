<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->string('code', 32)->unique();

            $table->foreignId('online_booking_request_id')->nullable()
                ->constrained('online_booking_requests')->nullOnDelete();
            $table->foreignId('patient_id')->nullable()
                ->constrained('patients')->nullOnDelete();

            $table->date('appointment_date');
            $table->string('time_slot', 64);

            $table->json('service_ids')->nullable();
            $table->string('branch_id', 64)->nullable()->index();

            // BR-12 / AC18 - lich vua tao chua co bac si.
            $table->string('status', 32)->default('cho_phan_cong_bac_si')->index();

            $table->foreignId('assigned_doctor_id')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->nullable()
                ->constrained('users')->nullOnDelete();

            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index(['appointment_date', 'time_slot']);
        });

        // Bo sung FK appointment_id sau khi appointments ton tai.
        Schema::table('online_booking_requests', function (Blueprint $table) {
            $table->foreign('appointment_id')
                ->references('id')->on('appointments')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('online_booking_requests', function (Blueprint $table) {
            $table->dropForeign(['appointment_id']);
        });
        Schema::dropIfExists('appointments');
    }
};
