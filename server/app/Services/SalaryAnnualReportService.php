<?php

namespace App\Services;

use App\Models\DoctorQualificationCoefficient;
use App\Models\SalarySlip;
use App\Models\Staff;
use App\Models\User;
use App\Models\WorkSchedule;
use Carbon\Carbon;

/**
 * UC18 - Bao cao tien luong cua mot bac si trong mot nam.
 *
 * La "transpose" cua UC17: thay vi "1 thang x N bac si" thi la "1 bac si x 12
 * thang", doc cung nguon (`salary_slips` + `work_schedules` + `staff`). Chi
 * phuc vu bao cao (read-only) - moi thao tac lap/tinh/chot van o UC16.
 *
 * Anh xa trang thai tung thang (UC16 hien chi co 4 trang thai thuc):
 *   no_shifts          -> khong co ca lam & khong co phieu (Chua phat sinh)
 *   not_created        -> co ca lam nhung chua co phieu (Chua lap phieu)
 *   calculated/needs_recalculate (/draft) -> tam tinh (chua chot)
 *   finalized          -> da chot (tinh vao tong luong nam chinh thuc)
 *
 * Trang thai "Da dieu chinh"/"Da huy"/"Cho kiem tra" trong spec chua ton tai o
 * UC16 (da defer) nen SR4 duoc gop vao `reviewing` qua `needs_recalculate`.
 */
class SalaryAnnualReportService
{
    private const BUSINESS_TIMEZONE = 'Asia/Ho_Chi_Minh';

    /** Thang co ca lam nhung chua lap phieu. */
    public const STATUS_NOT_CREATED = 'not_created';

    /** Thang khong co ca lam va khong co phieu. */
    public const STATUS_NO_SHIFTS = 'no_shifts';

    /** Trang thai phieu chua chot (tam tinh). */
    private const UNFINALIZED_STATUSES = [
        SalarySlip::STATUS_DRAFT,
        SalarySlip::STATUS_CALCULATED,
        SalarySlip::STATUS_NEEDS_RECALCULATE,
    ];

    public function __construct(
        private readonly DoctorQualificationCoefficientService $doctorCoefficients,
        private readonly AuditLogService $auditLog,
    ) {
    }

    /**
     * Du lieu cho cac bo loc tren UI (trang thai + danh sach nam).
     *
     * @return array<string,mixed>
     */
    public function options(): array
    {
        $current = (int) Carbon::now(self::BUSINESS_TIMEZONE)->year;

        return [
            'statuses' => [
                ['value' => self::STATUS_NO_SHIFTS, 'label' => 'Chưa phát sinh'],
                ['value' => self::STATUS_NOT_CREATED, 'label' => 'Chưa lập phiếu'],
                ['value' => SalarySlip::STATUS_CALCULATED, 'label' => 'Đã tính'],
                ['value' => SalarySlip::STATUS_NEEDS_RECALCULATE, 'label' => 'Cần tính lại'],
                ['value' => SalarySlip::STATUS_FINALIZED, 'label' => 'Đã chốt'],
            ],
            'years' => range($current, $current - 5),
        ];
    }

    /**
     * Tim bac si (Staff role_slug=bac_si) phuc vu kiem tra E1/scoping o controller.
     */
    public function findDoctor(int $staffId): ?Staff
    {
        return Staff::query()
            ->where('id', $staffId)
            ->where('role_slug', 'bac_si')
            ->first();
    }

