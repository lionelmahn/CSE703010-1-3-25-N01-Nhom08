<?php

namespace App\Services;

use App\Models\DoctorQualificationCoefficient;
use App\Models\ExaminationSession;
use App\Models\SalarySlip;
use App\Models\SalarySlipDetail;
use App\Models\ShiftCoefficient;
use App\Models\Staff;
use App\Models\User;
use App\Models\WorkSchedule;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * UC16 - Lap phieu luong cho mot bac si trong mot thang.
 *
 * Tieu thu cau hinh UC15.1 (muc tien/gio), UC15.2 (he so ca), UC15.4 (he so
 * bac si) va snapshot he so phuc tap UC12 de tinh luong theo tung ca:
 *
 *   converted_hours = shift_hours * (shift_coefficient + total_patient_coefficient)
 *   shift_amount    = converted_hours * doctor_coefficient * hourly_rate
 *   total_amount    = sum(shift_amount)
 */
class SalarySlipService
{
    private const BUSINESS_TIMEZONE = 'Asia/Ho_Chi_Minh';

    public function __construct(
        private readonly HourlyRateService $hourlyRates,
        private readonly ShiftCoefficientService $shiftCoefficients,
        private readonly DoctorQualificationCoefficientService $doctorCoefficients,
        private readonly AuditLogService $auditLog,
    ) {
    }

    /**
     * @param  array<string,mixed>  $filters
     */
    public function list(array $filters): LengthAwarePaginator
    {
        $perPage = min(max((int) ($filters['per_page'] ?? 20), 1), 100);

        $q = SalarySlip::query()
            ->with(['staff:id,full_name,employee_code', 'creator:id,name', 'finalizer:id,name']);

        if (! empty($filters['staff_id'])) {
            $q->where('staff_id', (int) $filters['staff_id']);
        }

        if (! empty($filters['period_year'])) {
            $q->where('period_year', (int) $filters['period_year']);
        }

        if (! empty($filters['period_month'])) {
            $q->where('period_month', (int) $filters['period_month']);
        }

        if (! empty($filters['status']) && $filters['status'] !== 'all') {
            $q->where('status', $filters['status']);
        }

        return $q->orderByDesc('period_year')
            ->orderByDesc('period_month')
            ->orderByDesc('id')
            ->paginate($perPage);
    }

    public function find(int $id): SalarySlip
    {
        return SalarySlip::query()
            ->with([
                'staff:id,full_name,employee_code',
                'creator:id,name',
                'finalizer:id,name',
                'details',
            ])
            ->findOrFail($id);
    }

