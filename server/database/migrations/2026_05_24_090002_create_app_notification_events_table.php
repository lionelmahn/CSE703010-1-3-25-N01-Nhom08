<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('app_notification_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('notification_id')
                ->constrained('app_notifications')->cascadeOnDelete();
            $table->string('event', 32);
            $table->foreignId('actor_id')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->string('actor_name', 150)->nullable();
            $table->string('error_code', 64)->nullable();
            $table->text('error_message')->nullable();
            $table->json('metadata')->nullable();
            $table->dateTime('created_at')->useCurrent();

            $table->index(['notification_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_notification_events');
    }
};
