<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * UC7 - Mo rong bang appointments cho quan ly lich hen chinh thuc.
 *
 * Bo sung cac cot phuc vu DR6 (nguon), DR21 (ly do huy/doi), DR19/DR20
 * (nguoi/thoi gian cap nhat) va vai cot thoi diem ghi nhan cancel/reschedule.
 *
 * Migration them cot, KHONG drop cot cu de tuong thich UC6.2.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // DR6 - nguon lich hen (online | tai_quay | dien_thoai | tai_kham).
            if (! Schema::hasColumn('appointments', 'source')) {
                $table->string('source', 32)->default('tai_quay')->after('time_slot');
            }
            // DR21 - ly do huy/doi (lay tu Confirmation Dialog).
            if (! Schema::hasColumn('appointments', 'reschedule_reason')) {
                $table->text('reschedule_reason')->nullable()->after('notes');
            }
            if (! Schema::hasColumn('appointments', 'cancel_reason')) {
                $table->text('cancel_reason')->nullable()->after('reschedule_reason');
            }
            if (! Schema::hasColumn('appointments', 'cancelled_at')) {
                $table->timestamp('cancelled_at')->nullable()->after('cancel_reason');
            }
            if (! Schema::hasColumn('appointments', 'rescheduled_at')) {
                $table->timestamp('rescheduled_at')->nullable()->after('cancelled_at');
            }
            // DR19 - nguoi cap nhat moi nhat.
            if (! Schema::hasColumn('appointments', 'updated_by')) {
                $table->foreignId('updated_by')->nullable()
                    ->after('created_by')
                    ->constrained('users')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            if (Schema::hasColumn('appointments', 'updated_by')) {
                $table->dropForeign(['updated_by']);
                $table->dropColumn('updated_by');
            }
            foreach (['source', 'reschedule_reason', 'cancel_reason', 'cancelled_at', 'rescheduled_at'] as $col) {
                if (Schema::hasColumn('appointments', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
