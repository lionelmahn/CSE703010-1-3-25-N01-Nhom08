<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Branch;
use App\Models\LeaveRequest;
use App\Models\Service;
use App\Models\Staff;
use App\Models\User;
use App\Models\WorkSchedule;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * UC8 - Dieu phoi bac si.
 *
 * Service danh gia kha dung cua bac si va goi y phan cong cho 1 lich hen.
 *
 * Phu trach cac validation rule:
 *  - VR3 bac si dang hoat dong
 *  - VR4 lich lam viec phu hop (date + branch + giay khoang giay)
 *  - VR5 nghi phep / nghi ca (leave_requests approved)
 *  - VR6 trung lich (appointments overlap)
 *  - VR7 chuyen mon phu hop dich vu (neu co cau hinh chuyen mon)
 *
 * Doctor identity = `users.id` (vi appointments.assigned_doctor_id ref users).
 * Metadata bac si (chuyen mon, lich lam viec, nghi phep) song o
 * staff/professional_profiles thong qua `staff.user_id = users.id`.
 */
class DoctorAvailabilityService
{
    public const FIT_HIGH = 'high';
    public const FIT_MEDIUM = 'medium';
    public const FIT_LOW = 'low';

    /**
     * Tra ve danh sach ung vien (bac si) cho 1 lich hen, kem fit_score
     * va blockers (neu co). Loai bac si khong active hoan toan.
     *
     * @return array{appointment: array, candidates: array<int, array>}
     */
    public function candidatesFor(Appointment $appointment): array
    {
        $date = Carbon::parse($appointment->appointment_date);
        [$slotStart, $slotEnd] = $this->parseSlot($appointment->time_slot);

        $doctors = $this->fetchActiveDoctors();

        $candidates = $doctors->map(function (User $user) use ($appointment, $date, $slotStart, $slotEnd) {
            return $this->evaluate($user, $appointment, $date, $slotStart, $slotEnd);
        })
        // chi giu ung vien co the chon (khong vi active=false hoac thieu staff)
        ->filter(fn (?array $row) => $row !== null)
        ->values();

        // Sort: ket qua co the chon (khong co blocker hard) len truoc,
        // sau do theo fit_score desc.
        $sorted = $candidates->sortBy(function (array $row) {
            $hard = $row['has_hard_blocker'] ? 1 : 0;
            return [$hard, -$row['fit_score']];
        })->values();

        return [
            'appointment' => [
                'id' => $appointment->id,
                'code' => $appointment->code,
                'appointment_date' => $appointment->appointment_date?->toDateString(),
                'time_slot' => $appointment->time_slot,
                'branch_id' => $appointment->branch_id,
                'service_ids' => $appointment->service_ids ?? [],
                'status' => $appointment->status,
                'current_doctor_id' => $appointment->assigned_doctor_id,
            ],
            'candidates' => $sorted->all(),
        ];
    }

