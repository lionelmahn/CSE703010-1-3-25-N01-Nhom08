<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const SNAPSHOT_FK = 'esi_service_complexity_fk';

    public function up(): void
    {
        if (! Schema::hasTable('service_complexity_coefficients')) {
            Schema::create('service_complexity_coefficients', function (Blueprint $table) {
                $table->id();
                $table->string('code', 32)->unique();
                $table->foreignId('service_id')->constrained('services')->restrictOnDelete();
                $table->string('processing_level', 32);
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

                $table->index(['service_id', 'processing_level', 'status', 'effective_from'], 'svc_complexity_lookup');
                $table->index(['effective_from', 'effective_to'], 'svc_complexity_effective_range');
            });
        }

        if (Schema::hasTable('examination_service_items')) {
            if (! Schema::hasColumn('examination_service_items', 'service_complexity_coefficient_id')) {
                Schema::table('examination_service_items', function (Blueprint $table) {
                    $table->unsignedBigInteger('service_complexity_coefficient_id')
                        ->nullable()
                        ->after('complexity_coefficient');
                });
            }

            if (! $this->foreignKeyExists('examination_service_items', self::SNAPSHOT_FK)) {
                Schema::table('examination_service_items', function (Blueprint $table) {
                    $table->foreign('service_complexity_coefficient_id', self::SNAPSHOT_FK)
                        ->references('id')
                        ->on('service_complexity_coefficients')
                        ->nullOnDelete();
                });
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('examination_service_items', 'service_complexity_coefficient_id')) {
            Schema::table('examination_service_items', function (Blueprint $table) {
                if ($this->foreignKeyExists('examination_service_items', self::SNAPSHOT_FK)) {
                    $table->dropForeign(self::SNAPSHOT_FK);
                }

                $table->dropColumn('service_complexity_coefficient_id');
            });
        }

        Schema::dropIfExists('service_complexity_coefficients');
    }

    private function foreignKeyExists(string $table, string $name): bool
    {
        if (! in_array(DB::getDriverName(), ['mysql', 'mariadb'], true)) {
            return false;
        }

        $database = DB::getDatabaseName();

        return DB::table('information_schema.table_constraints')
            ->where('table_schema', $database)
            ->where('table_name', $table)
            ->where('constraint_type', 'FOREIGN KEY')
            ->where('constraint_name', $name)
            ->exists();
    }
};