    /**
     * KPI tong quan nam (DR208-216 / UI4).
     *
     * @param  array<string,mixed>  $filters
     * @return array<string,mixed>
     */
    public function summary(int $staffId, int $year, array $filters): array
    {
        $dataset = $this->buildDataset($staffId, $year);
        $months = $dataset['months'];

        $withSlip = array_filter($months, fn ($m) => ! in_array(
            $m['status'],
            [self::STATUS_NOT_CREATED, self::STATUS_NO_SHIFTS],
            true
        ));
        $finalized = array_filter($months, fn ($m) => $m['status'] === SalarySlip::STATUS_FINALIZED);
        $unfinalized = array_filter($months, fn ($m) => in_array($m['status'], self::UNFINALIZED_STATUSES, true));
        $notCreated = array_filter($months, fn ($m) => $m['status'] === self::STATUS_NOT_CREATED);

        $sum = fn (iterable $set, string $key) => round(array_sum(array_map(
            fn ($m) => (float) ($m[$key] ?? 0),
            is_array($set) ? $set : iterator_to_array($set)
        )), 2);

        $withSlipCount = count($withSlip);
        $unfinalizedCount = count($unfinalized);
        $notCreatedCount = count($notCreated);

        return [
            'year' => $year,
            'doctor' => $dataset['doctor'],
            // Tong luong nam chinh thuc - chi phieu da chot (DR208/VR5).
            'total_payroll_official' => $sum($finalized, 'total_amount'),
            // Tong tam tinh - gom ca phieu chua chot.
            'total_payroll_provisional' => $sum($withSlip, 'total_amount'),
            'months_with_slip' => $withSlipCount,
            'months_finalized' => count($finalized),
            'months_unfinalized' => $unfinalizedCount,
            'months_not_created' => $notCreatedCount,
            'total_shifts' => (int) array_sum(array_map(fn ($m) => (int) ($m['total_shifts'] ?? 0), $months)),
            'total_shift_hours' => $sum($months, 'total_shift_hours'),
            'total_converted_hours' => $sum($withSlip, 'total_converted_hours'),
            'total_patient_coefficient' => $sum($withSlip, 'total_patient_coefficient'),
            // VR8/UI9 - co phieu chua chot => du lieu tam tinh.
            'is_provisional' => $unfinalizedCount > 0,
            'report_state' => $this->reportState($notCreatedCount, $unfinalizedCount, $withSlipCount),
        ];
    }

    /**
     * Bang du lieu 12 thang trong nam (UI5). Mac dinh tra du 12 thang; chi loc
     * theo trang thai khi nguoi dung chon (DR204).
     *
     * @param  array<string,mixed>  $filters
     * @return array<int,array<string,mixed>>
     */
    public function months(int $staffId, int $year, array $filters): array
    {
        return $this->applyStatusFilter($this->buildDataset($staffId, $year)['months'], $filters);
    }

    /**
     * Du lieu xuat file (CSV/XLSX/PDF) theo bo loc hien tai.
     *
     * @param  array<string,mixed>  $filters
     * @return array<string,mixed>
     */
    public function exportPayload(int $staffId, int $year, array $filters): array
    {
        $summary = $this->summary($staffId, $year, $filters);
        $months = $this->applyStatusFilter($this->buildDataset($staffId, $year)['months'], $filters);
        $doctor = $summary['doctor'];

        $headers = [
            'Tháng', 'Mã phiếu', 'Số ca', 'Giờ làm', 'Giờ quy đổi', 'Hệ số BN',
            'Lương (VNĐ)', 'Trạng thái',
        ];

        $dataRows = [];
        foreach ($months as $row) {
            $dataRows[] = [
                sprintf('%02d/%d', $row['month'], $row['year']),
                $row['payroll_code'] ?? '--',
                $row['total_shifts'],
                $this->num($row['total_shift_hours']),
                $row['total_converted_hours'] !== null ? $this->num($row['total_converted_hours']) : '--',
                $row['total_patient_coefficient'] !== null ? $this->num($row['total_patient_coefficient']) : '--',
                $row['total_amount'] !== null ? $this->num($row['total_amount']) : '--',
                $this->statusLabel($row['status']),
            ];
        }

        $code = $doctor['employee_code'] ?? 'BS';

        return [
            'year' => $year,
            'doctor' => $doctor,
            'summary' => $summary,
            'headers' => $headers,
            'rows' => $dataRows,
            'records' => $months,
            'basename' => 'bao-cao-luong-nam-'.$code.'-'.$year.'-'.now()->format('His'),
        ];
    }

    public function logView(?User $actor, int $staffId, int $year): void
    {
        $this->auditLog->log($actor, 'report.salary_annual.viewed', [
            'staff_id' => $staffId,
            'year' => $year,
        ]);
    }

    public function logExport(?User $actor, int $staffId, int $year, array $filters, string $format, int $rowCount): void
    {
        $this->auditLog->log($actor, 'report.salary_annual.exported', [
            'staff_id' => $staffId,
            'year' => $year,
            'format' => $format,
            'filters' => $filters,
            'row_count' => $rowCount,
        ]);
    }

