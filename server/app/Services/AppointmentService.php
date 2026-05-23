<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\AppointmentStatusHistory;
use App\Models\Branch;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * UC7 - Business logic quan ly lich hen chinh thuc.
 *
 * Trach nhiem:
 *  - Tao lich hen (WF1, AC5, AC7, AC8, AC10).
 *  - Cap nhat thong tin co ban (VR7).
 *  - Doi lich (WF3, VR8, VR13, AC11, AC12, AC22).
 *  - Huy lich (WF4, VR9, VR10, AC13, AC14, AC15).
 *  - Ghi audit log (AC17) qua bang appointment_status_histories.
 *
 * KHONG xu ly: assign bac si (UC8/BR3/BR4), check-in (UC9/BR5/BR6), bat
 * dau/ket thuc kham, khong den - cac transition WF2/WF5/WF6/WF7/WF8 do UC8
 * va UC9 chiu trach nhiem.
 */
class AppointmentService
{
    /**
     * Catalog khung gio mac dinh (khop voi PublicBookingController::timeSlots).
     * Dung de validate VR3 (gio hoat dong) va VR5 (slot conflict).
     */
    public const TIME_SLOTS = [
        '08-09', '09-10', '10-11', '11-12',
        '12-13', // nghi trua - VR3 chan khoi
        '13-14', '14-15', '15-16', '16-17', '17-1730',
    ];

    public const BREAK_SLOTS = ['12-13'];

    public function listAppointments(array $filters): LengthAwarePaginator
    {
        $query = Appointment::query()
            ->with(['patient:id,patient_code,full_name,phone,email', 'assignedDoctor:id,name', 'creator:id,name']);

        if (! empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }
        if (! empty($filters['branch_id']) && $filters['branch_id'] !== 'all') {
            $query->where('branch_id', $filters['branch_id']);
        }
        if (! empty($filters['source']) && $filters['source'] !== 'all') {
            $query->where('source', $filters['source']);
        }
        if (! empty($filters['doctor_id']) && $filters['doctor_id'] !== 'all') {
            $query->where('assigned_doctor_id', $filters['doctor_id']);
        }
        if (! empty($filters['service_id']) && $filters['service_id'] !== 'all') {
            $query->whereJsonContains('service_ids', $filters['service_id']);
        }
        if (! empty($filters['date_from'])) {
            $query->whereDate('appointment_date', '>=', $filters['date_from']);
        }
        if (! empty($filters['date_to'])) {
            $query->whereDate('appointment_date', '<=', $filters['date_to']);
        }
        if (! empty($filters['date'])) {
            $query->whereDate('appointment_date', $filters['date']);
        }
        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(function ($q) use ($term) {
                $q->where('code', 'like', $term)
                    ->orWhereHas('patient', function ($pq) use ($term) {
                        $pq->where('full_name', 'like', $term)
                            ->orWhere('phone', 'like', $term)
                            ->orWhere('patient_code', 'like', $term);
                    });
            });
        }

        $perPage = (int) ($filters['per_page'] ?? 15);
        $perPage = max(1, min(100, $perPage));

