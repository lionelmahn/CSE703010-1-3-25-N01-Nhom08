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
use Illuminate\Support\Collection;

/**
 * UC19 - Bao cao tien luong cua TAT CA bac si trong mot nam.
 *
 * Bao cao tong hop cap cao nhat cua nhom bao cao luong - DOC tu phieu luong UC16
 * (`salary_slips`) + ca lam (`work_schedules`) + ho so nhan su (`staff`). La giao
 * cua UC17 (1 thang x N bac si) va UC18 (1 bac si x 12 thang): "N bac si x 12 thang".
 * Chi phuc vu bao cao (read-only) - moi thao tac lap/tinh/chot van o UC16.
 *
 * Ho tro 3 che do xem tu cung 1 dataset:
 *   - Theo bac si  (1 dong/bac si, roll-up ca nam) -> drill UC18
 *   - Theo thang   (12 dong thang, gom toan bo bac si) -> drill UC17
 *   - Ma tran      (B.si x 12 thang, tung o) -> drill UC16
 *
 * Anh xa trang thai tung thang (UC16 hien chi co 4 trang thai thuc):
 *   no_shifts          -> khong co ca lam & khong co phieu
 *   not_created        -> co ca lam nhung chua co phieu
 *   calculated/needs_recalculate (/draft) -> tam tinh (chua chot)
 *   finalized          -> da chot (tinh vao tong quy luong nam chinh thuc)
 */