    /**
     * Xay dung tap du lieu: thong tin bac si + 12 dong thang. Chi 2 query
     * (phieu luong + ca lam) cho ca nam de tranh N+1.
     *
     * @return array{doctor:array<string,mixed>|null,months:array<int,array<string,mixed>>}
     */
    private function buildDataset(int $staffId, int $year): array
    {
        [$start, $end] = $this->yearBounds($year);

        /** @var Staff|null $staff */
        $staff = Staff::query()->with('branch:id,name')->find($staffId);
        if (! $staff) {
            return ['doctor' => null, 'months' => $this->emptyMonths($year)];
        }

        // 1. Phieu luong trong nam theo staff_id, key theo thang.
        $slips = SalarySlip::query()
            ->where('staff_id', $staffId)
            ->where('period_year', $year)
            ->where('slip_type', SalarySlip::TYPE_MAIN)
            ->with(['creator:id,name', 'finalizer:id,name'])
            ->get()
            ->keyBy('period_month');

        // 2. Ca lam ACTIVE trong nam -> so ca + tong gio gom theo thang.
        $shiftAgg = [];
        WorkSchedule::query()
            ->where('staff_id', $staffId)
            ->whereIn('status', WorkSchedule::ACTIVE_STATUSES)
            ->whereBetween('work_date', [$start->toDateString(), $end->toDateString()])
            ->get(['id', 'start_time', 'end_time', 'work_date'])
            ->each(function (WorkSchedule $s) use (&$shiftAgg) {
                $month = Carbon::parse($s->work_date)->month;
                $agg = $shiftAgg[$month] ?? ['count' => 0, 'hours' => 0.0];
                $hours = $s->durationHours();
                $agg['count']++;
                $agg['hours'] += $hours > 0 ? $hours : 0.0;
                $shiftAgg[$month] = $agg;
            });

        $months = [];
        for ($m = 1; $m <= 12; $m++) {
            /** @var SalarySlip|null $slip */
            $slip = $slips->get($m);
            $agg = $shiftAgg[$m] ?? ['count' => 0, 'hours' => 0.0];

            if ($slip) {
                $status = $slip->status;
            } elseif ($agg['count'] > 0) {
                $status = self::STATUS_NOT_CREATED;
            } else {
                $status = self::STATUS_NO_SHIFTS;
            }

            $months[] = [
                'month' => $m,
                'year' => $year,
                'status' => $status,
                'total_shifts' => $slip ? (int) $slip->total_shifts : $agg['count'],
                'total_shift_hours' => $slip ? (float) $slip->total_shift_hours : round($agg['hours'], 2),
                'total_converted_hours' => $slip ? (float) $slip->total_converted_hours : null,
                'total_patient_coefficient' => $slip ? (float) $slip->total_patient_coefficient : null,
                'total_amount' => $slip ? (float) $slip->total_amount : null,
                'payroll_id' => $slip?->id,
                'payroll_code' => $slip?->code,
                'calculated_at' => $slip?->calculated_at,
                'finalized_at' => $slip?->finalized_at,
                'created_by_name' => $slip?->creator?->name,
                'finalized_by_name' => $slip?->finalizer?->name,
            ];
        }

        /** @var SalarySlip|null $latestSlip */
        $latestSlip = $slips->sortByDesc('period_month')->first();

        return [
            'doctor' => $this->doctorInfo($staff, $latestSlip, $end),
            'months' => $months,
        ];
    }

    /**
     * Loc theo trang thai (DR204). Khong loc khi trong/'all' -> giu du 12 thang.
     *
     * @param  array<int,array<string,mixed>>  $months
     * @param  array<string,mixed>  $filters
     * @return array<int,array<string,mixed>>
     */
    private function applyStatusFilter(array $months, array $filters): array
    {
        $status = $filters['status'] ?? null;
        if (! $status || $status === 'all') {
            return $months;
        }

        return array_values(array_filter($months, fn ($m) => $m['status'] === $status));
    }

