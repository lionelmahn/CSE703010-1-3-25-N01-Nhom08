<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * UC7 - Bang lich su trang thai & action cua lich hen (AC17, AC12).
 *
 * Moi action created/updated/rescheduled/cancelled (+ tuong lai assign /
 * check-in / start / complete / no-show) deu ghi 1 row.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointment_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained('appointments')->cascadeOnDelete();
            $table->string('action', 32);
            $table->string('from_status', 32)->nullable();
            $table->string('to_status', 32)->nullable();
            $table->text('reason')->nullable();
            $table->json('metadata')->nullable();
            $table->foreignId('actor_id')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->string('actor_name', 191)->nullable();
            $table->timestamp('created_at')->nullable();

            $table->index('action');
            $table->index('to_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointment_status_histories');
    }
};