    /**
     * Lich su thao tac cua mot phieu luong (UC16 audit timeline).
     *
     * @param  array<string,mixed>  $filters
     * @return array<int,array<string,mixed>>
     */
    public function auditLogs(int $id, array $filters = []): array
    {
        $q = DB::table('audit_logs')
            ->where('action', 'like', 'salary_slip.%')
            ->where(function ($query) use ($id) {
                $query->where('details', 'like', '%"salary_slip_id":'.$id.',%')
                    ->orWhere('details', 'like', '%"salary_slip_id":'.$id.'}%');
            });

        if (! empty($filters['action']) && $filters['action'] !== 'all') {
            $q->where('action', $filters['action']);
        }

        if (! empty($filters['actor'])) {
            $q->where('admin_name', 'like', '%'.$filters['actor'].'%');
        }

        if (! empty($filters['from'])) {
            $q->where('created_at', '>=', Carbon::parse($filters['from'], self::BUSINESS_TIMEZONE)->startOfDay());
        }

        if (! empty($filters['to'])) {
            $q->where('created_at', '<=', Carbon::parse($filters['to'], self::BUSINESS_TIMEZONE)->endOfDay());
        }

        return $q->orderByDesc('created_at')
            ->limit(100)
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'actor_id' => $log->admin_id,
                'actor_name' => $log->admin_name,
                'action' => $log->action,
                'details' => json_decode($log->details, true) ?: [],
                'created_at' => $log->created_at,
            ])
            ->all();
    }

    /**
     * Danh sach bac si (Staff role bac_si) cho bo chon lap phieu.
     * Ho tro tim kiem (q), loc chi nhanh (branch_id) va co bao "da co phieu ky nay".
     *
     * @param  array<string,mixed>  $filters
     * @return array<int,array<string,mixed>>
     */
    public function doctorOptions(array $filters = []): array
    {
        $q = Staff::query()
            ->where('role_slug', 'bac_si')
            ->where('status', 'working')
            ->whereNotNull('user_id')
            ->with('branch:id,name');

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $q->where(function (Builder $sub) use ($term) {
                $sub->where('full_name', 'like', $term)
                    ->orWhere('employee_code', 'like', $term);
            });
        }

        if (! empty($filters['branch_id'])) {
            $q->where('branch_id', (int) $filters['branch_id']);
        }

        $limit = min(max((int) ($filters['limit'] ?? 50), 1), 100);
        $staffList = $q->orderBy('full_name')
            ->limit($limit)
            ->get(['id', 'employee_code', 'full_name', 'avatar', 'branch_id']);

        // Co bao "da co phieu luong chinh trong ky nay" (chan trung VR3 ngay o bo chon).
        $slipStatusByStaff = [];
        $month = (int) ($filters['period_month'] ?? 0);
        $year = (int) ($filters['period_year'] ?? 0);
        if ($month && $year && $staffList->isNotEmpty()) {
            $slipStatusByStaff = SalarySlip::query()
                ->whereIn('staff_id', $staffList->pluck('id'))
                ->where('period_month', $month)
                ->where('period_year', $year)
                ->where('slip_type', SalarySlip::TYPE_MAIN)
                ->pluck('status', 'staff_id')
                ->all();
        }

        return $staffList->map(fn (Staff $staff) => [
            'id' => $staff->id,
            'employee_code' => $staff->employee_code,
            'full_name' => $staff->full_name,
            'avatar' => $staff->avatar,
            'branch_id' => $staff->branch_id,
            'branch_name' => $staff->branch?->name,
            'has_slip_this_period' => array_key_exists($staff->id, $slipStatusByStaff),
            'slip_status_this_period' => $slipStatusByStaff[$staff->id] ?? null,
        ])->all();
    }

    /**
     * Tinh thu (khong luu) phieu luong cho 1 bac si + ky.
     *
     * @return array<string,mixed>
     */
    public function preview(int $staffId, int $month, int $year, ?User $actor): array
    {
        $staff = $this->resolveDoctorStaff($staffId);
        $computation = $this->buildComputation($staff, $month, $year, $actor);

        $existing = $this->existingMainSlip($staffId, $month, $year);
        if ($existing) {
            $existing->loadMissing('creator:id,name');
        }

        return [
            'staff' => [
                'id' => $staff->id,
                'employee_code' => $staff->employee_code,
                'full_name' => $staff->full_name,
            ],
            'period_month' => $month,
            'period_year' => $year,
            'existing_slip_id' => $existing?->id,
            'existing_slip_status' => $existing?->status,
            'existing_slip_calculated_at' => $existing?->calculated_at,
            'existing_slip_calculated_by' => $existing?->creator?->name,
            'doctor' => $computation['doctor'],
            'hourly_rate_snapshot' => $computation['hourly_rate_snapshot'],
            'totals' => $computation['totals'],
            'details' => $computation['details'],
            'issues' => $computation['issues'],
            'can_finalize' => ! $this->hasBlockingIssues($computation['issues']),
        ];
    }

    /**
     * Tao moi (hoac tinh lai khi da co) phieu luong chinh - trang thai "calculated".
     *
     * @param  array<string,mixed>  $data
     */
    public function createOrCalculate(array $data, ?User $actor): SalarySlip
    {
        $staffId = (int) $data['staff_id'];
        $month = (int) $data['period_month'];
        $year = (int) $data['period_year'];

        $staff = $this->resolveDoctorStaff($staffId);

        return DB::transaction(function () use ($staff, $staffId, $month, $year, $actor) {
            // VR3 - chan tao trung phieu luong chinh cua cung bac si + ky.
            if ($this->existingMainSlip($staffId, $month, $year)) {
                throw ValidationException::withMessages([
                    'period' => 'Đã tồn tại phiếu lương chính cho bác sĩ này trong kỳ '
                        .sprintf('%02d/%d', $month, $year).'.',
                ]);
            }

            $computation = $this->buildComputation($staff, $month, $year, $actor);

            $slip = SalarySlip::create(array_merge(
                $this->headerAttributes($staff, $month, $year, $computation),
                [
                    'code' => $this->generateCode($month, $year),
                    'status' => SalarySlip::STATUS_CALCULATED,
                    'created_by' => $actor?->id,
                    'calculated_at' => $this->businessNow(),
                ]
            ));

            $this->writeDetails($slip, $computation['details']);

            $this->auditLog->log($actor, 'salary_slip.created', [
                'salary_slip_id' => $slip->id,
                'code' => $slip->code,
                'staff_id' => $staff->id,
                'period' => sprintf('%02d/%d', $month, $year),
                'total_amount' => (float) $slip->total_amount,
            ]);

            return $this->find($slip->id);
        });
    }

    /**
     * Tinh lai phieu luong chua chot (A2 / SR7).
     */
    public function recalculate(int $id, ?User $actor): SalarySlip
    {
        return DB::transaction(function () use ($id, $actor) {
            $slip = SalarySlip::query()->lockForUpdate()->findOrFail($id);

            if ($slip->isFinalized()) {
                throw ValidationException::withMessages([
                    'status' => 'Phiếu lương đã chốt, không thể tính lại. Cần hủy chốt trước (ngoài phạm vi hiện tại).',
                ]);
            }

            $staff = $this->resolveDoctorStaff($slip->staff_id);
            $computation = $this->buildComputation($staff, $slip->period_month, $slip->period_year, $actor);

            $slip->fill(array_merge(
                $this->headerAttributes($staff, $slip->period_month, $slip->period_year, $computation),
                [
                    'status' => SalarySlip::STATUS_CALCULATED,
                    'calculated_at' => $this->businessNow(),
                ]
            ))->save();

            $slip->details()->delete();
            $this->writeDetails($slip, $computation['details']);

            $this->auditLog->log($actor, 'salary_slip.recalculated', [
                'salary_slip_id' => $slip->id,
                'code' => $slip->code,
                'total_amount' => (float) $slip->total_amount,
            ]);

            return $this->find($slip->id);
        });
    }

    /**
     * Chot phieu luong - kiem tra lan cuoi, luu snapshot, khoa sua truc tiep.
     */
    public function finalize(int $id, ?User $actor): SalarySlip
    {
        return DB::transaction(function () use ($id, $actor) {
            $slip = SalarySlip::query()->lockForUpdate()->findOrFail($id);

            if ($slip->isFinalized()) {
                throw ValidationException::withMessages([
                    'status' => 'Phiếu lương đã được chốt trước đó.',
                ]);
            }

            $staff = $this->resolveDoctorStaff($slip->staff_id);
            $computation = $this->buildComputation($staff, $slip->period_month, $slip->period_year, $actor);

            // VR4 / VR5 / VR9 - khong cho chot khi con loi chan.
            $blocking = array_values(array_filter(
                $computation['issues'],
                fn (array $issue) => ($issue['severity'] ?? 'warning') === 'error'
            ));
            if (! empty($blocking)) {
                throw ValidationException::withMessages([
                    'finalize' => array_map(fn (array $issue) => $issue['message'], $blocking),
                ]);
            }

            $slip->fill(array_merge(
                $this->headerAttributes($staff, $slip->period_month, $slip->period_year, $computation),
                [
                    'status' => SalarySlip::STATUS_FINALIZED,
                    'calculation_snapshot' => [
                        'doctor' => $computation['doctor'],
                        'hourly_rate_snapshot' => $computation['hourly_rate_snapshot'],
                        'totals' => $computation['totals'],
                        'details' => $computation['details'],
                        'issues' => $computation['issues'],
                        'finalized_at' => $this->businessNow()->toIso8601String(),
                    ],
                    'finalized_by' => $actor?->id,
                    'finalized_at' => $this->businessNow(),
                ]
            ))->save();

            $slip->details()->delete();
            $this->writeDetails($slip, $computation['details']);

            $this->auditLog->log($actor, 'salary_slip.finalized', [
                'salary_slip_id' => $slip->id,
                'code' => $slip->code,
                'total_amount' => (float) $slip->total_amount,
            ]);

            return $this->find($slip->id);
        });
    }

    /**
     * Loi tinh toan cot loi cua UC16. Tra ve details + totals + doctor + issues.
     *
     * @return array<string,mixed>
     */
    private function buildComputation(Staff $staff, int $month, int $year, ?User $actor): array
    {
        [$start, $end] = $this->monthBounds($month, $year);
        $userId = (int) $staff->user_id;

        $shifts = WorkSchedule::query()
            ->where('staff_id', $staff->id)
            ->whereIn('status', WorkSchedule::ACTIVE_STATUSES)
            ->whereBetween('work_date', [$start->toDateString(), $end->toDateString()])
            ->with('shiftTemplate:id,code,name')
            ->orderBy('work_date')
            ->orderBy('start_time')
            ->get();

        $shiftIds = $shifts->pluck('id')->all();

        // Phien kham hoan tat chuyen mon, da gan ca - gom theo work_schedule_id.
        $linkedByShift = collect();
        if (! empty($shiftIds)) {
            $linkedByShift = ExaminationSession::query()
                ->where('doctor_id', $userId)
                ->where('status', ExaminationSession::STATUS_HOAN_TAT)
                ->whereIn('work_schedule_id', $shiftIds)
                ->with([
                    'patient:id,full_name,patient_code',
                    'serviceItems:id,examination_id,service_name_snapshot,complexity_coefficient,quantity',
                ])
                ->get()
                ->groupBy('work_schedule_id');
        }

        // Phien kham hoan tat nhung chua gan ca (A3 / VR5) - canh bao, loai khoi tinh.
        $unlinked = ExaminationSession::query()
            ->where('doctor_id', $userId)
            ->where('status', ExaminationSession::STATUS_HOAN_TAT)
            ->whereBetween('completed_at', [$start, $end])
            ->where(function (Builder $q) {
                $q->whereNull('work_schedule_id')->orWhere('unlinked_shift', true);
            })
            ->get(['id', 'code', 'completed_at']);

        $details = [];
        $issues = [];

        foreach ($shifts as $shift) {
            $shiftHours = $shift->durationHours();

            // VR8 - bo qua ca co so gio <= 0.
            if ($shiftHours <= 0) {
                $issues[] = [
                    'type' => 'invalid_hours',
                    'severity' => 'warning',
                    'message' => 'Ca '.$shift->work_date->format('d/m/Y').' có số giờ không hợp lệ (<= 0), đã loại khỏi tính lương.',
                    'context' => ['work_schedule_id' => $shift->id],
                ];
                continue;
            }

            $shiftCoefficient = $this->shiftCoefficients->resolveCoefficientValueForSchedule($shift, $actor, false);
            $doctorResolution = $this->doctorCoefficients->resolveForStaff($staff, $shift->work_date, $actor, false);
            $doctorCoefficient = (float) $doctorResolution['coefficient'];

            $hourlyRecord = $this->hourlyRates->resolveForDate($shift->work_date);
            $hourlyRate = $hourlyRecord ? (float) $hourlyRecord->hourly_rate : null;
            if ($hourlyRate === null) {
                $issues[] = [
                    'type' => 'missing_hourly_rate',
                    'severity' => 'error',
                    'message' => 'Thiếu cấu hình mức tiền/giờ hiệu lực cho ngày '.$shift->work_date->format('d/m/Y').'.',
                    'context' => ['work_schedule_id' => $shift->id],
                ];
            }

            [$patientCoefficient, $breakdown] = $this->resolvePatientCoefficient(
                $linkedByShift->get($shift->id)
            );

            $convertedHours = round($shiftHours * ($shiftCoefficient + $patientCoefficient), 2);
            $shiftAmount = round($convertedHours * $doctorCoefficient * (float) ($hourlyRate ?? 0), 2);

            $details[] = [
                'work_schedule_id' => $shift->id,
                'work_date' => $shift->work_date->toDateString(),
                'shift_template_code' => $shift->shiftTemplate?->code,
                'shift_name' => $shift->shiftTemplate?->name,
                'start_time' => $shift->start_time,
                'end_time' => $shift->end_time,
                'shift_hours' => $shiftHours,
                'day_type' => $this->dayTypeForDate($shift->work_date),
                'shift_type' => $this->shiftCoefficients->shiftTypeForSchedule($shift),
                'shift_coefficient' => round($shiftCoefficient, 2),
                'total_patient_coefficient' => $patientCoefficient,
                'converted_hours' => $convertedHours,
                'doctor_coefficient' => round($doctorCoefficient, 2),
                'hourly_rate' => $hourlyRate !== null ? round($hourlyRate, 2) : 0,
                'shift_amount' => $shiftAmount,
                'examination_breakdown' => $breakdown,
            ];
        }

        if (empty($details)) {
            // E3 - khong co ca lam hop le.
            $issues[] = [
                'type' => 'no_valid_shifts',
                'severity' => 'error',
                'message' => 'Bác sĩ không có ca làm hợp lệ trong kỳ '.sprintf('%02d/%d', $month, $year).'.',
                'context' => [],
            ];
        }

        foreach ($unlinked as $session) {
            $issues[] = [
                'type' => 'unlinked_examination',
                'severity' => 'error',
                'message' => 'Phiên khám '.$session->code.' đã hoàn tất nhưng chưa liên kết ca làm. Cần xử lý trước khi chốt.',
                'context' => ['examination_id' => $session->id, 'examination_code' => $session->code],
            ];
        }

        $totals = [
            'total_shifts' => count($details),
            'total_shift_hours' => round(array_sum(array_column($details, 'shift_hours')), 2),
            'total_converted_hours' => round(array_sum(array_column($details, 'converted_hours')), 2),
            'total_patient_coefficient' => round(array_sum(array_column($details, 'total_patient_coefficient')), 2),
            'total_amount' => round(array_sum(array_column($details, 'shift_amount')), 2),
        ];

        $doctorSnapshot = $this->doctorCoefficients->resolveForStaff($staff, $end, $actor, false);
        $qualificationCode = $doctorSnapshot['qualification_code'] ?? null;
        $qualification = $qualificationCode
            ? DoctorQualificationCoefficient::qualificationByCode($qualificationCode)
            : null;

        $hourlyRecordAtPeriod = $this->hourlyRates->resolveForDate($end);

        return [
            'details' => $details,
            'totals' => $totals,
            'doctor' => [
                'staff_id' => $staff->id,
                'full_name' => $staff->full_name,
                'qualification_code' => $qualificationCode,
                'qualification_name' => $qualification['name'] ?? null,
                'coefficient' => round((float) $doctorSnapshot['coefficient'], 2),
                'is_default' => (bool) ($doctorSnapshot['is_default'] ?? false),
            ],
            'hourly_rate_snapshot' => $hourlyRecordAtPeriod
                ? round((float) $hourlyRecordAtPeriod->hourly_rate, 2)
                : null,
            'issues' => $issues,
        ];
    }

    /**
     * @param  \Illuminate\Support\Collection<int,ExaminationSession>|null  $sessions
     * @return array{0:float,1:array<int,array<string,mixed>>}
     */
    private function resolvePatientCoefficient($sessions): array
    {
        $sum = 0.0;
        $breakdown = [];

        if ($sessions) {
            foreach ($sessions as $session) {
                foreach ($session->serviceItems as $item) {
                    $coefficient = (float) $item->complexity_coefficient;
                    $sum += $coefficient;
                    $breakdown[] = [
                        'examination_id' => $session->id,
                        'examination_code' => $session->code,
                        'patient_id' => $session->patient_id,
                        'patient_name' => $session->patient?->full_name,
                        'service_name' => $item->service_name_snapshot,
                        'complexity_coefficient' => $coefficient,
                    ];
                }
            }
        }

        return [round($sum, 2), $breakdown];
    }

    /**
     * @param  array<string,mixed>  $computation
     * @return array<string,mixed>
     */
    private function headerAttributes(Staff $staff, int $month, int $year, array $computation): array
    {
        return [
            'staff_id' => $staff->id,
            'period_month' => $month,
            'period_year' => $year,
            'slip_type' => SalarySlip::TYPE_MAIN,
            'doctor_name_snapshot' => $computation['doctor']['full_name'],
            'qualification_code_snapshot' => $computation['doctor']['qualification_code'],
            'qualification_name_snapshot' => $computation['doctor']['qualification_name'],
            'doctor_coefficient_snapshot' => $computation['doctor']['coefficient'],
            'hourly_rate_snapshot' => $computation['hourly_rate_snapshot'],
            'total_shifts' => $computation['totals']['total_shifts'],
            'total_shift_hours' => $computation['totals']['total_shift_hours'],
            'total_converted_hours' => $computation['totals']['total_converted_hours'],
            'total_patient_coefficient' => $computation['totals']['total_patient_coefficient'],
            'total_amount' => $computation['totals']['total_amount'],
        ];
    }

    /**
     * @param  array<int,array<string,mixed>>  $details
     */
    private function writeDetails(SalarySlip $slip, array $details): void
    {
        foreach ($details as $detail) {
            $slip->details()->create($detail);
        }
    }

    private function resolveDoctorStaff(int $staffId): Staff
    {
        $staff = Staff::query()->find($staffId);

        if (! $staff) {
            throw ValidationException::withMessages([
                'staff_id' => 'E1: Không tìm thấy bác sĩ.',
            ]);
        }

        if ($staff->role_slug !== 'bac_si') {
            throw ValidationException::withMessages([
                'staff_id' => 'Nhân viên được chọn không phải là bác sĩ.',
            ]);
        }

        if (empty($staff->user_id)) {
            throw ValidationException::withMessages([
                'staff_id' => 'Bác sĩ chưa liên kết tài khoản người dùng, không thể tổng hợp phiên khám.',
            ]);
        }

        return $staff;
    }

    private function existingMainSlip(int $staffId, int $month, int $year): ?SalarySlip
    {
        return SalarySlip::query()
            ->where('staff_id', $staffId)
            ->where('period_year', $year)
            ->where('period_month', $month)
            ->where('slip_type', SalarySlip::TYPE_MAIN)
            ->first();
    }

    /**
     * @param  array<int,array<string,mixed>>  $issues
     */
    private function hasBlockingIssues(array $issues): bool
    {
        foreach ($issues as $issue) {
            if (($issue['severity'] ?? 'warning') === 'error') {
                return true;
            }
        }

        return false;
    }

    /**
     * @return array{0:Carbon,1:Carbon}
     */
    private function monthBounds(int $month, int $year): array
    {
        $start = Carbon::create($year, $month, 1, 0, 0, 0, self::BUSINESS_TIMEZONE)->startOfMonth();
        $end = $start->copy()->endOfMonth();

        return [$start, $end];
    }

    private function dayTypeForDate(Carbon $date): string
    {
        return match ($date->dayOfWeekIso) {
            6 => ShiftCoefficient::DAY_TYPE_SATURDAY,
            7 => ShiftCoefficient::DAY_TYPE_SUNDAY,
            default => ShiftCoefficient::DAY_TYPE_WEEKDAY,
        };
    }

    private function generateCode(int $month, int $year): string
    {
        $prefix = 'PL-'.$year.sprintf('%02d', $month).'-';
        do {
            $code = $prefix.random_int(1000, 9999);
        } while (SalarySlip::query()->where('code', $code)->exists());

        return $code;
    }

    private function businessNow(): Carbon
    {
        return now(self::BUSINESS_TIMEZONE);
    }
}