    /**
     * Thong tin nhan dien bac si tren bao cao (DR205-207 / UI3). Uu tien snapshot
     * tu phieu moi nhat trong nam, fallback ho so nhan su tai cuoi nam.
     *
     * @return array<string,mixed>
     */
    private function doctorInfo(Staff $staff, ?SalarySlip $latestSlip, Carbon $end): array
    {
        if ($latestSlip && $latestSlip->qualification_code_snapshot) {
            $qualCode = $latestSlip->qualification_code_snapshot;
            $qualName = $latestSlip->qualification_name_snapshot;
            $doctorCoef = $latestSlip->doctor_coefficient_snapshot !== null
                ? round((float) $latestSlip->doctor_coefficient_snapshot, 2)
                : null;
        } else {
            [$qualCode, $qualName, $doctorCoef] = $this->resolveQualification($staff, $end);
        }

        // Hoc ham + hoc vi ket hop tu ho so nhan su (DR207). Fallback qual name.
        $academic = $this->doctorCoefficients->academicForStaff($staff);

        return [
            'staff_id' => $staff->id,
            'employee_code' => $staff->employee_code,
            'full_name' => $staff->full_name,
            'branch_name' => $staff->branch?->name,
            'specialty' => $staff->major,
            'hire_date' => $staff->join_date?->toDateString(),
            'qualification_code' => $qualCode,
            'qualification_name' => $qualName,
            'academic_title' => $academic['academic_title'],
            'degree' => $academic['degree'],
            'academic_display' => $academic['display'] ?? $qualName,
            'doctor_coefficient' => $doctorCoef,
        ];
    }

    /**
     * @return array{0:?string,1:?string,2:?float}
     */
    private function resolveQualification(Staff $staff, Carbon $end): array
    {
        $resolution = $this->doctorCoefficients->resolveForStaff($staff, $end, null, false);
        $code = $resolution['qualification_code'] ?? null;
        $name = $code
            ? (DoctorQualificationCoefficient::qualificationByCode($code)['name'] ?? null)
            : null;
        $coefficient = isset($resolution['coefficient'])
            ? round((float) $resolution['coefficient'], 2)
            : null;

        return [$code, $name, $coefficient];
    }

    private function reportState(int $notCreated, int $unfinalized, int $withSlip): string
    {
        if ($withSlip === 0 && $notCreated === 0) {
            return 'empty';
        }
        if ($notCreated > 0) {
            return 'incomplete'; // SR1 - Chua lap du phieu trong nam
        }
        if ($unfinalized > 0) {
            return 'reviewing'; // SR2 - Dang kiem tra (gom ca needs_recalculate ~ SR4)
        }

        return 'finalized'; // SR3 - Da chot du
    }

    private function statusLabel(string $status): string
    {
        return match ($status) {
            self::STATUS_NO_SHIFTS => 'Chưa phát sinh',
            self::STATUS_NOT_CREATED => 'Chưa lập phiếu',
            SalarySlip::STATUS_DRAFT => 'Bản nháp',
            SalarySlip::STATUS_CALCULATED => 'Đã tính',
            SalarySlip::STATUS_NEEDS_RECALCULATE => 'Cần tính lại',
            SalarySlip::STATUS_FINALIZED => 'Đã chốt',
            default => $status,
        };
    }

    /**
     * 12 thang rong (khi khong tim thay bac si) - giu cau truc dong nhat.
     *
     * @return array<int,array<string,mixed>>
     */
    private function emptyMonths(int $year): array
    {
        $months = [];
        for ($m = 1; $m <= 12; $m++) {
            $months[] = [
                'month' => $m,
                'year' => $year,
                'status' => self::STATUS_NO_SHIFTS,
                'total_shifts' => 0,
                'total_shift_hours' => 0.0,
                'total_converted_hours' => null,
                'total_patient_coefficient' => null,
                'total_amount' => null,
                'payroll_id' => null,
                'payroll_code' => null,
                'calculated_at' => null,
                'finalized_at' => null,
                'created_by_name' => null,
                'finalized_by_name' => null,
            ];
        }

        return $months;
    }

    private function num(float $value): string
    {
        return number_format($value, 2, '.', '');
    }

    /**
     * @return array{0:Carbon,1:Carbon}
     */
    private function yearBounds(int $year): array
    {
        $start = Carbon::create($year, 1, 1, 0, 0, 0, self::BUSINESS_TIMEZONE)->startOfYear();

        return [$start, $start->copy()->endOfYear()];
    }
}
