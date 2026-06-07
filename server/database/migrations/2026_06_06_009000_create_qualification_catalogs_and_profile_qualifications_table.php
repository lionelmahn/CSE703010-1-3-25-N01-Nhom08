<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('qualification_catalogs', function (Blueprint $table) {
            $table->id();
            $table->string('code', 64)->unique();
            $table->string('name', 150);
            $table->enum('type', ['degree', 'academic_title']);
            $table->unsignedSmallInteger('priority')->default(99);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('professional_profile_qualifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('professional_profile_id')
                ->constrained('professional_profiles', indexName: 'ppq_profile_fk')
                ->cascadeOnDelete();
            $table->foreignId('qualification_catalog_id')
                ->constrained('qualification_catalogs', indexName: 'ppq_catalog_fk')
                ->restrictOnDelete();
            $table->string('source', 40)->default('manual');
            $table->timestamps();

            $table->unique(['professional_profile_id', 'qualification_catalog_id'], 'ppq_profile_catalog_unique');
            $table->index(['qualification_catalog_id', 'source'], 'ppq_catalog_source_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('professional_profile_qualifications');
        Schema::dropIfExists('qualification_catalogs');
    }
};