    /**
     * Validate 1 bac si co the duoc gan cho 1 lich hen (hard rules only).
     * Tra ve mang ['ok' => bool, 'errors' => array, 'warnings' => array].
     */
    public function validateAssignment(int $userId, Appointment $appointment, bool $ignoreSelf = true): array
    {
        $user = User::with(['staff.professionalProfiles.specialties'])->find($userId);
        if (! $user) {
            return ['ok' => false, 'errors' => ['doctor_id' => 'VR3: Bac si khong ton tai.'], 'warnings' => []];
        }

        $date = Carbon::parse($appointment->appointment_date);
        [$slotStart, $slotEnd] = $this->parseSlot($appointment->time_slot);

        $errors = [];
        $warnings = [];

        // VR3 - active
        if (! $this->isActiveDoctor($user)) {
            $errors['doctor_id'] = 'VR3: Bac si khong hoat dong hoac khong co role bac_si.';
            return ['ok' => false, 'errors' => $errors, 'warnings' => $warnings];
        }

        $staff = $user->staff;
        if (! $staff) {
            $errors['doctor_id'] = 'VR3: Tai khoan chua lien ket nhan vien.';
            return ['ok' => false, 'errors' => $errors, 'warnings' => $warnings];
        }

        // VR4 - work schedule
        $schedule = $this->findMatchingSchedule($staff, $date, $appointment->branch_id, $slotStart, $slotEnd);
        if (! $schedule) {
            $errors['doctor_id'] = 'VR4: Bac si khong co lich lam viec phu hop voi gio/chi nhanh nay.';
            return ['ok' => false, 'errors' => $errors, 'warnings' => $warnings];
        }

        // VR5 - leave
        if ($this->isOnLeave($schedule)) {
            $errors['doctor_id'] = 'VR5: Bac si dang nghi phep / nghi ca tai thoi diem hen.';
            return ['ok' => false, 'errors' => $errors, 'warnings' => $warnings];
        }

        // VR6 - conflict
        if ($this->hasConflict($user->id, $date, $appointment->time_slot, $ignoreSelf ? $appointment->id : null)) {
            $errors['doctor_id'] = 'VR6: Bac si da co lich khac trong cung khung gio.';
            return ['ok' => false, 'errors' => $errors, 'warnings' => $warnings];
        }

        // VR7 - specialty (chi check neu co cau hinh - tuc bac si co
        // it nhat 1 specialty co service_scope). Neu khong co cau hinh
        // thi skip (theo dac ta "neu co cau hinh chuyen mon").
        $specialtyCheck = $this->checkSpecialty($user, $appointment->service_ids ?? []);
        if ($specialtyCheck === 'mismatch') {
            // Chi warning neu user khong co specialty nao (chua cau hinh).
            // Neu co specialty roi nhung khong match -> error.
            $errors['doctor_id'] = 'VR7: Bac si khong phu hop chuyen mon voi dich vu da chon.';
            return ['ok' => false, 'errors' => $errors, 'warnings' => $warnings];
        }
        if ($specialtyCheck === 'no_config') {
            $warnings[] = 'VR7: Bac si chua cau hinh chuyen mon - skip kiem tra.';
        }

        return ['ok' => true, 'errors' => $errors, 'warnings' => $warnings];
    }

    /**
     * Lich kha dung cua bac si trong ngay (work_schedule + appointments + leave).
     */
    public function availabilityOn(int $userId, Carbon $date): array
    {
        $user = User::with('staff')->find($userId);
        if (! $user || ! $user->staff) {
            return ['user_id' => $userId, 'schedules' => [], 'appointments' => [], 'leaves' => []];
        }

        $staffId = $user->staff->id;

        $schedules = WorkSchedule::query()
            ->where('staff_id', $staffId)
            ->whereDate('work_date', $date->toDateString())
            ->whereIn('status', WorkSchedule::ACTIVE_STATUSES)
            ->with('branch:id,name')
            ->get()
            ->map(fn (WorkSchedule $s) => [
                'id' => $s->id,
                'branch_id' => $s->branch_id,
                'branch_name' => $s->branch?->name,
                'start_time' => $s->start_time,
                'end_time' => $s->end_time,
                'work_role' => $s->work_role,
                'status' => $s->status,
            ])
            ->all();

        $appointments = Appointment::query()
            ->where('assigned_doctor_id', $userId)
            ->whereDate('appointment_date', $date->toDateString())
            ->whereNotIn('status', [
                Appointment::STATUS_CANCELLED,
                Appointment::STATUS_NO_SHOW,
            ])
            ->orderBy('time_slot')
            ->get(['id', 'code', 'time_slot', 'status', 'branch_id'])
            ->all();

        $leaves = LeaveRequest::query()
            ->where('staff_id', $staffId)
            ->where('status', LeaveRequest::STATUS_APPROVED)
            ->whereHas('workSchedule', fn ($q) => $q->whereDate('work_date', $date->toDateString()))
            ->with('workSchedule:id,start_time,end_time,work_date')
            ->get()
            ->map(fn (LeaveRequest $l) => [
                'id' => $l->id,
                'reason' => $l->reason,
                'work_schedule_id' => $l->work_schedule_id,
                'start_time' => $l->workSchedule?->start_time,
                'end_time' => $l->workSchedule?->end_time,
            ])
            ->all();

        return [
            'user_id' => $userId,
            'date' => $date->toDateString(),
            'schedules' => $schedules,
            'appointments' => $appointments,
            'leaves' => $leaves,
        ];
    }

