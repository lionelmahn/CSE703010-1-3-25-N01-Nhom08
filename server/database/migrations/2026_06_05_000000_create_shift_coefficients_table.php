<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shift_coefficients', function (Blueprint $table) {
            $table->id();
            $table->string('code', 32)->unique();
            $table->string('name', 150);
            $table->enum('day_type', [
                'weekday',
                'saturday',
                'sunday',
                'holiday',
            ]);
            $table->enum('shift_type', ['morning', 'afternoon', 'evening', 'custom']);
            $table->decimal('coefficient', 5, 2);
            $table->dateTime('effective_from');
            $table->dateTime('effective_to')->nullable();
            $table->enum('status', ['upcoming', 'active', 'expired', 'stopped'])->default('upcoming');
            $table->string('change_reason', 100)->nullable();
            $table->string('note', 500)->nullable();
            $table->string('stop_reason', 100)->nullable();
            $table->string('stop_reason_detail', 255)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('stopped_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('stopped_at')->nullable();
            $table->timestamps();

            $table->index(['day_type', 'shift_type', 'status', 'effective_from'], 'shift_coefficients_lookup');
            $table->index(['effective_from', 'effective_to'], 'shift_coefficients_effective_range');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shift_coefficients');
    }
};
