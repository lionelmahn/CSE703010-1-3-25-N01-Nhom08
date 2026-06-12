<?php

namespace Database\Seeders;

use App\Models\SalarySlip;
use App\Models\Staff;
use App\Models\User;
use App\Services\SalarySlipService;
use Database\Seeders\Support\SampleData;
use Illuminate\Database\Seeder;
use Illuminate\Validation\ValidationException;

/**
 * Du lieu mau phieu luong (UC16) cho MOI bac si x MOI thang da ket thuc trong
 * cua so ~2 nam => co du lieu cho bao cao luong thang/nam (UC17/UC18/UC19).
 *
 * Tai su dung SalarySlipService de tinh dung quy tac nghiep vu.
 * Phan lon phieu duoc CHOT (finalized); thang gan nhat de o trang thai
 * calculated => phu du trang thai.
 *
 * Idempotent: bo qua neu da ton tai phieu chinh cho bac si + ky (VR3).
 */
class SampleSalarySlipSeeder extends Seeder
{
    public function run(): void
    {
        /** @var SalarySlipService $service */
        $service = app(SalarySlipService::class);
        $actor = User::where('username', 'admin')->first();

        $doctors = Staff::query()
            ->where('role_slug', 'bac_si')
            ->where('status', 'working')
            ->whereNotNull('user_id')
            ->get();
        if ($doctors->isEmpty()) {
            return;
        }

        // Cac thang da ket thuc (bo thang hien tai dang dien ra).
        $months = array_values(array_filter(
            SampleData::months(),
            fn (array $m) => ! $m['is_current']
        ));
        if (empty($months)) {
            return;
        }

        // Thang gan nhat -> de "calculated"; cac thang con lai -> "finalized".
        $latestKey = count($months) - 1;

        foreach ($doctors as $doctor) {
            foreach ($months as $idx => $m) {
                if (SalarySlip::query()
                    ->where('staff_id', $doctor->id)
                    ->where('period_year', $m['year'])
                    ->where('period_month', $m['month'])
                    ->where('slip_type', SalarySlip::TYPE_MAIN)
                    ->exists()
                ) {
                    continue;
                }

                try {
                    $slip = $service->createOrCalculate([
                        'staff_id' => $doctor->id,
                        'period_month' => $m['month'],
                        'period_year' => $m['year'],
                    ], $actor);
                } catch (ValidationException $e) {
                    continue; // bo qua ky khong tinh duoc (vd thieu cau hinh).
                }

                if ($idx !== $latestKey) {
                    try {
                        $service->finalize($slip->id, $actor);
                    } catch (ValidationException $e) {
                        // Con canh bao chan chot => giu o trang thai calculated.
                    }
                }
            }
        }
    }
}