class SalaryAnnualAllReportService
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
     * Du lieu cho cac bo loc tren UI (chi nhanh + hoc ham + trang thai + nam).
     *
     * @return array<string,mixed>
     */
    public function options(): array
    {
        $current = (int) Carbon::now(self::BUSINESS_TIMEZONE)->year;

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
            'years' => range($current, $current - 5),
        ];
    }

    /**
     * KPI tong quan nam toan bo bac si (DR231-239). Tinh tren pham vi loc chi
     * nhanh/hoc ham, KHONG ap bo loc hien thi (q/status) cua bang.
     *
     * @param  array<string,mixed>  $filters
     * @return array<string,mixed>
     */
    public function summary(int $year, array $filters): array
    {
        $entries = $this->buildDataset($year, $filters);
        $cells = $this->flatCells($entries);

        $withSlip = array_filter($cells, fn ($c) => $this->isSlip($c['status']));
        $finalized = array_filter($cells, fn ($c) => $c['status'] === SalarySlip::STATUS_FINALIZED);
        $unfinalized = array_filter($cells, fn ($c) => in_array($c['status'], self::UNFINALIZED_STATUSES, true));
        $notCreated = array_filter($cells, fn ($c) => $c['status'] === self::STATUS_NOT_CREATED);

        $doctorsWithSalary = count(array_filter(
            $entries,
            fn ($e) => $this->countWithSlip($e['months']) > 0
        ));

        $unfinalizedCount = count($unfinalized);
        $notCreatedCount = count($notCreated);
        $slipCount = count($withSlip);

        // Phan bo trang thai theo tung o (phuc vu bieu do + the canh bao).
        $byStatus = [
            SalarySlip::STATUS_FINALIZED => 0,
            SalarySlip::STATUS_CALCULATED => 0,
            SalarySlip::STATUS_DRAFT => 0,
            SalarySlip::STATUS_NEEDS_RECALCULATE => 0,
            self::STATUS_NOT_CREATED => 0,
            self::STATUS_NO_SHIFTS => 0,
        ];
        foreach ($cells as $c) {
            $byStatus[$c['status']] = ($byStatus[$c['status']] ?? 0) + 1;
        }

        return [
            'year' => $year,
            // Tong quy luong nam chinh thuc - chi phieu da chot (DR231/BR).
            'total_payroll_official' => $this->sum($finalized, 'total_amount'),
            // Tong tam tinh - gom ca phieu chua chot.
            'total_payroll_provisional' => $this->sum($withSlip, 'total_amount'),
            'doctors_total' => count($entries),
            'doctors_with_salary' => $doctorsWithSalary,          // DR232
            'total_slips' => $slipCount,                          // DR233
            'finalized_count' => count($finalized),               // DR234
            'unfinalized_count' => $unfinalizedCount,             // DR235
            'adjustment_required' => $byStatus[SalarySlip::STATUS_NEEDS_RECALCULATE], // phieu can tinh lai
            'doctor_months_not_created' => $notCreatedCount,      // DR236
            'total_shifts' => $this->sumInt($cells, 'total_shifts'),       // DR237
            'total_shift_hours' => $this->sum($cells, 'total_shift_hours'),
            'total_converted_hours' => $this->sum($withSlip, 'total_converted_hours'), // DR238
            'total_patient_coefficient' => $this->sum($withSlip, 'total_patient_coefficient'), // DR239
            'is_provisional' => $unfinalizedCount > 0,
            'report_state' => $this->reportState($notCreatedCount, $unfinalizedCount, $slipCount),
            // Du lieu cho bang phan tich (bieu do).
            'status_distribution' => [
                ['key' => 'finalized', 'label' => 'Đã chốt', 'count' => $byStatus[SalarySlip::STATUS_FINALIZED]],
                ['key' => 'under_review', 'label' => 'Chờ kiểm tra', 'count' => $byStatus[SalarySlip::STATUS_CALCULATED]],
                ['key' => 'draft', 'label' => 'Bản nháp', 'count' => $byStatus[SalarySlip::STATUS_DRAFT]],
                ['key' => 'adjusted', 'label' => 'Cần điều chỉnh', 'count' => $byStatus[SalarySlip::STATUS_NEEDS_RECALCULATE]],
                ['key' => 'missing', 'label' => 'Chưa lập phiếu', 'count' => $byStatus[self::STATUS_NOT_CREATED]],
                ['key' => 'no_activity', 'label' => 'Chưa phát sinh', 'count' => $byStatus[self::STATUS_NO_SHIFTS]],
            ],
            'monthly_series' => $this->monthlySeries($entries, $year),
            'top_doctors' => $this->topDoctors($entries),
            'missing_cases' => $this->missingCases($entries),
        ];
    }

    /**
     * Chuoi du lieu 12 thang: quy luong + ti le hoan thanh (% phieu da chot).
     *
     * @param  array<int,array<string,mixed>>  $entries
     * @return array<int,array<string,mixed>>
     */
    private function monthlySeries(array $entries, int $year): array
    {
        return array_map(function ($m) {
            $base = $m['finalized_count'] + $m['unfinalized_count'] + $m['doctors_not_created'];

            return [
                'month' => $m['month'],
                'fund' => $m['total_payroll_official'],
                'fund_provisional' => $m['total_payroll_provisional'],
                'completion' => $base > 0 ? round($m['finalized_count'] / $base * 100, 1) : 0.0,
            ];
        }, $this->buildMonthRows($entries, $year));
    }

    /**
     * Top 5 bac si theo tong luong nam da chot.
     *
     * @param  array<int,array<string,mixed>>  $entries
     * @return array<int,array<string,mixed>>
     */
    private function topDoctors(array $entries): array
    {
        $rows = array_map(function ($e) {
            $finalized = array_filter($e['months'], fn ($m) => $m['status'] === SalarySlip::STATUS_FINALIZED);

            return [
                'staff_id' => $e['staff_id'],
                'full_name' => $e['full_name'],
                'total_amount' => $this->sum($finalized, 'total_amount'),
            ];
        }, $entries);

        usort($rows, fn ($a, $b) => $b['total_amount'] <=> $a['total_amount']);

        return array_slice(array_values($rows), 0, 5);
    }

    /**
     * Cac truong hop B.si/thang co ca lam nhung chua lap phieu (A2/DR236).
     *
     * @param  array<int,array<string,mixed>>  $entries
     * @return array<int,array<string,mixed>>
     */
    private function missingCases(array $entries): array
    {
        $cases = [];
        foreach ($entries as $e) {
            foreach ($e['months'] as $m) {
                if ($m['status'] === self::STATUS_NOT_CREATED) {
                    $cases[] = [
                        'staff_id' => $e['staff_id'],
                        'full_name' => $e['full_name'],
                        'month' => $m['month'],
                        'shift_count' => $m['total_shifts'],
                    ];
                }
            }
        }

        return $cases;
    }

    /**
     * Bang "theo bac si" co phan trang (DR240-248). Ap bo loc hien thi (q/status)
     * o muc bac si: giu bac si neu co it nhat 1 thang khop trang thai duoc chon.
     *
     * @param  array<string,mixed>  $filters
     * @return array<string,mixed>
     */
    public function doctorRows(int $year, array $filters): array
    {
        $entries = $this->applyDoctorDisplayFilters($this->buildDataset($year, $filters), $filters);
        $rows = array_map(fn ($e) => $this->doctorRow($e), $entries);

        return $this->paginate($rows, $filters);
    }

    /**
     * Bang "theo thang" - du 12 dong (DR249-256), gom toan bo bac si moi thang.
     *
     * @param  array<string,mixed>  $filters
     * @return array<int,array<string,mixed>>
     */
    public function monthRows(int $year, array $filters): array
    {
        return $this->buildMonthRows($this->buildDataset($year, $filters), $year);
    }

    /**
     * Ma tran Bac si x 12 thang (DR257-260). Bac si phan trang; o chua payroll_id
     * de drill-down UC16. Kem month_totals lam dong tong duoi ma tran.
     *
     * @param  array<string,mixed>  $filters
     * @return array<string,mixed>
     */
    public function matrix(int $year, array $filters): array
    {
        $entries = $this->applyDoctorDisplayFilters($this->buildDataset($year, $filters), $filters);
        $monthTotals = $this->buildMonthRows($entries, $year);

        $paged = $this->paginate($entries, $filters);

        $doctors = [];
        $cells = [];
        foreach ($paged['data'] as $entry) {
            $doctors[] = [
                'staff_id' => $entry['staff_id'],
                'employee_code' => $entry['employee_code'],
                'full_name' => $entry['full_name'],
                'qualification_name' => $entry['qualification_name'],
                'doctor_coefficient' => $entry['doctor_coefficient'],
                'total_amount' => $this->sum(
                    array_filter($entry['months'], fn ($m) => $m['status'] === SalarySlip::STATUS_FINALIZED),
                    'total_amount'
                ),
            ];
            $byMonth = [];
            foreach ($entry['months'] as $m => $cell) {
                $byMonth[$m] = [
                    'status' => $cell['status'],
                    'total_amount' => $cell['total_amount'],
                    'payroll_id' => $cell['payroll_id'],
                    'payroll_code' => $cell['payroll_code'],
                ];
            }
            $cells[$entry['staff_id']] = $byMonth;
        }

        return [
            'doctors' => $doctors,
            'cells' => $cells,
            'month_totals' => $monthTotals,
            'meta' => $paged['meta'],
        ];
    }

    /**
     * Du lieu xuat file theo che do xem hien tai (view = doctor|month|matrix).
     *
     * @param  array<string,mixed>  $filters
     * @return array<string,mixed>
     */
    public function exportPayload(int $year, array $filters): array
    {
        $view = $filters['view'] ?? 'doctor';
        $summary = $this->summary($year, $filters);
        $entries = $this->applyDoctorDisplayFilters($this->buildDataset($year, $filters), $filters);

        [$headers, $rows] = match ($view) {
            'month' => $this->exportMonthView($entries, $year),
            'matrix' => $this->exportMatrixView($entries),
            default => $this->exportDoctorView($entries),
        };

        return [
            'year' => $year,
            'view' => $view,
            'summary' => $summary,
            'headers' => $headers,
            'rows' => $rows,
            'basename' => 'bao-cao-luong-nam-toan-bo-'.$year.'-'.now()->format('His'),
        ];
    }

    public function logView(?User $actor, int $year): void
    {
        $this->auditLog->log($actor, 'report.salary_annual_all.viewed', [
            'year' => $year,
        ]);
    }

    public function logExport(?User $actor, int $year, array $filters, string $format, int $rowCount): void
    {
        $this->auditLog->log($actor, 'report.salary_annual_all.exported', [
            'year' => $year,
            'format' => $format,
            'view' => $filters['view'] ?? 'doctor',
            'filters' => $filters,
            'row_count' => $rowCount,
        ]);
    }

    /**
     * Xay dung tap du lieu: 1 entry/bac si, moi entry co 12 dong thang. Chi 3
     * query cho ca nam (bac si + phieu + ca lam) de tranh N+1.
     *
     * Luu y hieu nang: bac si KHONG co phieu nhung CO ca lam phai resolve hoc
     * ham qua `resolveForStaff` (1 query/bac si). Quy mo phong kham (vai chuc
     * bac si) chap nhan duoc; co the cache/toi uu sau neu can.
     *
     * @param  array<string,mixed>  $filters
     * @return array<int,array<string,mixed>>
     */
    private function buildDataset(int $year, array $filters): array
    {
        [$start, $end] = $this->yearBounds($year);

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

        // Phieu luong trong nam: staff_id -> Collection<period_month,SalarySlip>.
        $slipsByStaff = SalarySlip::query()
            ->whereIn('staff_id', $staffIds)
            ->where('period_year', $year)
            ->where('slip_type', SalarySlip::TYPE_MAIN)
            ->get()
            ->groupBy('staff_id');

        // Ca lam ACTIVE trong nam -> staff_id -> month -> {count,hours}.
        $shiftAgg = [];
        WorkSchedule::query()
            ->whereIn('staff_id', $staffIds)
            ->whereIn('status', WorkSchedule::ACTIVE_STATUSES)
            ->whereBetween('work_date', [$start->toDateString(), $end->toDateString()])
            ->get(['id', 'staff_id', 'start_time', 'end_time', 'work_date'])
            ->each(function (WorkSchedule $s) use (&$shiftAgg) {
                $month = Carbon::parse($s->work_date)->month;
                $cur = $shiftAgg[$s->staff_id][$month] ?? ['count' => 0, 'hours' => 0.0];
                $hours = $s->durationHours();
                $cur['count']++;
                $cur['hours'] += $hours > 0 ? $hours : 0.0;
                $shiftAgg[$s->staff_id][$month] = $cur;
            });

        $qualificationFilter = $filters['qualification_code'] ?? null;

        $entries = [];
        foreach ($doctors as $doctor) {
            /** @var Collection<int,SalarySlip> $slipsByMonth */
            $slipsByMonth = ($slipsByStaff->get($doctor->id) ?? collect())->keyBy('period_month');
            $doctorShifts = $shiftAgg[$doctor->id] ?? [];

            // BR: chi liet ke bac si co phieu HOAC co ca lam trong nam.
            if ($slipsByMonth->isEmpty() && empty($doctorShifts)) {
                continue;
            }

            [$qualCode, $qualName, $doctorCoef] = $this->resolveDoctorQualification($doctor, $slipsByMonth, $end);

            // Loc hoc ham/hoc vi (pham vi summary + tat ca che do xem).
            if ($qualificationFilter && $qualCode !== $qualificationFilter) {
                continue;
            }

            $months = [];
            for ($m = 1; $m <= 12; $m++) {
                /** @var SalarySlip|null $slip */
                $slip = $slipsByMonth->get($m);
                $agg = $doctorShifts[$m] ?? ['count' => 0, 'hours' => 0.0];

                if ($slip) {
                    $status = $slip->status;
                } elseif ($agg['count'] > 0) {
                    $status = self::STATUS_NOT_CREATED;
                } else {
                    $status = self::STATUS_NO_SHIFTS;
                }

                $months[$m] = [
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
                ];
            }

            $entries[] = [
                'staff_id' => $doctor->id,
                'employee_code' => $doctor->employee_code,
                'full_name' => $doctor->full_name,
                'branch_id' => $doctor->branch_id,
                'branch_name' => $doctor->branch?->name,
                'qualification_code' => $qualCode,
                'qualification_name' => $qualName,
                'doctor_coefficient' => $doctorCoef,
                'months' => $months,
            ];
        }

        return $entries;
    }

    /**
     * 1 dong "theo bac si" tu entry 12 thang (DR240-248).
     *
     * @param  array<string,mixed>  $entry
     * @return array<string,mixed>
     */
    private function doctorRow(array $entry): array
    {
        $months = $entry['months'];
        $withSlip = array_filter($months, fn ($m) => $this->isSlip($m['status']));
        $finalized = array_filter($months, fn ($m) => $m['status'] === SalarySlip::STATUS_FINALIZED);

        return [
            'staff_id' => $entry['staff_id'],                 // DR240
            'employee_code' => $entry['employee_code'],       // DR240
            'full_name' => $entry['full_name'],               // DR241
            'branch_name' => $entry['branch_name'],
            'qualification_code' => $entry['qualification_code'],
            'qualification_name' => $entry['qualification_name'], // DR242
            'doctor_coefficient' => $entry['doctor_coefficient'],
            'months_with_slip' => count($withSlip),           // DR243
            'total_shifts' => $this->sumInt($months, 'total_shifts'), // DR244
            'total_shift_hours' => $this->sum($months, 'total_shift_hours'),
            'total_converted_hours' => $this->sum($withSlip, 'total_converted_hours'), // DR245
            'total_patient_coefficient' => $this->sum($withSlip, 'total_patient_coefficient'), // DR246
            // DR247 - tong luong nam chinh thuc (da chot); kem tam tinh.
            'total_amount' => $this->sum($finalized, 'total_amount'),
            'total_amount_provisional' => $this->sum($withSlip, 'total_amount'),
            'row_status' => $this->rowStatus($months),        // DR248
        ];
    }

    /**
     * 12 dong "theo thang" tu danh sach entry (DR249-256).
     *
     * @param  array<int,array<string,mixed>>  $entries
     * @return array<int,array<string,mixed>>
     */
    private function buildMonthRows(array $entries, int $year): array
    {
        $rows = [];
        for ($m = 1; $m <= 12; $m++) {
            $cells = array_map(fn ($e) => $e['months'][$m], $entries);

            $withSlip = array_filter($cells, fn ($c) => $this->isSlip($c['status']));
            $finalized = array_filter($cells, fn ($c) => $c['status'] === SalarySlip::STATUS_FINALIZED);
            $unfinalized = array_filter($cells, fn ($c) => in_array($c['status'], self::UNFINALIZED_STATUSES, true));
            $notCreated = array_filter($cells, fn ($c) => $c['status'] === self::STATUS_NOT_CREATED);

            $unfinalizedCount = count($unfinalized);

            $rows[] = [
                'month' => $m,
                'year' => $year,                                    // DR249
                'total_payroll_official' => $this->sum($finalized, 'total_amount'), // DR250
                'total_payroll_provisional' => $this->sum($withSlip, 'total_amount'),
                'doctors_with_salary' => count($withSlip),          // DR251
                'finalized_count' => count($finalized),             // DR252
                'unfinalized_count' => $unfinalizedCount,           // DR253
                'doctors_not_created' => count($notCreated),        // DR254
                'total_shifts' => $this->sumInt($cells, 'total_shifts'), // DR255
                'total_converted_hours' => $this->sum($withSlip, 'total_converted_hours'), // DR256
                'is_provisional' => $unfinalizedCount > 0,
            ];
        }

        return $rows;
    }

    /**
     * Bo loc hien thi (q + status) o muc bac si - khong tac dong KPI.
     *
     * @param  array<int,array<string,mixed>>  $entries
     * @param  array<string,mixed>  $filters
     * @return array<int,array<string,mixed>>
     */
    private function applyDoctorDisplayFilters(array $entries, array $filters): array
    {
        $q = isset($filters['q']) ? mb_strtolower(trim((string) $filters['q'])) : '';
        $status = $filters['status'] ?? null;

        return array_values(array_filter($entries, function ($entry) use ($q, $status) {
            if ($q !== '') {
                $haystack = mb_strtolower($entry['full_name'].' '.$entry['employee_code']);
                if (! str_contains($haystack, $q)) {
                    return false;
                }
            }
            // Giu bac si neu co it nhat 1 thang khop trang thai duoc chon (DR230).
            if ($status && $status !== 'all') {
                foreach ($entry['months'] as $cell) {
                    if ($cell['status'] === $status) {
                        return true;
                    }
                }

                return false;
            }

            return true;
        }));
    }

    /**
     * Trang thai tong hop 1 bac si trong nam (DR248).
     *
     * @param  array<int,array<string,mixed>>  $months
     */
    private function rowStatus(array $months): string
    {
        $has = fn (string $status) => (bool) array_filter($months, fn ($m) => $m['status'] === $status);

        if ($has(self::STATUS_NOT_CREATED)) {
            return 'incomplete'; // Chua lap du phieu
        }
        if ($has(SalarySlip::STATUS_NEEDS_RECALCULATE)) {
            return 'needs_adjust'; // Co phieu can dieu chinh
        }
        if ($has(SalarySlip::STATUS_DRAFT) || $has(SalarySlip::STATUS_CALCULATED)) {
            return 'reviewing'; // Dang kiem tra
        }
        if (array_filter($months, fn ($m) => $m['status'] === SalarySlip::STATUS_FINALIZED)) {
            return 'finalized'; // Da chot du
        }

        return 'incomplete';
    }

    /**
     * Hoc ham/hoc vi cua bac si: uu tien snapshot phieu moi nhat, fallback ho so.
     *
     * @param  Collection<int,SalarySlip>  $slipsByMonth
     * @return array{0:?string,1:?string,2:?float}
     */
    private function resolveDoctorQualification(Staff $staff, Collection $slipsByMonth, Carbon $end): array
    {
        /** @var SalarySlip|null $latestSlip */
        $latestSlip = $slipsByMonth->sortByDesc('period_month')->first();

        if ($latestSlip && $latestSlip->qualification_code_snapshot) {
            return [
                $latestSlip->qualification_code_snapshot,
                $latestSlip->qualification_name_snapshot,
                $latestSlip->doctor_coefficient_snapshot !== null
                    ? round((float) $latestSlip->doctor_coefficient_snapshot, 2)
                    : null,
            ];
        }

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

    /**
     * Gom tat ca o (B.si x thang) thanh 1 mang phang phuc vu KPI.
     *
     * @param  array<int,array<string,mixed>>  $entries
     * @return array<int,array<string,mixed>>
     */
    private function flatCells(array $entries): array
    {
        $cells = [];
        foreach ($entries as $entry) {
            foreach ($entry['months'] as $cell) {
                $cells[] = $cell;
            }
        }

        return $cells;
    }

    /**
     * @param  array<int,array<string,mixed>>  $months
     */
    private function countWithSlip(array $months): int
    {
        return count(array_filter($months, fn ($m) => $this->isSlip($m['status'])));
    }

    private function isSlip(string $status): bool
    {
        return ! in_array($status, [self::STATUS_NOT_CREATED, self::STATUS_NO_SHIFTS], true);
    }

    /**
     * Phan trang mang (mac dinh 20/trang, toi da 100).
     *
     * @param  array<int,mixed>  $rows
     * @param  array<string,mixed>  $filters
     * @return array{data:array<int,mixed>,meta:array<string,int>}
     */
    private function paginate(array $rows, array $filters): array
    {
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
     * @param  array<int,array<string,mixed>>  $entries
     * @return array{0:array<int,string>,1:array<int,array<int,mixed>>}
     */
    private function exportDoctorView(array $entries): array
    {
        $headers = [
            'STT', 'Mã bác sĩ', 'Họ và tên', 'Chi nhánh', 'Học hàm/Học vị', 'Hệ số bác sĩ',
            'Số tháng có phiếu', 'Số ca (năm)', 'Giờ làm (năm)', 'Giờ quy đổi', 'Hệ số BN',
            'Lương năm đã chốt (VNĐ)', 'Trạng thái',
        ];

        $rows = [];
        foreach ($entries as $i => $entry) {
            $row = $this->doctorRow($entry);
            $rows[] = [
                $i + 1,
                $row['employee_code'],
                $row['full_name'],
                $row['branch_name'] ?? '',
                $row['qualification_name'] ?? '',
                $row['doctor_coefficient'] !== null ? $this->num($row['doctor_coefficient']) : '--',
                $row['months_with_slip'],
                $row['total_shifts'],
                $this->num($row['total_shift_hours']),
                $this->num($row['total_converted_hours']),
                $this->num($row['total_patient_coefficient']),
                $this->num($row['total_amount']),
                $this->rowStatusLabel($row['row_status']),
            ];
        }

        return [$headers, $rows];
    }

    /**
     * @param  array<int,array<string,mixed>>  $entries
     * @return array{0:array<int,string>,1:array<int,array<int,mixed>>}
     */
    private function exportMonthView(array $entries, int $year): array
    {
        $headers = [
            'Tháng', 'Quỹ lương đã chốt (VNĐ)', 'Quỹ tạm tính (VNĐ)', 'Bác sĩ có lương',
            'Phiếu đã chốt', 'Phiếu chưa chốt', 'Chưa lập phiếu', 'Tổng ca', 'Giờ quy đổi',
        ];

        $rows = [];
        foreach ($this->buildMonthRows($entries, $year) as $row) {
            $rows[] = [
                sprintf('%02d/%d', $row['month'], $row['year']),
                $this->num($row['total_payroll_official']),
                $this->num($row['total_payroll_provisional']),
                $row['doctors_with_salary'],
                $row['finalized_count'],
                $row['unfinalized_count'],
                $row['doctors_not_created'],
                $row['total_shifts'],
                $this->num($row['total_converted_hours']),
            ];
        }

        return [$headers, $rows];
    }

    /**
     * @param  array<int,array<string,mixed>>  $entries
     * @return array{0:array<int,string>,1:array<int,array<int,mixed>>}
     */
    private function exportMatrixView(array $entries): array
    {
        $headers = ['Mã bác sĩ', 'Họ và tên'];
        for ($m = 1; $m <= 12; $m++) {
            $headers[] = 'T'.$m;
        }
        $headers[] = 'Tổng năm (đã chốt)';

        $rows = [];
        foreach ($entries as $entry) {
            $row = [$entry['employee_code'], $entry['full_name']];
            $finalizedTotal = 0.0;
            for ($m = 1; $m <= 12; $m++) {
                $cell = $entry['months'][$m];
                $row[] = $cell['total_amount'] !== null ? $this->num($cell['total_amount']) : '--';
                if ($cell['status'] === SalarySlip::STATUS_FINALIZED) {
                    $finalizedTotal += (float) $cell['total_amount'];
                }
            }
            $row[] = $this->num($finalizedTotal);
            $rows[] = $row;
        }

        return [$headers, $rows];
    }

    /**
     * @param  array<int,array<string,mixed>>  $set
     */
    private function sum(array $set, string $key): float
    {
        return round(array_sum(array_map(fn ($r) => (float) ($r[$key] ?? 0), $set)), 2);
    }

    /**
     * @param  array<int,array<string,mixed>>  $set
     */
    private function sumInt(array $set, string $key): int
    {
        return (int) array_sum(array_map(fn ($r) => (int) ($r[$key] ?? 0), $set));
    }

    private function reportState(int $notCreated, int $unfinalized, int $slipCount): string
    {
        if ($slipCount === 0 && $notCreated === 0) {
            return 'empty';
        }
        if ($notCreated > 0) {
            return 'incomplete';
        }
        if ($unfinalized > 0) {
            return 'reviewing';
        }

        return 'finalized';
    }

    private function rowStatusLabel(string $status): string
    {
        return match ($status) {
            'incomplete' => 'Chưa lập đủ phiếu',
            'reviewing' => 'Đang kiểm tra',
            'needs_adjust' => 'Có phiếu cần điều chỉnh',
            'finalized' => 'Đã chốt đủ',
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
    private function yearBounds(int $year): array
    {
        $start = Carbon::create($year, 1, 1, 0, 0, 0, self::BUSINESS_TIMEZONE)->startOfYear();

        return [$start, $start->copy()->endOfYear()];
    }
}
