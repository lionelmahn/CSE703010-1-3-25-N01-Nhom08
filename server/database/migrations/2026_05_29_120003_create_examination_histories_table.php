<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * UC12 - Bang `examination_histories` (DR81 + audit).
 *
 * Luu lai moi thao tac transition: start, save_draft, update, complete,
 * lock, unlock, recall, add_service, update_service, remove_service,
 * tooth_chart_update.
 *
 * Khong sua / xoa - chi insert.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('examination_histories')) {
            return;
        }

        Schema::create('examination_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('examination_id')
                ->constrained('examination_sessions')
                ->cascadeOnDelete();
            $table->string('action', 64);
            $table->foreignId('actor_id')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->string('actor_name', 191)->nullable();
            $table->json('before')->nullable();
            $table->json('after')->nullable();
            $table->string('reason', 500)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['examination_id', 'created_at']);
            $table->index('action');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('examination_histories');
    }
};
