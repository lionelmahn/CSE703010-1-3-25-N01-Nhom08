<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            if (! Schema::hasColumn('patients', 'email')) {
                $table->string('email')->nullable()->index()->after('phone');
            }
            if (! Schema::hasColumn('patients', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('address');
            }
            if (! Schema::hasColumn('patients', 'last_visit_at')) {
                $table->timestamp('last_visit_at')->nullable()->after('is_active');
            }
        });
    }

    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            if (Schema::hasColumn('patients', 'last_visit_at')) {
                $table->dropColumn('last_visit_at');
            }
            if (Schema::hasColumn('patients', 'is_active')) {
                $table->dropColumn('is_active');
            }
            if (Schema::hasColumn('patients', 'email')) {
                $table->dropColumn('email');
            }
        });
    }
};
