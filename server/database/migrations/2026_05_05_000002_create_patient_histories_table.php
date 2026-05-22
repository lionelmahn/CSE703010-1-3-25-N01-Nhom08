<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * UC5 - Lich su thay doi & truy cap tren tung ho so benh nhan.
 *
 * Phuc vu tab "Lich su" trong panel chi tiet. Audit log toan he thong van
 * dung bang `audit_logs` (qua AuditLogService).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patient_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->string('action', 64);
            $table->unsignedBigInteger('actor_id')->nullable();
            $table->string('actor_name', 191)->nullable();
            $table->string('note', 500)->nullable();
            $table->json('before')->nullable();
            $table->json('after')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['patient_id', 'created_at']);
            $table->index('action');
            $table->foreign('actor_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_histories');
    }
};
