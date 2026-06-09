<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\DoctorQualificationCoefficient;
use App\Models\QualificationCatalog;
use App\Models\SalarySlip;
use App\Models\Staff;
use App\Models\User;
use App\Models\WorkSchedule;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * UC17 - Bao cao tien luong tat ca bac si trong mot thang.
 *
 * Lop bao cao DOC tren UC16: gom phieu luong (`salary_slips`) + ca lam
 * (`work_schedules`) cho moi bac si trong ky. KHONG sua du lieu tinh luong goc
 * (BR "UC17 chi phuc vu bao cao"); chi cho drill-down va lap/tinh lai hang loat
 * (uy quyen sang UC16 `SalarySlipService`).
 *
 * Anh xa trang thai (UC16 hien chi co 4 trang thai thuc):
 *   not_created        -> bac si co ca lam nhung chua co phieu
 *   calculated/needs_recalculate (/draft) -> tam tinh (chua chot)
 *   finalized          -> da chot (tinh vao tong quy luong chinh thuc)
 */
class SalaryReportService
{
    private const BUSINESS_TIMEZONE = 'Asia/Ho_Chi_Minh';

    public const STATUS_NOT_CREATED = 'not_created';

    /** Trang thai phieu chua chot (tam tinh). */
    private const UNFINALIZED_STATUSES = [
        SalarySlip::STATUS_DRAFT,
        SalarySlip::STATUS_CALCULATED,
        SalarySlip::STATUS_NEEDS_RECALCULATE,
    ];

    public function __construct(
        private readonly SalarySlipService $salarySlips,
        private readonly DoctorQualificationCoefficientService $doctorCoefficients,
        private readonly AuditLogService $auditLog,
    ) {
    }

    /**
     * Du lieu cho cac bo loc tren UI.
     *
     * @return array<string,mixed>
     */
    public function options(): array
    {
        return [
            'branches' => Branch::query()
                ->where('status', 'active')
                ->orderBy('name')
                ->get(['id', 'code', 'name']),
            'qualifications' => QualificationCatalog::query()
                ->where('status', QualificationCatalog::STATUS_ACTIVE)
                ->orderBy('priority')
                ->get(['id', 'code', 'name', 'type']),
            'statuses' => [
                ['value' => self::STATUS_NOT_CREATED, 'label' => 'Chưa lập phiếu'],
                ['value' => SalarySlip::STATUS_CALCULATED, 'label' => 'Đã tính'],
                ['value' => SalarySlip::STATUS_NEEDS_RECALCULATE, 'label' => 'Cần tính lại'],
                ['value' => SalarySlip::STATUS_FINALIZED, 'label' => 'Đã chốt'],
            ],
        ];
    }

    /**
     * KPI tong quan ky bao cao (DR182-189). Tinh tren toan bo bac si trong pham
     * vi loc chi nhanh/hoc ham (khong ap bo loc hien thi cua bang).
     *
     * @param  array<string,mixed>  $filters
     * @return array<string,mixed>
     */
    public function summary(int $month, int $year, array $filters): array
    {
        $rows = $this->buildDataset($month, $year, $filters);

        $slipRows = array_filter($rows, fn ($r) => $r['status'] !== self::STATUS_NOT_CREATED);
        $finalizedRows = array_filter($rows, fn ($r) => $r['status'] === SalarySlip::STATUS_FINALIZED);
        $unfinalizedRows = array_filter(
            $rows,
            fn ($r) => in_array($r['status'], self::UNFINALIZED_STATUSES, true)
        );
        $missingRows = array_filter($rows, fn ($r) => $r['status'] === self::STATUS_NOT_CREATED);

        $sum = fn (iterable $set, string $key) => round(array_sum(array_map(
            fn ($r) => (float) ($r[$key] ?? 0),
            is_array($set) ? $set : iterator_to_array($set)
        )), 2);

        $finalizedCount = count($finalizedRows);
        $unfinalizedCount = count($unfinalizedRows);
        $missingCount = count($missingRows);
        $slipCount = count($slipRows);

        return [
            'period' => ['month' => $month, 'year' => $year],
            // Tong quy luong chinh thuc - chi phieu da chot (AC3/DR182/VR4).
            'total_payroll_official' => $sum($finalizedRows, 'total_amount'),
            // Tong tam tinh - gom ca phieu chua chot.
            'total_payroll_provisional' => $sum($slipRows, 'total_amount'),
            'doctors_total' => count($rows),
            'doctors_with_salary' => $slipCount,
            'finalized_count' => $finalizedCount,
            'unfinalized_count' => $unfinalizedCount,
            'doctors_without_slip' => $missingCount,
            'total_shifts' => (int) array_sum(array_map(fn ($r) => (int) ($r['total_shifts'] ?? 0), $rows)),
            'total_shift_hours' => $sum($rows, 'total_shift_hours'),
            'total_converted_hours' => $sum($slipRows, 'total_converted_hours'),
            'total_patient_coefficient' => $sum($slipRows, 'total_patient_coefficient'),
            // VR7/UI8 - co phieu chua chot => du lieu tam tinh.
            'is_provisional' => $unfinalizedCount > 0,
            'report_state' => $this->reportState($missingCount, $unfinalizedCount, $slipCount),
        ];
    }