    /**
     * Workload tom tat: % utilization theo TIME_SLOTS, so lich, gio con lai.
     */
    public function workloadOn(int $userId, Carbon $date): array
    {
        $availability = $this->availabilityOn($userId, $date);
        $totalSlots = count(AppointmentService::TIME_SLOTS) - count(AppointmentService::BREAK_SLOTS);
        $usedSlots = count($availability['appointments']);
        $utilization = $totalSlots > 0 ? round(($usedSlots / $totalSlots) * 100) : 0;

        return [
            'user_id' => $userId,
            'date' => $date->toDateString(),
            'total_slots' => $totalSlots,
            'used_slots' => $usedSlots,
            'free_slots' => max(0, $totalSlots - $usedSlots),
            'utilization_percent' => $utilization,
            'has_schedule' => ! empty($availability['schedules']),
            'on_leave' => ! empty($availability['leaves']),
        ];
    }

    /**
     * Liet ke bac si (User) co role bac_si va status active. Eager-load
     * staff + professional_profiles + specialties de phuc vu candidatesFor().
     */
    public function fetchActiveDoctors(): Collection
    {
        return User::query()
            ->whereHas('roles', fn ($q) => $q->where('slug', 'bac_si'))
            ->where('status', 'active')
            ->with([
                'staff.branch:id,name',
                'staff.professionalProfiles' => fn ($q) => $q->where('status', 'approved')->where('is_active', true),
                'staff.professionalProfiles.specialties',
            ])
            ->orderBy('name')
            ->get();
    }

    protected function evaluate(User $user, Appointment $appointment, Carbon $date, string $slotStart, string $slotEnd): ?array
    {
        $staff = $user->staff;
        if (! $staff) {
            return null;
        }

        $blockers = [];
        $reasons = [];

        $schedule = $this->findMatchingSchedule($staff, $date, $appointment->branch_id, $slotStart, $slotEnd);
        if (! $schedule) {
            $blockers[] = 'no_schedule';
        } else {
            $reasons[] = 'in_schedule';
        }

        if ($schedule && $this->isOnLeave($schedule)) {
            $blockers[] = 'on_leave';
        }

        if ($this->hasConflict($user->id, $date, $appointment->time_slot, $appointment->id)) {
            $blockers[] = 'time_conflict';
        } else {
            $reasons[] = 'time_free';
        }

        $specialtyCheck = $this->checkSpecialty($user, $appointment->service_ids ?? []);
        if ($specialtyCheck === 'mismatch') {
            $blockers[] = 'specialty_mismatch';
        } elseif ($specialtyCheck === 'match') {
            $reasons[] = 'specialty_match';
        }

        $workload = $this->workloadOn($user->id, $date);
        if ($workload['utilization_percent'] < 60) {
            $reasons[] = 'low_workload';
        }

        // Fit score: blockers nang giam diem, reasons cong diem.
        $score = 1.0;
        $hasHardBlocker = false;
        foreach ($blockers as $b) {
            $score -= match ($b) {
                'no_schedule' => 0.6,
                'on_leave' => 0.6,
                'time_conflict' => 0.6,
                'specialty_mismatch' => 0.3,
                default => 0.2,
            };
            if (in_array($b, ['no_schedule', 'on_leave', 'time_conflict'], true)) {
                $hasHardBlocker = true;
            }
        }
        $score += min(0.3, count($reasons) * 0.1);
        $score = max(0, min(1, $score));

        $label = $score >= 0.75 ? self::FIT_HIGH : ($score >= 0.5 ? self::FIT_MEDIUM : self::FIT_LOW);

        $specialty = $this->primarySpecialtyName($user);

        return [
            'user_id' => $user->id,
            'staff_id' => $staff->id,
            'name' => $user->name,
            'email' => $user->email,
            'specialty' => $specialty,
            'branch_id' => $staff->branch_id,
            'branch_name' => $staff->branch?->name,
            'workload_percent' => $workload['utilization_percent'],
            'used_slots' => $workload['used_slots'],
            'free_slots' => $workload['free_slots'],
            'fit_score' => round($score, 2),
            'fit_label' => $label,
            'reasons' => $reasons,
            'blockers' => $blockers,
            'has_hard_blocker' => $hasHardBlocker,
            'schedule' => $schedule ? [
                'id' => $schedule->id,
                'start_time' => $schedule->start_time,
                'end_time' => $schedule->end_time,
            ] : null,
        ];
    }

