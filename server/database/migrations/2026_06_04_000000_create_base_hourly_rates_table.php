<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('base_hourly_rates', function (Blueprint $table) {
            $table->id();
            $table->decimal('hourly_rate', 15, 2);
            $table->string('currency', 3)->default('VND');
            $table->dateTime('effective_from');
            $table->dateTime('effective_to')->nullable();
            $table->enum('status', ['upcoming', 'active', 'expired', 'stopped'])->default('upcoming');
            $table->string('note', 500)->nullable();
            $table->string('stop_reason', 100)->nullable();
            $table->string('stop_reason_detail', 255)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('stopped_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('stopped_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'effective_from']);
            $table->index(['effective_from', 'effective_to'], 'base_hourly_rates_effective_range');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('base_hourly_rates');
    }
};
