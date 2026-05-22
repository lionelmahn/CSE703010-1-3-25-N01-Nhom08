<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('online_booking_requests', function (Blueprint $table) {
            $table->id();
            $table->string('code', 32)->unique();

            // Snapshot khach hang submit (frontend co the chua co patient_id).
            $table->string('name', 150);
            $table->string('phone', 32)->index();
            $table->string('email', 191)->nullable()->index();
            $table->string('need', 64)->nullable();
            $table->json('service_ids')->nullable();
            $table->string('branch_id', 64)->nullable()->index();
            $table->date('preferred_date')->nullable()->index();
            $table->string('preferred_time_slot', 64)->nullable();
            $table->text('customer_note')->nullable();

            // Le tan + admin chi noi noi bo.
            $table->text('internal_note')->nullable();

            // Trang thai workflow UC6.2 (SR1-SR10).
            $table->string('status', 32)->default('cho_xu_ly')->index();

            // Link sang patient + appointment khi xu ly.
            $table->foreignId('patient_id')->nullable()
                ->constrained('patients')->nullOnDelete();
            $table->foreignId('appointment_id')->nullable();

            // Tracking xu ly.
            $table->foreignId('processed_by')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->timestamp('processed_at')->nullable();

            // Email log noi tom luc voi FE.
            $table->string('email_status', 32)->default('none');

            // Submit metadata.
            $table->string('source', 64)->default('landing_page');
            $table->timestamp('submitted_at')->nullable();
            $table->string('device', 191)->nullable();
            $table->string('ip', 45)->nullable();

            // Khung gio de xuat khi tu choi khung khach.
            $table->json('proposed_slots')->nullable();

            $table->text('reject_reason')->nullable();

            $table->timestamps();

            $table->index(['status', 'submitted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('online_booking_requests');
    }
};