    protected function isActiveDoctor(User $user): bool
    {
        if ($user->status !== 'active') {
            return false;
        }
        $user->loadMissing('roles');
        return $user->roles->contains('slug', 'bac_si');
    }

    /**
     * Tim work_schedule khop ngay + chi nhanh + bao boc slot[start,end].
     * Tra null neu khong tim duoc.
     *
     * Luu y: `appointments.branch_id` luu duoi dang string(64) - co the la
     * branch code (vd "PK1-HN") hoac branch id duoi dang string (vd "1")
     * tuy luong tao. Can chap nhan ca hai khi resolve sang work_schedule.
     */
    protected function findMatchingSchedule(Staff $staff, Carbon $date, ?string $branchRef, string $slotStart, string $slotEnd): ?WorkSchedule
    {
        $query = WorkSchedule::query()
            ->where('staff_id', $staff->id)
            ->whereDate('work_date', $date->toDateString())
            ->whereIn('status', WorkSchedule::ACTIVE_STATUSES)
            ->where('start_time', '<=', $slotStart)
            ->where('end_time', '>=', $slotEnd);

        if ($branchRef) {
            $branchId = $this->resolveBranchId($branchRef);
            $query->where(function ($q) use ($branchId) {
                if ($branchId !== null) {
                    $q->where('branch_id', $branchId)->orWhereNull('branch_id');
                } else {
                    $q->whereNull('branch_id');
                }
            });
        }

        return $query->first();
    }

    /**
     * Convert `appointments.branch_id` (string ref - co the la code hoac id)
     * sang `branches.id` (int). Cache theo runtime de tranh query lap.
     *
     * Tra null neu khong tim duoc (branch da bi xoa hoac ref khong hop le).
     */
    protected function resolveBranchId(string $branchRef): ?int
    {
        static $cache = [];
        if (array_key_exists($branchRef, $cache)) {
            return $cache[$branchRef];
        }
        $legacyBranchRefs = [
            'q1' => 'PK1-HN',
            'q3' => 'PK2-HCM',
            'q7' => 'PK3-DN',
        ];
        $normalizedRef = $legacyBranchRefs[$branchRef] ?? $branchRef;
        $branch = Branch::query()
            ->where('code', $normalizedRef)
            ->orWhere('id', $normalizedRef)
            ->first(['id']);
        $cache[$branchRef] = $branch?->id;
        return $cache[$branchRef];
    }

    /**
     * Kiem tra co leave_request approved cho work_schedule cua bac si o slot do.
     */
    protected function isOnLeave(WorkSchedule $schedule): bool
    {
        return LeaveRequest::query()
            ->where('work_schedule_id', $schedule->id)
            ->where('status', LeaveRequest::STATUS_APPROVED)
            ->exists();
    }

    /**
     * Trung lich: co appointment khac cua user vao cung ngay+slot, status
     * khong phai cancelled / completed / no_show. Bo qua chinh appointment
     * dang xet (de phuc vu reassign).
     */
    protected function hasConflict(int $userId, Carbon $date, string $timeSlot, ?int $ignoreAppointmentId): bool
    {
        $q = Appointment::query()
            ->where('assigned_doctor_id', $userId)
            ->whereDate('appointment_date', $date->toDateString())
            ->where('time_slot', $timeSlot)
            ->whereNotIn('status', [
                Appointment::STATUS_CANCELLED,
                Appointment::STATUS_COMPLETED,
                Appointment::STATUS_NO_SHOW,
            ]);

        if ($ignoreAppointmentId !== null) {
            $q->where('id', '!=', $ignoreAppointmentId);
        }

        return $q->exists();
    }