        return $query
            ->orderBy('appointment_date', $filters['date_dir'] ?? 'asc')
            ->orderBy('time_slot')
            ->paginate($perPage);
    }

    public function statusCounts(array $filters = []): array
    {
        $query = Appointment::query();

        if (! empty($filters['branch_id']) && $filters['branch_id'] !== 'all') {
            $query->where('branch_id', $filters['branch_id']);
        }
        if (! empty($filters['date'])) {
            $query->whereDate('appointment_date', $filters['date']);
        }
        if (! empty($filters['date_from'])) {
            $query->whereDate('appointment_date', '>=', $filters['date_from']);
        }
        if (! empty($filters['date_to'])) {
            $query->whereDate('appointment_date', '<=', $filters['date_to']);
        }

        $rows = $query
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $defaults = array_fill_keys(Appointment::ALL_STATUSES, 0);

        return array_merge($defaults, $rows);
    }

    public function findAppointment(int $id): Appointment
    {
        return Appointment::query()
            ->with([
                'patient',
                'assignedDoctor:id,name,email',
                'creator:id,name',
                'updater:id,name',
                'bookingRequest:id,code,status,source',
                'histories.actor:id,name',
            ])
            ->findOrFail($id);
    }

    /**
     * WF1 - Tao lich hen moi tu UC7 (tai quay).
     */
    public function createAppointment(array $payload, User $actor): Appointment
    {
        $this->validatePatient($payload['patient_id']);
        $this->validateBranch($payload['branch_id'] ?? null);
        $this->validateTimeSlot($payload['time_slot']);
        $this->validateNoSlotConflict(
            date: $payload['appointment_date'],
            timeSlot: $payload['time_slot'],
            branchId: $payload['branch_id'] ?? null,
        );
        $this->validateNoPatientConflict(
            patientId: $payload['patient_id'],
            date: $payload['appointment_date'],
            timeSlot: $payload['time_slot'],
        );

        return DB::transaction(function () use ($payload, $actor) {
            $appointment = Appointment::create([
                'code' => Appointment::generateCode(),
                'patient_id' => $payload['patient_id'],
                'online_booking_request_id' => $payload['online_booking_request_id'] ?? null,
                'appointment_date' => $payload['appointment_date'],
                'time_slot' => $payload['time_slot'],
                'source' => $payload['source'] ?? Appointment::SOURCE_WALK_IN,
                'service_ids' => $payload['service_ids'] ?? [],
                'branch_id' => $payload['branch_id'] ?? null,
                'status' => Appointment::STATUS_WAITING_DOCTOR_ASSIGNMENT,
                'created_by' => $actor->id,
                'notes' => $payload['notes'] ?? null,
            ]);

            $this->logHistory(
                $appointment,
                action: AppointmentStatusHistory::ACTION_CREATED,
                fromStatus: null,
                toStatus: $appointment->status,
                reason: 'Tao lich hen tai quay (UC7).',
                actor: $actor,
                metadata: [
                    'source' => $appointment->source,
                    'appointment_date' => $appointment->appointment_date?->toDateString(),
                    'time_slot' => $appointment->time_slot,
                ],
            );

            return $this->findAppointment($appointment->id);
        });
    }

    /**
     * Cap nhat thong tin co ban (UC7). Khong cho doi date/time/doctor/status.
     */
    public function updateAppointment(Appointment $appointment, array $payload, User $actor): Appointment
    {
        if (! $appointment->canBeEdited()) {
            // VR7 - khong sua khi da check-in/dang_kham/hoan_tat/da_huy.
            throw ValidationException::withMessages([
                'status' => 'Khong the sua lich hen o trang thai hien tai.',
            ]);
        }

        if (array_key_exists('branch_id', $payload) && $payload['branch_id'] !== null) {
            $this->validateBranch($payload['branch_id']);
        }
        if (array_key_exists('patient_id', $payload) && $payload['patient_id'] !== null) {
            $this->validatePatient($payload['patient_id']);
        }

        return DB::transaction(function () use ($appointment, $payload, $actor) {
            $before = $appointment->only(['patient_id', 'branch_id', 'notes', 'service_ids']);

            $appointment->fill([
                'patient_id' => $payload['patient_id'] ?? $appointment->patient_id,
                'service_ids' => $payload['service_ids'] ?? $appointment->service_ids,
                'branch_id' => $payload['branch_id'] ?? $appointment->branch_id,
                'notes' => $payload['notes'] ?? $appointment->notes,
                'updated_by' => $actor->id,
            ])->save();

            $this->logHistory(
                $appointment,
                action: AppointmentStatusHistory::ACTION_UPDATED,
                fromStatus: $appointment->status,
                toStatus: $appointment->status,
                reason: 'Cap nhat thong tin lich hen.',
                actor: $actor,
                metadata: [
                    'before' => $before,
                    'after' => $appointment->only(['patient_id', 'branch_id', 'notes', 'service_ids']),
                ],
            );

            return $this->findAppointment($appointment->id);
        });
    }

    /**
     * WF3 - Doi lich. Theo bang quy uoc, sau khi doi van GIU trang thai
     * hien tai va cap nhat history (option "giu trang thai + history").
     */
    public function rescheduleAppointment(Appointment $appointment, array $payload, User $actor): Appointment
    {
        if (! $appointment->canBeRescheduled()) {
            throw ValidationException::withMessages([
                'status' => 'Khong the doi lich hen o trang thai hien tai.',
            ]);
        }

        $this->validateTimeSlot($payload['time_slot']);
        $branchId = $payload['branch_id'] ?? $appointment->branch_id;
        if ($branchId !== null) {
            $this->validateBranch($branchId);
        }
        $this->validateNoSlotConflict(
            date: $payload['appointment_date'],
            timeSlot: $payload['time_slot'],
            branchId: $branchId,
            excludeAppointmentId: $appointment->id,
        );
        $this->validateNoPatientConflict(
            patientId: $appointment->patient_id,
            date: $payload['appointment_date'],
            timeSlot: $payload['time_slot'],
            excludeAppointmentId: $appointment->id,
        );

        return DB::transaction(function () use ($appointment, $payload, $actor, $branchId) {
            $oldDate = $appointment->appointment_date?->toDateString();
            $oldSlot = $appointment->time_slot;

            $appointment->fill([
                'appointment_date' => $payload['appointment_date'],
                'time_slot' => $payload['time_slot'],
                'branch_id' => $branchId,
                'reschedule_reason' => $payload['reason'],
                'rescheduled_at' => now(),
                'updated_by' => $actor->id,
            ])->save();

            $this->logHistory(
                $appointment,
                action: AppointmentStatusHistory::ACTION_RESCHEDULED,
                fromStatus: $appointment->status,
                toStatus: $appointment->status,
                reason: $payload['reason'],
                actor: $actor,
                metadata: [
                    'from' => ['date' => $oldDate, 'time_slot' => $oldSlot],
                    'to' => [
                        'date' => Carbon::parse($payload['appointment_date'])->toDateString(),
                        'time_slot' => $payload['time_slot'],
                    ],
                ],
            );

            return $this->findAppointment($appointment->id);
        });
    }

    /**
     * WF4 - Huy lich (VR9, VR10). Giu reference den online booking request goc
     * khi co (AC21).
     */
    public function cancelAppointment(Appointment $appointment, string $reason, User $actor): Appointment
    {
        // VR10 - khong huy lich da hoan tat.
        if ($appointment->status === Appointment::STATUS_COMPLETED) {
            throw ValidationException::withMessages([
                'status' => 'Khong the huy lich hen da hoan tat.',
            ]);
        }
        if ($appointment->status === Appointment::STATUS_CANCELLED) {
            throw ValidationException::withMessages([
                'status' => 'Lich hen da o trang thai da huy.',
            ]);
        }
        if (! $appointment->canBeCancelled()) {
            throw ValidationException::withMessages([
                'status' => 'Khong the huy lich hen o trang thai hien tai.',
            ]);
        }

        return DB::transaction(function () use ($appointment, $reason, $actor) {
            $previousStatus = $appointment->status;

            $appointment->fill([
                'status' => Appointment::STATUS_CANCELLED,
                'cancel_reason' => $reason,
                'cancelled_at' => now(),
                'updated_by' => $actor->id,
            ])->save();

            $this->logHistory(
                $appointment,
                action: AppointmentStatusHistory::ACTION_CANCELLED,
                fromStatus: $previousStatus,
                toStatus: Appointment::STATUS_CANCELLED,
                reason: $reason,
                actor: $actor,
            );

            return $this->findAppointment($appointment->id);
        });
    }

    /**
     * UC8 - List lich hen `cho_phan_cong_bac_si` cho dispatch queue.
     */
    public function pendingForAssignment(array $filters = []): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 20);
        $perPage = max(1, min(100, $perPage));

        $query = Appointment::query()
            ->with(['patient:id,patient_code,full_name,phone', 'creator:id,name'])
            ->where('status', Appointment::STATUS_WAITING_DOCTOR_ASSIGNMENT);

        if (! empty($filters['branch_id']) && $filters['branch_id'] !== 'all') {
            $query->where('branch_id', $filters['branch_id']);
        }
        if (! empty($filters['date'])) {
            $query->whereDate('appointment_date', $filters['date']);
        }
        if (! empty($filters['date_from'])) {
            $query->whereDate('appointment_date', '>=', $filters['date_from']);
        }
        if (! empty($filters['date_to'])) {
            $query->whereDate('appointment_date', '<=', $filters['date_to']);
        }
        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(function ($q) use ($term) {
                $q->where('code', 'like', $term)
                    ->orWhereHas('patient', function ($pq) use ($term) {
                        $pq->where('full_name', 'like', $term)
                            ->orWhere('phone', 'like', $term)
                            ->orWhere('patient_code', 'like', $term);
                    });
            });
        }

        return $query
            ->orderBy('appointment_date')
            ->orderBy('time_slot')
            ->paginate($perPage);
    }

    /**
     * UC8 - Phan cong bac si (SR1 -> SR2). Cap nhat
     * status `cho_phan_cong_bac_si` -> `da_phan_cong_bac_si`,
     * ghi history action=assigned.
     */
    public function assignDoctor(Appointment $appointment, int $doctorUserId, array $payload, User $actor): Appointment
    {
        return DB::transaction(function () use ($appointment, $doctorUserId, $payload, $actor) {
            // VR15 - lock row de tranh concurrent update.
            $locked = Appointment::query()->lockForUpdate()->find($appointment->id);
            if (! $locked) {
                throw ValidationException::withMessages([
                    'appointment_id' => 'VR1: Khong tim thay lich hen.',
                ]);
            }

            // VR2 / SR5 - chi cho phep tu trang thai cho_phan_cong_bac_si.
            if (! $locked->canAssignDoctor()) {
                throw ValidationException::withMessages([
                    'status' => 'VR2: Trang thai lich hen khong cho phep phan cong bac si.',
                ]);
            }

            $availability = app(DoctorAvailabilityService::class);
            $check = $availability->validateAssignment($doctorUserId, $locked, ignoreSelf: true);
            if (! $check['ok']) {
                throw ValidationException::withMessages($check['errors']);
            }

            $locked->fill([
                'assigned_doctor_id' => $doctorUserId,
                'status' => Appointment::STATUS_DOCTOR_ASSIGNED,
                'updated_by' => $actor->id,
            ])->save();

            $this->logHistory(
                $locked,
                action: AppointmentStatusHistory::ACTION_ASSIGNED,
                fromStatus: Appointment::STATUS_WAITING_DOCTOR_ASSIGNMENT,
                toStatus: Appointment::STATUS_DOCTOR_ASSIGNED,
                reason: $payload['note'] ?? null,
                actor: $actor,
                metadata: [
                    'new_doctor_id' => $doctorUserId,
                    'note' => $payload['note'] ?? null,
                ],
            );

            return $this->findAppointment($locked->id);
        });
    }

    /**
     * UC8 - Doi bac si (AC9, AC10, AC11). Giu nguyen status (SR3),
     * ghi history action=reassigned voi metadata.old/new.
     *
     * Voi status `da_check_in`, yeu cau actor co role admin (VR12 / SEC3).
     */
    public function reassignDoctor(Appointment $appointment, int $newDoctorUserId, array $payload, User $actor): Appointment
    {
        return DB::transaction(function () use ($appointment, $newDoctorUserId, $payload, $actor) {
            $locked = Appointment::query()->lockForUpdate()->find($appointment->id);
            if (! $locked) {
                throw ValidationException::withMessages([
                    'appointment_id' => 'VR1: Khong tim thay lich hen.',
                ]);
            }

            if (! $locked->canReassignDoctor()) {
                throw ValidationException::withMessages([
                    'status' => 'VR11: Trang thai lich hen khong cho phep doi bac si.',
                ]);
            }

            // VR12 / SEC3 - lich da check-in chi admin moi duoc doi.
            if ($locked->status === Appointment::STATUS_CHECKED_IN && ! $actor->hasRole('admin')) {
                throw ValidationException::withMessages([
                    'permission' => 'VR12: Lich da check-in chi Admin moi co quyen doi bac si.',
                ]);
            }

            $oldDoctorId = $locked->assigned_doctor_id;
            if ($oldDoctorId === $newDoctorUserId) {
                throw ValidationException::withMessages([
                    'doctor_id' => 'VR13: Bac si moi trung voi bac si hien tai.',
                ]);
            }

            $availability = app(DoctorAvailabilityService::class);
            $check = $availability->validateAssignment($newDoctorUserId, $locked, ignoreSelf: true);
            if (! $check['ok']) {
                throw ValidationException::withMessages($check['errors']);
            }

            $locked->fill([
                'assigned_doctor_id' => $newDoctorUserId,
                'updated_by' => $actor->id,
            ])->save();

            $this->logHistory(
                $locked,
                action: AppointmentStatusHistory::ACTION_REASSIGNED,
                fromStatus: $locked->status,
                toStatus: $locked->status,
                reason: $payload['reason'],
                actor: $actor,
                metadata: [
                    'old_doctor_id' => $oldDoctorId,
                    'new_doctor_id' => $newDoctorUserId,
                    'note' => $payload['note'] ?? null,
                ],
            );

            return $this->findAppointment($locked->id);
        });
    }

    /**
     * UC8 - Huy phan cong bac si (AC12, AC13, AC14). Status quay ve
     * `cho_phan_cong_bac_si` (SR4), ghi history action=unassigned.
     */
    public function unassignDoctor(Appointment $appointment, array $payload, User $actor): Appointment
    {
        return DB::transaction(function () use ($appointment, $payload, $actor) {
            $locked = Appointment::query()->lockForUpdate()->find($appointment->id);
            if (! $locked) {
                throw ValidationException::withMessages([
                    'appointment_id' => 'VR1: Khong tim thay lich hen.',
                ]);
            }

            if (! $locked->canUnassignDoctor()) {
                throw ValidationException::withMessages([
                    'status' => 'VR11: Trang thai lich hen khong cho phep huy phan cong.',
                ]);
            }

            $oldDoctorId = $locked->assigned_doctor_id;

            $locked->fill([
                'assigned_doctor_id' => null,
                'status' => Appointment::STATUS_WAITING_DOCTOR_ASSIGNMENT,
                'updated_by' => $actor->id,
            ])->save();

            $this->logHistory(
                $locked,
                action: AppointmentStatusHistory::ACTION_UNASSIGNED,
                fromStatus: Appointment::STATUS_DOCTOR_ASSIGNED,
                toStatus: Appointment::STATUS_WAITING_DOCTOR_ASSIGNMENT,
                reason: $payload['reason'],
                actor: $actor,
                metadata: [
                    'old_doctor_id' => $oldDoctorId,
                    'note' => $payload['note'] ?? null,
                ],
            );

            return $this->findAppointment($locked->id);
        });
    }

    /**
     * UC7 - Du lieu cho calendar view (Day/Week/Month).
     *
     * KHONG mutate du lieu. Chi doc tu DB voi cac filter co ban
     * (branch_id, doctor_id) va bao buoc moc thoi gian theo view.
     */
    public function calendarData(string $view, ?string $date, array $filters = []): array
    {
        $date = $date ?: now()->toDateString();
        $reference = Carbon::parse($date);

        return match ($view) {
            'week' => $this->calendarWeek($reference, $filters),
            'month' => $this->calendarMonth($reference, $filters),
            default => $this->calendarDay($reference, $filters),
        };
    }

    protected function buildSlotCatalog(): array
    {
        return array_map(function (string $slot) {
            [$start, $end] = explode('-', $slot);
            $endLabel = strlen($end) === 4
                ? substr($end, 0, 2).':'.substr($end, 2)
                : str_pad($end, 2, '0', STR_PAD_LEFT).':00';

            return [
                'id' => $slot,
                'label' => str_pad($start, 2, '0', STR_PAD_LEFT).':00 - '.$endLabel,
                'start' => $start,
                'break' => in_array($slot, self::BREAK_SLOTS, true),
            ];
        }, self::TIME_SLOTS);
    }

    protected function calendarBaseQuery(array $filters)
    {
        $query = Appointment::query()
            ->with([
                'patient:id,patient_code,full_name,phone',
                'assignedDoctor:id,name,email',
            ]);

        if (! empty($filters['branch_id']) && $filters['branch_id'] !== 'all') {
            $query->where('branch_id', $filters['branch_id']);
        }
        if (! empty($filters['doctor_id']) && $filters['doctor_id'] !== 'all') {
            $query->where('assigned_doctor_id', $filters['doctor_id']);
        }
        if (! empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        return $query;
    }

    protected function summarizeAppointment(Appointment $apt): array
    {
        return [
            'id' => $apt->id,
            'code' => $apt->code,
            'status' => $apt->status,
            'time_slot' => $apt->time_slot,
            'appointment_date' => $apt->appointment_date?->toDateString(),
            'branch_id' => $apt->branch_id,
            'source' => $apt->source,
            'service_ids' => $apt->service_ids ?? [],
            'patient' => $apt->patient ? [
                'id' => $apt->patient->id,
                'code' => $apt->patient->patient_code,
                'name' => $apt->patient->full_name,
                'phone' => $apt->patient->phone,
            ] : null,
            'assigned_doctor' => $apt->assignedDoctor ? [
                'id' => $apt->assignedDoctor->id,
                'name' => $apt->assignedDoctor->name,
            ] : null,
        ];
    }

    /**
     * Day view - tra ve grid `ghe (theo bac si) x slot` + danh sach
     * lich chua phan cong + counts.
     */
    protected function calendarDay(Carbon $date, array $filters): array
    {
        $slots = $this->buildSlotCatalog();
        $appointments = $this->calendarBaseQuery($filters)
            ->whereDate('appointment_date', $date->toDateString())
            ->orderBy('time_slot')
            ->orderBy('id')
            ->get();

        $assigned = $appointments->filter(fn (Appointment $a) => $a->assigned_doctor_id !== null);
        $unassigned = $appointments->filter(fn (Appointment $a) => $a->assigned_doctor_id === null);

        $doctorsById = [];
        foreach ($assigned as $apt) {
            $doc = $apt->assignedDoctor;
            if ($doc && ! isset($doctorsById[$doc->id])) {
                $doctorsById[$doc->id] = [
                    'id' => $doc->id,
                    'name' => $doc->name,
                ];
            }
        }
        $doctors = array_values($doctorsById);
        usort($doctors, fn ($a, $b) => strcmp($a['name'], $b['name']));

        $chairs = [];
        foreach ($doctors as $i => $doc) {
            $chairs[] = [
                'chair_no' => $i + 1,
                'label' => 'Ghe '.($i + 1),
                'doctor' => $doc,
            ];
        }

        $cells = [];
        foreach ($chairs as $chair) {
            foreach ($slots as $slot) {
                $cells[$chair['doctor']['id']][$slot['id']] = null;
            }
        }
        foreach ($assigned as $apt) {
            $cells[$apt->assigned_doctor_id][$apt->time_slot] = $this->summarizeAppointment($apt);
        }

        $slotFreeCounts = [];
        $chairCount = count($chairs);
        foreach ($slots as $slot) {
            if ($slot['break']) {
                $slotFreeCounts[$slot['id']] = 0;
                continue;
            }
            $occupied = 0;
            foreach ($chairs as $chair) {
                if (! empty($cells[$chair['doctor']['id']][$slot['id']])) {
                    $occupied++;
                }
            }
            $slotFreeCounts[$slot['id']] = max(0, $chairCount - $occupied);
        }

        $statusCounts = $this->statusCounts(['date' => $date->toDateString(), 'branch_id' => $filters['branch_id'] ?? null]);

        return [
            'view' => 'day',
            'date' => $date->toDateString(),
            'slots' => $slots,
            'chairs' => $chairs,
            'cells' => $cells,
            'unassigned' => $unassigned->values()->map(fn ($a) => $this->summarizeAppointment($a))->all(),
            'slot_free_counts' => $slotFreeCounts,
            'status_counts' => $statusCounts,
            'total' => $appointments->count(),
        ];
    }

    /**
     * Week view - 7 ngay (T2 - CN) x slots. Moi cell la mang appointments.
     */
    protected function calendarWeek(Carbon $reference, array $filters): array
    {
        $start = $reference->copy()->startOfWeek(Carbon::MONDAY);
        $end = $start->copy()->endOfWeek(Carbon::SUNDAY);
        $slots = $this->buildSlotCatalog();

        $appointments = $this->calendarBaseQuery($filters)
            ->whereDate('appointment_date', '>=', $start->toDateString())
            ->whereDate('appointment_date', '<=', $end->toDateString())
            ->orderBy('appointment_date')
            ->orderBy('time_slot')
            ->get();

        $days = [];
        for ($i = 0; $i < 7; $i++) {
            $d = $start->copy()->addDays($i);
            $days[] = [
                'date' => $d->toDateString(),
                'weekday' => $d->isoFormat('ddd'),
                'day_of_month' => $d->day,
                'is_today' => $d->isToday(),
            ];
        }

        $cells = [];
        foreach ($days as $day) {
            foreach ($slots as $slot) {
                $cells[$day['date']][$slot['id']] = [];
            }
        }
        foreach ($appointments as $apt) {
            $key = $apt->appointment_date?->toDateString();
            if ($key && isset($cells[$key][$apt->time_slot])) {
                $cells[$key][$apt->time_slot][] = $this->summarizeAppointment($apt);
            }
        }

        $statusCounts = $this->statusCounts([
            'date_from' => $start->toDateString(),
            'date_to' => $end->toDateString(),
            'branch_id' => $filters['branch_id'] ?? null,
        ]);

        return [
            'view' => 'week',
            'date' => $reference->toDateString(),
            'range_start' => $start->toDateString(),
            'range_end' => $end->toDateString(),
            'slots' => $slots,
            'days' => $days,
            'cells' => $cells,
            'status_counts' => $statusCounts,
            'total' => $appointments->count(),
        ];
    }

    /**
     * Month view - luoi 7 x N tuan. Moi cell la 1 ngay voi counts theo status.
     */
    protected function calendarMonth(Carbon $reference, array $filters): array
    {
        $monthStart = $reference->copy()->startOfMonth();
        $monthEnd = $reference->copy()->endOfMonth();
        $gridStart = $monthStart->copy()->startOfWeek(Carbon::MONDAY);
        $gridEnd = $monthEnd->copy()->endOfWeek(Carbon::SUNDAY);

        $rows = $this->calendarBaseQuery($filters)
            ->whereDate('appointment_date', '>=', $gridStart->toDateString())
            ->whereDate('appointment_date', '<=', $gridEnd->toDateString())
            ->select('appointment_date', 'status', DB::raw('COUNT(*) as total'))
            ->groupBy('appointment_date', 'status')
            ->get();

        $countsByDate = [];
        foreach ($rows as $row) {
            $key = Carbon::parse($row->appointment_date)->toDateString();
            $countsByDate[$key][$row->status] = (int) $row->total;
            $countsByDate[$key]['_total'] = ($countsByDate[$key]['_total'] ?? 0) + (int) $row->total;
        }

        $days = [];
        $cursor = $gridStart->copy();
        while ($cursor->lte($gridEnd)) {
            $key = $cursor->toDateString();
            $days[] = [
                'date' => $key,
                'day_of_month' => $cursor->day,
                'in_month' => $cursor->month === $monthStart->month,
                'is_today' => $cursor->isToday(),
                'weekday' => $cursor->isoFormat('ddd'),
                'counts' => $countsByDate[$key] ?? [],
                'total' => $countsByDate[$key]['_total'] ?? 0,
            ];
            $cursor->addDay();
        }

        return [
            'view' => 'month',
            'date' => $reference->toDateString(),
            'month_start' => $monthStart->toDateString(),
            'month_end' => $monthEnd->toDateString(),
            'days' => $days,
            'weeks' => array_chunk($days, 7),
            'status_counts' => $this->statusCounts([
                'date_from' => $monthStart->toDateString(),
                'date_to' => $monthEnd->toDateString(),
                'branch_id' => $filters['branch_id'] ?? null,
            ]),
        ];
    }

    /**
     * VR1 - Bat buoc co ho so benh nhan hop le.
     */
    protected function validatePatient(int $patientId): void
    {
        $patient = Patient::query()->find($patientId);
        if (! $patient) {
            throw ValidationException::withMessages([
                'patient_id' => 'Khong tim thay ho so benh nhan.',
            ]);
        }
        if ($patient->status !== Patient::STATUS_ACTIVE) {
            throw ValidationException::withMessages([
                'patient_id' => 'Ho so benh nhan khong con o trang thai hoat dong.',
            ]);
        }
    }

    /**
     * VR14 - Chi nhanh phai active.
     */
    protected function validateBranch(?string $branchId): void
    {
        if ($branchId === null) {
            return;
        }
        $branch = Branch::query()->where('code', $branchId)->orWhere('id', $branchId)->first();
        if (! $branch) {
            throw ValidationException::withMessages([
                'branch_id' => 'Khong tim thay chi nhanh.',
            ]);
        }
        if ($branch->status !== 'active') {
            throw ValidationException::withMessages([
                'branch_id' => 'Chi nhanh khong con hoat dong.',
            ]);
        }
    }

    /**
     * VR3 - Khung gio phai nam trong catalog mac dinh (gio hoat dong).
     */
    protected function validateTimeSlot(string $timeSlot): void
    {
        if (! in_array($timeSlot, self::TIME_SLOTS, true)) {
            throw ValidationException::withMessages([
                'time_slot' => 'Khung gio khong hop le.',
            ]);
        }
        if (in_array($timeSlot, self::BREAK_SLOTS, true)) {
            throw ValidationException::withMessages([
                'time_slot' => 'Khung gio nay la ca nghi.',
            ]);
        }
    }

    /**
     * VR5 - Slot da co lich hen active tai cung chi nhanh + thoi diem.
     *
     * Mac dinh moi slot/branch chi co 1 lich hen (don gian; co the mo rong
     * sau khi UC8 quan ly nhieu phong/ghe).
     */
    protected function validateNoSlotConflict(string $date, string $timeSlot, ?string $branchId, ?int $excludeAppointmentId = null): void
    {
        $query = Appointment::query()
            ->activeForSlot()
            ->whereDate('appointment_date', $date)
            ->where('time_slot', $timeSlot);

        if ($branchId !== null) {
            $query->where('branch_id', $branchId);
        }
        if ($excludeAppointmentId !== null) {
            $query->where('id', '!=', $excludeAppointmentId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'time_slot' => 'Khung gio nay da kin lich tai chi nhanh duoc chon.',
            ]);
        }
    }

    /**
     * VR6 - Mot benh nhan khong duoc co 2 lich active cung thoi diem.
     */
    protected function validateNoPatientConflict(int $patientId, string $date, string $timeSlot, ?int $excludeAppointmentId = null): void
    {
        $query = Appointment::query()
            ->activeForSlot()
            ->where('patient_id', $patientId)
            ->whereDate('appointment_date', $date)
            ->where('time_slot', $timeSlot);

        if ($excludeAppointmentId !== null) {
            $query->where('id', '!=', $excludeAppointmentId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'time_slot' => 'Benh nhan da co lich hen khac vao khung gio nay.',
            ]);
        }
    }

    protected function logHistory(
        Appointment $appointment,
        string $action,
        ?string $fromStatus,
        ?string $toStatus,
        ?string $reason,
        User $actor,
        array $metadata = [],
    ): AppointmentStatusHistory {
        return AppointmentStatusHistory::create([
            'appointment_id' => $appointment->id,
            'action' => $action,
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'reason' => $reason,
            'metadata' => $metadata,
            'actor_id' => $actor->id,
            'actor_name' => $actor->name,
            'created_at' => now(),
        ]);
    }
}
