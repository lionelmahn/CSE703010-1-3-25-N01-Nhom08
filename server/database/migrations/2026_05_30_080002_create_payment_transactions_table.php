<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * UC13 - Bang `payment_transactions` (DR103-107).
 *
 * Mot bang chung cho ca thu (`type=payment`) va hoan (`type=refund`).
 * Khong xoa cung (VR11): chi danh dau `voided_at/voided_by/voided_reason`.
 *
 * `code` format PT-YYYY-XXXXXX, sequence reset theo nam, sinh trong
 * `PaymentTransaction::generateCode` voi `lockForUpdate`.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('payment_transactions')) {
            return;
        }

        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('code', 32)->unique();
            $table->foreignId('invoice_id')->constrained('invoices')->cascadeOnDelete();
            $table->string('type', 16)->default('payment'); // payment | refund
            $table->string('method', 32);                   // cash | bank_transfer | card
            $table->decimal('amount', 15, 2);
            $table->string('reference_code', 100)->nullable();
            $table->text('note')->nullable();
            $table->foreignId('paid_by')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->dateTime('paid_at');
            $table->string('account_info', 255)->nullable();
            $table->dateTime('voided_at')->nullable();
            $table->foreignId('voided_by')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->string('voided_reason', 255)->nullable();
            $table->timestamps();

            $table->index(['invoice_id', 'type']);
            $table->index('paid_at');
            $table->index(['method', 'paid_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
    }
};
