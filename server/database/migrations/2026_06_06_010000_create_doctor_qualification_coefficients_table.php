<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doctor_qualification_coefficients', function (Blueprint $table) {
            $table->id();
            $table->string('code', 32)->unique();
            $table->foreignId('qualification_catalog_id')
                ->constrained('qualification_catalogs', indexName: 'dqc_catalog_fk')
                ->restrictOnDelete();
            $table->string('qualification_code', 64);
            $table->string('qualification_name', 150);
            $table->enum('qualification_type', ['degree', 'academic_title']);
            $table->unsignedSmallInteger('priority')->default(99);
            $table->decimal('coefficient', 4, 2);
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

            $table->index(
                ['qualification_code', 'qualification_type', 'status', 'effective_from'],
                'doctor_qualification_lookup'
            );
            $table->index(['effective_from', 'effective_to'], 'doctor_qualification_effective_range');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctor_qualification_coefficients');
    }
};