    /**
     * Bang du lieu tung bac si (co phan trang) - DR190-201.
     *
     * @param  array<string,mixed>  $filters
     * @return array<string,mixed>
     */
    public function rows(int $month, int $year, array $filters): array
    {
        $rows = $this->applyDisplayFilters($this->buildDataset($month, $year, $filters), $filters);

        $perPage = max(1, min(100, (int) ($filters['per_page'] ?? 20)));
        $page = max(1, (int) ($filters['page'] ?? 1));
        $total = count($rows);
        $lastPage = (int) max(1, ceil($total / $perPage));
        $slice = array_slice($rows, ($page - 1) * $perPage, $perPage);

        return [
            'data' => array_values($slice),
            'meta' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => $lastPage,
            ],
        ];
    }

    /**
     * Du lieu xuat file (CSV/XLSX/PDF). Tra ve toan bo dong (khong phan trang).
     *
     * @param  array<string,mixed>  $filters
     * @return array<string,mixed>
     */
    public function exportPayload(int $month, int $year, array $filters): array
    {
        $rows = $this->applyDisplayFilters($this->buildDataset($month, $year, $filters), $filters);
        $period = sprintf('%02d/%d', $month, $year);

        $headers = [
            'STT', 'Mã bác sĩ', 'Họ và tên', 'Chi nhánh', 'Học hàm/Học vị',
            'Hệ số bác sĩ', 'Số ca', 'Giờ làm', 'Giờ quy đổi', 'Hệ số BN',
            'Lương (VNĐ)', 'Trạng thái',
        ];

        $dataRows = [];
        foreach ($rows as $i => $row) {
            $dataRows[] = [
                $i + 1,
                $row['employee_code'],
                $row['full_name'],
                $row['branch_name'] ?? '',
                $row['qualification_name'] ?? '',
                $row['doctor_coefficient'] !== null ? $this->num($row['doctor_coefficient']) : '--',
                $row['total_shifts'],
                $this->num($row['total_shift_hours']),
                $row['total_converted_hours'] !== null ? $this->num($row['total_converted_hours']) : '--',
                $row['total_patient_coefficient'] !== null ? $this->num($row['total_patient_coefficient']) : '--',
                $row['total_amount'] !== null ? $this->num($row['total_amount']) : '--',
                $this->statusLabel($row['status']),
            ];
        }

        return [
            'period' => $period,
            'summary' => $this->summary($month, $year, $filters),
            'headers' => $headers,
            'rows' => $dataRows,
            'records' => $rows,
            'basename' => 'bao-cao-luong-'.$year.sprintf('%02d', $month).'-'.now()->format('His'),
        ];
    }

    /**
     * Lap phieu luong hang loat cho cac bac si chua co phieu (A5/UI11).
     * Moi bac si xu ly doc lap; khong fail ca lo khi 1 nguoi loi.
     *
     * @param  array<int,int>  $staffIds
     * @return array<string,mixed>
     */
    public function bulkCreate(array $staffIds, int $month, int $year, ?User $actor): array
    {
        $results = [];
        foreach (array_unique($staffIds) as $staffId) {
            $staffId = (int) $staffId;
            $staff = Staff::query()->find($staffId);
            $name = $staff?->full_name ?? ('#'.$staffId);

            if ($this->existingSlip($staffId, $month, $year)) {
                $results[] = $this->result($staffId, $name, 'skipped', 'Đã có phiếu lương trong kỳ này.');

                continue;
            }

            try {
                $slip = $this->salarySlips->createOrCalculate([
                    'staff_id' => $staffId,
                    'period_month' => $month,
                    'period_year' => $year,
                ], $actor);

                $results[] = $this->result(
                    $staffId,
                    $name,
                    'created',
                    'Đã lập phiếu '.$slip->code.'.',
                    (float) $slip->total_amount
                );
            } catch (\Throwable $e) {
                $results[] = $this->result($staffId, $name, 'failed', $this->errorMessage($e));
            }
        }

        $this->auditLog->log($actor, 'report.salary.bulk_created', [
            'period' => sprintf('%02d/%d', $month, $year),
            'requested' => count($staffIds),
            'created' => count(array_filter($results, fn ($r) => $r['status'] === 'created')),
        ]);

        return ['results' => $results, 'summary' => $this->bulkSummary($results)];
    }

    /**
     * Tinh lai phieu luong hang loat (chi phieu chua chot) - A5/SR7.
     *
     * @param  array<int,int>  $staffIds
     * @return array<string,mixed>
     */
    public function bulkRecalculate(array $staffIds, int $month, int $year, ?User $actor): array
    {
        $results = [];
        foreach (array_unique($staffIds) as $staffId) {
            $staffId = (int) $staffId;
            $staff = Staff::query()->find($staffId);
            $name = $staff?->full_name ?? ('#'.$staffId);
            $slip = $this->existingSlip($staffId, $month, $year);

            if (! $slip) {
                $results[] = $this->result($staffId, $name, 'skipped', 'Chưa có phiếu lương để tính lại.');

                continue;
            }

            if ($slip->isFinalized()) {
                $results[] = $this->result($staffId, $name, 'skipped', 'Phiếu đã chốt, không tính lại hàng loạt.');

                continue;
            }

            try {
                $updated = $this->salarySlips->recalculate($slip->id, $actor);
                $results[] = $this->result(
                    $staffId,
                    $name,
                    'recalculated',
                    'Đã tính lại phiếu '.$updated->code.'.',
                    (float) $updated->total_amount
                );
            } catch (\Throwable $e) {
                $results[] = $this->result($staffId, $name, 'failed', $this->errorMessage($e));
            }
        }

        $this->auditLog->log($actor, 'report.salary.bulk_recalculated', [
            'period' => sprintf('%02d/%d', $month, $year),
            'requested' => count($staffIds),
            'recalculated' => count(array_filter($results, fn ($r) => $r['status'] === 'recalculated')),
        ]);

        return ['results' => $results, 'summary' => $this->bulkSummary($results)];
    }

    public function logExport(?User $actor, int $month, int $year, array $filters, string $format, int $rowCount): void
    {
        $this->auditLog->log($actor, 'report.salary.exported', [
            'period' => sprintf('%02d/%d', $month, $year),
            'format' => $format,
            'filters' => $filters,
            'row_count' => $rowCount,
        ]);
    }

    /**
     * Xay dung tap du lieu day du (1 dong/bac si) trong pham vi loc chi
     * nhanh/hoc ham. Day la nguon chung cho summary/rows/export.
     *
     * @param  array<string,mixed>  $filters
     * @return array<int,array<string,mixed>>
     */
    private function buildDataset(int $month, int $year, array $filters): array
    {
        [$start, $end] = $this->monthBounds($month, $year);

        // 1. Vu tru bac si (ap bo loc chi nhanh tai query).
        $doctorQuery = Staff::query()
            ->where('role_slug', 'bac_si')
            ->where('status', 'working')
            ->whereNotNull('user_id')
            ->with('branch:id,name');

        if (! empty($filters['branch_id'])) {
            $doctorQuery->where('branch_id', (int) $filters['branch_id']);
        }

        /** @var Collection<int,Staff> $doctors */
        $doctors = $doctorQuery->orderBy('full_name')->get();
        $staffIds = $doctors->pluck('id')->all();

        if (empty($staffIds)) {
            return [];
        }

        // 2. Phieu luong ky nay theo staff_id.
        $slips = SalarySlip::query()
            ->whereIn('staff_id', $staffIds)
            ->where('period_month', $month)
            ->where('period_year', $year)
            ->where('slip_type', SalarySlip::TYPE_MAIN)
            ->with(['creator:id,name', 'finalizer:id,name'])
            ->get()
            ->keyBy('staff_id');

        // 3. Ca lam ACTIVE trong ky -> so ca + tong gio (durationHours PHP).
        $shiftAgg = [];
        WorkSchedule::query()
            ->whereIn('staff_id', $staffIds)
            ->whereIn('status', WorkSchedule::ACTIVE_STATUSES)
            ->whereBetween('work_date', [$start->toDateString(), $end->toDateString()])
            ->get(['id', 'staff_id', 'start_time', 'end_time', 'work_date'])
            ->each(function (WorkSchedule $s) use (&$shiftAgg) {
                $agg = $shiftAgg[$s->staff_id] ?? ['count' => 0, 'hours' => 0.0];
                $hours = $s->durationHours();
                $agg['count']++;
                $agg['hours'] += $hours > 0 ? $hours : 0.0;
                $shiftAgg[$s->staff_id] = $agg;
            });

        $qualificationFilter = $filters['qualification_code'] ?? null;

        $rows = [];
        foreach ($doctors as $doctor) {
            /** @var SalarySlip|null $slip */
            $slip = $slips->get($doctor->id);
            $agg = $shiftAgg[$doctor->id] ?? ['count' => 0, 'hours' => 0.0];

            // BR: chi liet ke bac si co phieu HOAC co ca lam trong ky.
            if (! $slip && $agg['count'] === 0) {
                continue;
            }

            if ($slip) {
                $qualCode = $slip->qualification_code_snapshot;
                $qualName = $slip->qualification_name_snapshot;
                $doctorCoef = $slip->doctor_coefficient_snapshot !== null
                    ? round((float) $slip->doctor_coefficient_snapshot, 2)
                    : null;
            } else {
                [$qualCode, $qualName, $doctorCoef] = $this->resolveQualification($doctor, $end);
            }

            // Loc hoc ham/hoc vi (pham vi summary + bang).
            if ($qualificationFilter && $qualCode !== $qualificationFilter) {
                continue;
            }

            $rows[] = [
                'staff_id' => $doctor->id,
                'employee_code' => $doctor->employee_code,
                'full_name' => $doctor->full_name,
                'avatar' => $doctor->avatar,
                'branch_id' => $doctor->branch_id,
                'branch_name' => $doctor->branch?->name,
                'qualification_code' => $qualCode,
                'qualification_name' => $qualName,
                'doctor_coefficient' => $doctorCoef,
                'total_shifts' => $slip ? (int) $slip->total_shifts : $agg['count'],
                'total_shift_hours' => $slip ? (float) $slip->total_shift_hours : round($agg['hours'], 2),
                'total_converted_hours' => $slip ? (float) $slip->total_converted_hours : null,
                'total_patient_coefficient' => $slip ? (float) $slip->total_patient_coefficient : null,
                'total_amount' => $slip ? (float) $slip->total_amount : null,
                'status' => $slip ? $slip->status : self::STATUS_NOT_CREATED,
                'payroll_id' => $slip?->id,
                'payroll_code' => $slip?->code,
                'calculated_at' => $slip?->calculated_at,
                'finalized_at' => $slip?->finalized_at,
                'created_by_name' => $slip?->creator?->name,
                'finalized_by_name' => $slip?->finalizer?->name,
            ];
        }

        return $rows;
    }

    /**
     * Bo loc chi tac dong len bang (khong len KPI): q, trang thai, checkbox.
     *
     * @param  array<int,array<string,mixed>>  $rows
     * @param  array<string,mixed>  $filters
     * @return array<int,array<string,mixed>>
     */
    private function applyDisplayFilters(array $rows, array $filters): array
    {
        $q = isset($filters['q']) ? mb_strtolower(trim((string) $filters['q'])) : '';
        $status = $filters['status'] ?? null;
        $onlyFinalized = filter_var($filters['only_finalized'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $onlyMissing = filter_var($filters['only_missing'] ?? false, FILTER_VALIDATE_BOOLEAN);

        return array_values(array_filter($rows, function ($row) use ($q, $status, $onlyFinalized, $onlyMissing) {
            if ($q !== '') {
                $haystack = mb_strtolower($row['full_name'].' '.$row['employee_code']);
                if (! str_contains($haystack, $q)) {
                    return false;
                }
            }
            if ($status && $status !== 'all' && $row['status'] !== $status) {
                return false;
            }
            if ($onlyFinalized && $row['status'] !== SalarySlip::STATUS_FINALIZED) {
                return false;
            }
            if ($onlyMissing && $row['status'] !== self::STATUS_NOT_CREATED) {
                return false;
            }

            return true;
        }));
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

    private function existingSlip(int $staffId, int $month, int $year): ?SalarySlip
    {
        return SalarySlip::query()
            ->where('staff_id', $staffId)
            ->where('period_month', $month)
            ->where('period_year', $year)
            ->where('slip_type', SalarySlip::TYPE_MAIN)
            ->first();
    }

    private function reportState(int $missing, int $unfinalized, int $slipCount): string
    {
        if ($slipCount === 0 && $missing === 0) {
            return 'empty';
        }
        if ($missing > 0) {
            return 'incomplete'; // SR1 - Chua lap du phieu
        }
        if ($unfinalized > 0) {
            return 'reviewing'; // SR2 - Dang kiem tra
        }

        return 'finalized'; // SR3 - Da chot du
    }

    /**
     * @return array<string,mixed>
     */
    private function result(int $staffId, string $name, string $status, string $message, ?float $total = null): array
    {
        return [
            'staff_id' => $staffId,
            'full_name' => $name,
            'status' => $status,
            'message' => $message,
            'total_amount' => $total,
        ];
    }

    /**
     * @param  array<int,array<string,mixed>>  $results
     * @return array<string,int>
     */
    private function bulkSummary(array $results): array
    {
        $summary = ['created' => 0, 'recalculated' => 0, 'skipped' => 0, 'failed' => 0];
        foreach ($results as $r) {
            $summary[$r['status']] = ($summary[$r['status']] ?? 0) + 1;
        }

        return $summary;
    }

    private function errorMessage(\Throwable $e): string
    {
        if ($e instanceof \Illuminate\Validation\ValidationException) {
            $messages = collect($e->errors())->flatten()->all();

            return implode(' ', $messages) ?: $e->getMessage();
        }

        return $e->getMessage();
    }

    private function statusLabel(string $status): string
    {
        return match ($status) {
            self::STATUS_NOT_CREATED => 'Chưa lập phiếu',
            SalarySlip::STATUS_DRAFT => 'Bản nháp',
            SalarySlip::STATUS_CALCULATED => 'Đã tính',
            SalarySlip::STATUS_NEEDS_RECALCULATE => 'Cần tính lại',
            SalarySlip::STATUS_FINALIZED => 'Đã chốt',
            default => $status,
        };
    }

    private function num(float $value): string
    {
        return number_format($value, 2, '.', '');
    }

    /**
     * @return array{0:Carbon,1:Carbon}
     */
    private function monthBounds(int $month, int $year): array
    {
        $start = Carbon::create($year, $month, 1, 0, 0, 0, self::BUSINESS_TIMEZONE)->startOfMonth();

        return [$start, $start->copy()->endOfMonth()];
    }
}
