<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * UC12 - Bang `examination_tooth_chart` (DR68).
 *
 * Map cap (examination_id, tooth_fdi) -> tooth_status_id + note.
 *
 * tooth_fdi su dung he so quoc te FDI 2 chu so: 11..18, 21..28, 31..38,
 * 41..48 (32 rang vinh vien). Cot string de FE truyen "11" hoac "16".
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('examination_tooth_chart')) {
            return;
        }

        Schema::create('examination_tooth_chart', function (Blueprint $table) {
            $table->id();
            $table->foreignId('examination_id')
                ->constrained('examination_sessions')
                ->cascadeOnDelete();
            $table->string('tooth_fdi', 4);
            $table->foreignId('tooth_status_id')->nullable()
                ->constrained('tooth_statuses')->nullOnDelete();
            $table->string('note', 255)->nullable();
            $table->timestamps();

            $table->unique(['examination_id', 'tooth_fdi']);
            $table->index('tooth_status_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('examination_tooth_chart');
    }
};