    /**
     * Tra: 'match' | 'mismatch' | 'no_config'.
     * - 'no_config': bac si chua cau hinh chuyen mon nao -> skip VR7.
     * - 'match': it nhat 1 specialty co service_scope giao voi service_ids cua lich hen.
     * - 'mismatch': co cau hinh nhung khong giao.
     */
    protected function checkSpecialty(User $user, array $serviceIds): string
    {
        $staff = $user->staff;
        if (! $staff) {
            return 'no_config';
        }

        $profiles = $staff->professionalProfiles ?? collect();
        $specialties = $profiles->flatMap(fn ($p) => $p->specialties ?? []);
        if ($specialties->isEmpty()) {
            return 'no_config';
        }

        $resolvedServiceRefs = $this->resolveServiceRefs($serviceIds);
        if (empty($resolvedServiceRefs)) {
            // Bac si co cau hinh chuyen mon nhung lich hen khong chon dich vu
            // hoac service legacy/other khong resolve duoc -> khong du thong
            // tin de loai theo VR7.
            return 'match';
        }

        foreach ($specialties as $sp) {
            $scope = $sp->service_scope ?? [];
            if (! is_array($scope) || empty($scope)) {
                continue;
            }
            foreach ($scope as $item) {
                $scopeRef = $this->normalizeServiceRef($item);
                if ($scopeRef !== null && in_array($scopeRef, $resolvedServiceRefs, true)) {
                    return 'match';
                }
            }
        }

        return 'mismatch';
    }

    /**
     * Appointment service refs can come from old landing-page mock values,
     * service codes, numeric ids, or service names. Professional profile
     * service_scope can also be stored as either service ids (full form) or
     * service names (wizard), so a resolved service contributes all stable
     * aliases to the comparison set. Unresolved refs such as "other" are
     * treated as no specialty signal.
     *
     * @return array<int, string>
     */
    protected function resolveServiceRefs(array $serviceRefs): array
    {
        $resolved = [];
        foreach ($serviceRefs as $ref) {
            $key = $this->serviceRefValue($ref);
            if ($key === null) {
                continue;
            }

            $serviceQuery = Service::query()
                ->where('service_code', $key)
                ->orWhere('name', $key);

            if (ctype_digit($key)) {
                $serviceQuery->orWhere('id', (int) $key);
            }

            $service = $serviceQuery->first(['id', 'service_code', 'name']);
            if ($service) {
                $resolved[] = $this->normalizeServiceRef($service->id);
                $resolved[] = $this->normalizeServiceRef($service->service_code);
                $resolved[] = $this->normalizeServiceRef($service->name);
            }
        }

        return array_values(array_unique(array_filter($resolved)));
    }

    protected function serviceRefValue(mixed $value): ?string
    {
        if (is_array($value)) {
            foreach (['id', 'service_code', 'code', 'name', 'value', 'label'] as $key) {
                if (array_key_exists($key, $value)) {
                    $value = $value[$key];
                    break;
                }
            }
        }

        if ($value === null || $value === '') {
            return null;
        }

        $value = trim((string) $value);
        return $value === '' ? null : $value;
    }

    protected function normalizeServiceRef(mixed $value): ?string
    {
        $value = $this->serviceRefValue($value);
        return $value === null ? null : mb_strtolower($value);
    }

    protected function primarySpecialtyName(User $user): ?string
    {
        $staff = $user->staff;
        if (! $staff) {
            return null;
        }
        foreach ($staff->professionalProfiles ?? [] as $profile) {
            foreach ($profile->specialties ?? [] as $sp) {
                if (! empty($sp->specialty_name)) {
                    return $sp->specialty_name;
                }
            }
        }
        return null;
    }

    /**
     * Parse slot string (e.g. '08-09', '17-1730') thanh [start, end] format HH:MM:SS.
     */
    protected function parseSlot(string $slot): array
    {
        $parts = explode('-', $slot);
        $start = $this->formatTime($parts[0] ?? '00');
        $end = $this->formatTime($parts[1] ?? '00');
        return [$start, $end];
    }

    protected function formatTime(string $token): string
    {
        $token = trim($token);
        if (strlen($token) >= 4) {
            $hh = substr($token, 0, 2);
            $mm = substr($token, 2, 2);
            return $hh.':'.$mm.':00';
        }
        return str_pad($token, 2, '0', STR_PAD_LEFT).':00:00';
    }
}
