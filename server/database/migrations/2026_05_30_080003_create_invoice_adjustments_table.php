<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * UC13 - Bang `invoice_adjustments` luu but toan dieu chinh sau khi
 * invoice da chot (giam/cong them); KHONG sua truc tiep `invoices`.
 *
 * Type:
 *  - positive: tang `invoice.total` (vd: phu thu thay rang khac vi tri)
 *  - negative: giam `invoice.total` (vd: tra phong / mien giam)
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('invoice_adjustments')) {
            return;
        }

        Schema::create('invoice_adjustments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('invoices')->cascadeOnDelete();
            $table->string('type', 16); // positive | negative
            $table->decimal('amount', 15, 2);
            $table->string('reason', 255);
            $table->text('note')->nullable();
            $table->foreignId('created_by')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('invoice_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_adjustments');
    }
};
