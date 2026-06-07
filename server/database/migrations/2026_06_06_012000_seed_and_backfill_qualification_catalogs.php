<?php

use App\Models\QualificationCatalog;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        $this->seedDefaultCatalogs();
        $this->backfillProfileQualifications();
        $this->backfillCoefficientCatalogIds();
    }

    public function down(): void
    {
        if (Schema::hasTable('professional_profile_qualifications')) {
            DB::table('professional_profile_qualifications')
                ->where('source', 'backfill')
                ->delete();
        }
    }

    private function seedDefaultCatalogs(): void
    {
        if (! Schema::hasTable('qualification_catalogs')) {
            return;
        }

        $now = now();
        foreach (QualificationCatalog::defaultRows() as $row) {
            $exists = DB::table('qualification_catalogs')
                ->where('code', $row['code'])
                ->exists();

            if ($exists) {
                DB::table('qualification_catalogs')
                    ->where('code', $row['code'])
                    ->update($row + ['updated_at' => $now]);
                continue;
            }

            DB::table('qualification_catalogs')->insert($row + [
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    private function backfillProfileQualifications(): void
    {
        if (! Schema::hasTable('professional_profile_qualifications')) {
            return;
        }

        $catalogIds = DB::table('qualification_catalogs')->pluck('id', 'code');
        $staffDegrees = DB::table('staff')->pluck('highest_degree', 'id');
        $specialtyDegrees = DB::table('professional_profile_specialties')
            ->select('professional_profile_id', 'degree')
            ->whereNotNull('degree')
            ->get()
            ->groupBy('professional_profile_id');

        DB::table('professional_profiles')
            ->select('id', 'staff_id', 'degree')
            ->orderBy('id')
            ->chunk(100, function ($profiles) use ($catalogIds, $staffDegrees, $specialtyDegrees) {
                foreach ($profiles as $profile) {
                    $codes = [];
                    $codes = array_merge($codes, $this->codesForLegacyValue($profile->degree));
                    $codes = array_merge($codes, $this->codesForLegacyValue($staffDegrees[$profile->staff_id] ?? null));

                    foreach ($specialtyDegrees[$profile->id] ?? [] as $specialty) {
                        $codes = array_merge($codes, $this->codesForLegacyValue($specialty->degree));
                    }

                    foreach (array_values(array_unique(array_filter($codes))) as $code) {
                        $catalogId = $catalogIds[$code] ?? null;
                        if (! $catalogId) {
                            continue;
                        }

                        DB::table('professional_profile_qualifications')->insertOrIgnore([
                            'professional_profile_id' => $profile->id,
                            'qualification_catalog_id' => $catalogId,
                            'source' => 'backfill',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            });
    }

    private function backfillCoefficientCatalogIds(): void
    {
        if (! Schema::hasTable('doctor_qualification_coefficients')
            || ! Schema::hasColumn('doctor_qualification_coefficients', 'qualification_catalog_id')) {
            return;
        }

        $catalogIds = DB::table('qualification_catalogs')->pluck('id', 'code');
        DB::table('doctor_qualification_coefficients')
            ->select('id', 'qualification_code')
            ->orderBy('id')
            ->chunkById(100, function ($records) use ($catalogIds) {
                foreach ($records as $record) {
                    $catalogId = $catalogIds[$record->qualification_code] ?? null;
                    if (! $catalogId) {
                        continue;
                    }

                    DB::table('doctor_qualification_coefficients')
                        ->where('id', $record->id)
                        ->update(['qualification_catalog_id' => $catalogId]);
                }
            });
    }

    /**
     * @return array<int,string>
     */
    private function codesForLegacyValue(?string $value): array
    {
        $value = trim((string) $value);
        if ($value === '') {
            return [];
        }

        $normalized = Str::slug($value, '_');

        return match ($normalized) {
            'giao_su', 'gs', 'gs_ts', 'gsts', 'giao_su_tien_si' => ['giao_su', 'tien_si'],
            'pho_giao_su', 'pgs', 'pgs_ts', 'pgsts', 'pho_giao_su_tien_si' => ['pho_giao_su', 'tien_si'],
            'tien_si', 'ts', 'bac_si_tien_si' => ['tien_si'],
            'thac_si', 'ths', 'thac_sy', 'thac_si_bac_si' => ['thac_si'],
            'dai_hoc', 'cu_nhan', 'bac_si', 'bac_sy', 'bs' => ['dai_hoc'],
            default => [],
        };
    }
};
