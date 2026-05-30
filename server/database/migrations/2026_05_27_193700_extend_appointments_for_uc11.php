<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * UC11 - Mo rong bang appointments cho luong check-in.
 *
 * Bo sung cot phuc vu DR49-DR51 (nguoi/thoi gian/co thoi gian den), snapshot
 * trang thai truoc check-in (SR4 restore khi huy check-in) va cac cot ghi
 * nhan no-show / cancel check-in.
 *
 * Migration them cot, KHONG drop cot cu de tuong thich UC7/UC8.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            if (! Schema::hasColumn('appointments', 'checked_in_at')) {
                $table->timestamp('checked_in_at')->nullable()->after('rescheduled_at');
            }
            if (! Schema::hasColumn('appointments', 'checked_in_by')) {
                $table->foreignId('checked_in_by')->nullable()
                    ->after('checked_in_at')
                    ->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('appointments', 'arrival_flag')) {
                $table->string('arrival_flag', 16)->nullable()->after('checked_in_by');
            }
            if (! Schema::hasColumn('appointments', 'pre_checkin_status')) {
                $table->string('pre_checkin_status', 32)->nullable()->after('arrival_flag');
            }
            if (! Schema::hasColumn('appointments', 'no_show_at')) {
                $table->timestamp('no_show_at')->nullable()->after('pre_checkin_status');
            }
            if (! Schema::hasColumn('appointments', 'no_show_by')) {
                $table->foreignId('no_show_by')->nullable()
                    ->after('no_show_at')
                    ->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('appointments', 'no_show_reason')) {
                $table->string('no_show_reason', 191)->nullable()->after('no_show_by');
            }
            if (! Schema::hasColumn('appointments', 'check_in_cancelled_at')) {
                $table->timestamp('check_in_cancelled_at')->nullable()->after('no_show_reason');
            }
            if (! Schema::hasColumn('appointments', 'check_in_cancelled_by')) {
                $table->foreignId('check_in_cancelled_by')->nullable()
                    ->after('check_in_cancelled_at')
                    ->constrained('users')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            foreach ([
                'checked_in_by',
                'no_show_by',
                'check_in_cancelled_by',
            ] as $fk) {
                if (Schema::hasColumn('appointments', $fk)) {
                    $table->dropForeign([$fk]);
                }
            }
            foreach ([
                'checked_in_at',
                'checked_in_by',
                'arrival_flag',
                'pre_checkin_status',
                'no_show_at',
                'no_show_by',
                'no_show_reason',
                'check_in_cancelled_at',
                'check_in_cancelled_by',
            ] as $col) {
                if (Schema::hasColumn('appointments', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
