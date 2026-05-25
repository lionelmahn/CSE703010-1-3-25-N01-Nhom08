<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('app_notifications', function (Blueprint $table) {
            $table->id();
            $table->string('code', 32)->unique();
            $table->string('type', 64)->index();
            $table->string('channel', 16)->default('email')->index();
            $table->string('status', 16)->default('pending');
            $table->string('source', 16)->default('auto_event');
            $table->foreignId('online_booking_request_id')->nullable()
                ->constrained('online_booking_requests')->nullOnDelete();
            $table->foreignId('appointment_id')->nullable()
                ->constrained('appointments')->nullOnDelete();
            $table->foreignId('patient_id')->nullable()
                ->constrained('patients')->nullOnDelete();
            $table->string('recipient_name', 150);
            $table->string('recipient_email', 191);
            $table->foreignId('template_id')->nullable()
                ->constrained('app_notification_templates')->nullOnDelete();
            $table->string('template_code', 64);
            $table->string('subject', 255)->nullable();
            $table->longText('body_html')->nullable();
            $table->longText('body_text')->nullable();
            $table->json('render_context')->nullable();
            $table->dateTime('scheduled_send_at')->nullable();
            $table->dateTime('sent_at')->nullable();
            $table->foreignId('sent_by_user_id')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->string('error_code', 64)->nullable();
            $table->text('error_message')->nullable();
            $table->unsignedTinyInteger('retry_count')->default(0);
            $table->unsignedTinyInteger('manual_resend_count')->default(0);
            $table->foreignId('parent_notification_id')->nullable()
                ->constrained('app_notifications')->nullOnDelete();
            $table->string('dedup_key', 120)->nullable()->index();
            $table->timestamps();

            $table->index(['status', 'scheduled_send_at']);
            $table->index(['appointment_id', 'type']);
            $table->index(['online_booking_request_id', 'type']);
            $table->index('parent_notification_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_notifications');
    }
};
