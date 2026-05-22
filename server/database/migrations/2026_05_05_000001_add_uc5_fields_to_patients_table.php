<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * UC5 - Quan ly ho so benh nhan.
 *
 * Bo sung cac truong dac ta yeu cau: CCCD, trang thai tu/inactive/merged,
 * tham chieu ho so chinh khi gop, nguon tiep nhan, audit columns created_by /
 * updated_by, va ly do tao trung (BR cho phep tao trung neu co quyen + ly do).
 *
 * Vi BR cho phep nhieu ho so co cung so dien thoai (sau khi le tan xac nhan
 * la khach hang khac), unique index tren `phone` duoc thay bang index thuong.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            if (! Schema::hasColumn('patients', 'id_number')) {
                $table->string('id_number', 32)->nullable()->after('email');
            }
            if (! Schema::hasColumn('patients', 'source')) {
                $table->string('source', 64)->nullable()->after('id_number');
            }
            if (! Schema::hasColumn('patients', 'occupation')) {
                $table->string('occupation', 100)->nullable()->after('address');
            }
            if (! Schema::hasColumn('patients', 'marital_status')) {
                $table->string('marital_status', 32)->nullable()->after('occupation');
            }
            if (! Schema::hasColumn('patients', 'allergies')) {
                $table->text('allergies')->nullable()->after('medical_history');
            }
            if (! Schema::hasColumn('patients', 'notes')) {
                $table->text('notes')->nullable()->after('allergies');
            }
            if (! Schema::hasColumn('patients', 'status')) {
                $table->string('status', 16)->default('active')->after('is_active');
            }
            if (! Schema::hasColumn('patients', 'merged_into_id')) {
                $table->unsignedBigInteger('merged_into_id')->nullable()->after('status');
            }
            if (! Schema::hasColumn('patients', 'deactivated_at')) {
                $table->timestamp('deactivated_at')->nullable()->after('merged_into_id');
            }
            if (! Schema::hasColumn('patients', 'deactivation_reason')) {
                $table->string('deactivation_reason', 255)->nullable()->after('deactivated_at');
            }
            if (! Schema::hasColumn('patients', 'merged_at')) {
                $table->timestamp('merged_at')->nullable()->after('deactivation_reason');
            }
            if (! Schema::hasColumn('patients', 'force_create_reason')) {
                $table->string('force_create_reason', 255)->nullable()->after('merged_at');
            }
            if (! Schema::hasColumn('patients', 'created_by')) {
                $table->unsignedBigInteger('created_by')->nullable()->after('force_create_reason');
            }
            if (! Schema::hasColumn('patients', 'updated_by')) {
                $table->unsignedBigInteger('updated_by')->nullable()->after('created_by');
            }
        });

        // Backfill: every existing row defaults to "active" (UC6.2 da khoi tao
        // patient voi is_active=true). Cac record cu khong co is_active thi
        // mac dinh la active.
        DB::statement("UPDATE patients SET status = 'active' WHERE status IS NULL OR status = ''");

        // Doi unique(phone) thanh index thuong. PR #11 da tao migration them
        // email/is_active/last_visit_at nen unique van con tu migration goc.
        $driver = Schema::getConnection()->getDriverName();
        try {
            if ($driver === 'mysql') {
                DB::statement('ALTER TABLE patients DROP INDEX patients_phone_unique');
            } elseif ($driver === 'sqlite') {
                // SQLite unique tu schema goc se duoc xoa khi xay lai bang;
                // bo qua an toan vi sqlite test environment thuong dung
                // migrate:fresh.
            }
        } catch (\Throwable $e) {
            // Index co the da bi xoa truoc do trong moi truong dev.
        }

        Schema::table('patients', function (Blueprint $table) {
            $table->index('phone', 'patients_phone_index');
            $table->index('id_number', 'patients_id_number_index');
            $table->index('status', 'patients_status_index');
            $table->index('source', 'patients_source_index');
            $table->foreign('merged_into_id', 'patients_merged_into_fk')
                ->references('id')->on('patients')->nullOnDelete();
            $table->foreign('created_by', 'patients_created_by_fk')
                ->references('id')->on('users')->nullOnDelete();
            $table->foreign('updated_by', 'patients_updated_by_fk')
                ->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            try {
                $table->dropForeign('patients_merged_into_fk');
            } catch (\Throwable $e) {
            }
            try {
                $table->dropForeign('patients_created_by_fk');
            } catch (\Throwable $e) {
            }
            try {
                $table->dropForeign('patients_updated_by_fk');
            } catch (\Throwable $e) {
            }
            try {
                $table->dropIndex('patients_phone_index');
            } catch (\Throwable $e) {
            }
            try {
                $table->dropIndex('patients_id_number_index');
            } catch (\Throwable $e) {
            }
            try {
                $table->dropIndex('patients_status_index');
            } catch (\Throwable $e) {
            }
            try {
                $table->dropIndex('patients_source_index');
            } catch (\Throwable $e) {
            }

            foreach ([
                'id_number', 'source', 'occupation', 'marital_status',
                'allergies', 'notes', 'status', 'merged_into_id',
                'deactivated_at', 'deactivation_reason', 'merged_at',
                'force_create_reason', 'created_by', 'updated_by',
            ] as $col) {
                if (Schema::hasColumn('patients', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        // Try to restore unique constraint on phone (best effort).
        try {
            Schema::table('patients', function (Blueprint $table) {
                $table->unique('phone');
            });
        } catch (\Throwable $e) {
        }
    }
};
