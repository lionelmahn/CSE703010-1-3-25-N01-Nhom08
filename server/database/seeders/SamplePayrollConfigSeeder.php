<?php

namespace Database\Seeders;

use App\Models\BaseHourlyRate;
use App\Models\DoctorQualificationCoefficient;
use App\Models\QualificationCatalog;
use App\Models\Service;
use App\Models\ServiceComplexityCoefficient;
use App\Models\ShiftCoefficient;
use Database\Seeders\Support\SampleData;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Du lieu mau cau hinh luong UC15.1-15.4 (mau "SMP").
 *
 * Seed de UC16 tinh ra luong khac 0:
 *  - 1 muc tien/gio dang ap dung
 *  - ma tran he so ca (ngay thuong/T7/CN x sang/chieu/toi)
 *  - he so phuc tap theo dich vu + muc xu ly
 *  - he so bac si theo hoc ham/hoc vi
 *
 * Idempotent: updateOrCreate theo code (ma co tien to SMP de tranh dung dung
 * du lieu nguoi dung tu tao tren UI).
 */
class SamplePayrollConfigSeeder extends Seeder
{
    public function run(): void
    {
        // Hieu luc tu dau cua so ~2 nam => tinh luong ra so khac 0 cho MOI thang
        // trong cua so (phuc vu bao cao luong theo nam UC18/UC19).
        $effectiveFrom = SampleData::windowStart();

        $this->seedHourlyRate($effectiveFrom);
        $this->seedShiftCoefficients($effectiveFrom);
        $this->seedServiceComplexity($effectiveFrom);
        $this->seedDoctorQualificationCoefficients($effectiveFrom);
    }

    private function seedHourlyRate(Carbon $effectiveFrom): void
    {
        BaseHourlyRate::firstOrCreate(
            ['effective_from' => $effectiveFrom],
            [
                'hourly_rate' => 200000,
                'currency' => 'VND',
                'effective_to' => null,
                'status' => 'active',
                'note' => 'Muc tien co ban/gio - du lieu mau SMP.',
            ]
        );
    }

    private function seedShiftCoefficients(Carbon $effectiveFrom): void
    {
        // [day_type][shift_type] => coefficient (1.00 - 2.00).
        $matrix = [
            'weekday' => ['morning' => 1.00, 'afternoon' => 1.10, 'evening' => 1.30],
            'saturday' => ['morning' => 1.50, 'afternoon' => 1.60, 'evening' => 1.80],
            'sunday' => ['morning' => 1.80, 'afternoon' => 1.90, 'evening' => 2.00],
        ];

        $dayLabel = ['weekday' => 'Ngay thuong', 'saturday' => 'Thu 7', 'sunday' => 'Chu nhat'];
        $shiftLabel = ['morning' => 'ca sang', 'afternoon' => 'ca chieu', 'evening' => 'ca toi'];

        foreach ($matrix as $dayType => $shifts) {
            foreach ($shifts as $shiftType => $coefficient) {
                ShiftCoefficient::updateOrCreate(
                    ['code' => "SCF-SMP-{$dayType}-{$shiftType}"],
                    [
                        'name' => "{$dayLabel[$dayType]} - {$shiftLabel[$shiftType]}",
                        'day_type' => $dayType,
                        'shift_type' => $shiftType,
                        'coefficient' => $coefficient,
                        'effective_from' => $effectiveFrom,
                        'effective_to' => null,
                        'status' => 'active',
                        'note' => 'He so ca - du lieu mau SMP.',
                    ]
                );
            }
        }
    }

    private function seedServiceComplexity(Carbon $effectiveFrom): void
    {
        $levels = ['kho' => 0.20, 'phuc_tap' => 0.40, 'rat_phuc_tap' => 0.50];

        $services = Service::query()
            ->where('status', Service::STATUS_ACTIVE)
            ->orderBy('id')
            ->limit(20)
            ->get(['id']);

        foreach ($services as $service) {
            foreach ($levels as $level => $coefficient) {
                ServiceComplexityCoefficient::updateOrCreate(
                    ['code' => "SCX-SMP-{$service->id}-{$level}"],
                    [
                        'service_id' => $service->id,
                        'processing_level' => $level,
                        'coefficient' => $coefficient,
                        'effective_from' => $effectiveFrom,
                        'effective_to' => null,
                        'status' => 'active',
                        'note' => 'He so phuc tap - du lieu mau SMP.',
                    ]
                );
            }
        }
    }

    private function seedDoctorQualificationCoefficients(Carbon $effectiveFrom): void
    {
        $coefByCode = [
            'giao_su' => 2.50,
            'pho_giao_su' => 2.00,
            'tien_si' => 1.70,
            'thac_si' => 1.50,
            'dai_hoc' => 1.30,
        ];

        $catalogs = QualificationCatalog::query()
            ->whereIn('code', array_keys($coefByCode))
            ->get();

        foreach ($catalogs as $catalog) {
            DoctorQualificationCoefficient::updateOrCreate(
                ['code' => "DQC-SMP-{$catalog->code}"],
                [
                    'qualification_catalog_id' => $catalog->id,
                    'qualification_code' => $catalog->code,
                    'qualification_name' => $catalog->name,
                    'qualification_type' => $catalog->type,
                    'priority' => $catalog->priority,
                    'coefficient' => $coefByCode[$catalog->code],
                    'effective_from' => $effectiveFrom,
                    'effective_to' => null,
                    'status' => 'active',
                    'note' => 'He so bac si - du lieu mau SMP.',
                ]
            );
        }
    }
}
