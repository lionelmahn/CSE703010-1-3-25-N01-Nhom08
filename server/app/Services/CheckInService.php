<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\AppointmentQueueEntry;
use App\Models\AppointmentStatusHistory;
use App\Models\ExaminationHistory;
use App\Models\ExaminationSession;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

/**
 * UC11 - Business logic tiep nhan / check-in benh nhan.
 *
 * Trach nhiem:
 *  - Check-in lich hen co san (Main Flow, AC4-AC9).
 *  - Mark no-show (A4, AC14, VR12).
 *  - Cancel check-in + restore status (A5, AC15-AC16, VR9-VR10, VR14, SR4).
 *  - Quan ly hang cho (`appointment_queue_entries`) - DR52, DR53.
 *  - List + queue + queue stats cho FE Reception page.
 *
 * KHONG xu ly: tao benh nhan moi (UC5), tao lich hen moi (UC7), phan cong
 * bac si (UC8), bat dau/ket thuc kham (UC3.2). Walk-in (A1) duoc orchestrate
 * o FE bang cach goi tuan tu UC5 -> UC7 -> UC8 (optional) -> UC11.
 */
class CheckInService
{
    /**
     * Nguong tinh `arrival_flag` (phut) so voi gio bat dau time_slot.
     * Co the dua sang config sau neu admin muon chinh sua (xem cau hoi #2
     * trong UC11 analysis).
     */
    public const EARLY_THRESHOLD_MIN = -10;
    public const ON_TIME_LATE_LIMIT = 5;
    public const LATE_LIMIT = 15;

    /**
     * Nguong canh bao "qua han" cho queue stats (phut).
     */
    public const OVERDUE_WAIT_MIN = 30;

    /**
     * UC11 - GET /api/reception/today-appointments (AC1, AC2, AC22).
     *
     * @param  array<string,mixed>  $filters
     */
    public function listTodayAppointments(array $filters = []): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 20);
        $perPage = max(1, min(100, $perPage));

        $date = ! empty($filters['date'])
            ? Carbon::parse($filters['date'])->toDateString()
            : Carbon::today()->toDateString();

        $query = Appointment::query()
            ->with([
                'patient:id,patient_code,full_name,phone,email,gender,dob,total_debt,allergies,medical_history',
                'assignedDoctor:id,name,email',
                'creator:id,name',
                'checkedInBy:id,name',
            ])
            ->whereDate('appointment_date', $date);

        if (! empty($filters['branch_id']) && $filters['branch_id'] !== 'all') {
            $query->where('branch_id', $filters['branch_id']);
        }

        $arrivalFilter = $filters['arrival_filter'] ?? 'all';
        if ($arrivalFilter === 'upcoming') {
            $query->whereIn('status', Appointment::CHECK_IN_ALLOWED_STATUSES);
        } elseif ($arrivalFilter === 'checked_in') {
            $query->where('status', Appointment::STATUS_CHECKED_IN);
        } elseif ($arrivalFilter === 'in_progress') {
            $query->where('status', Appointment::STATUS_IN_PROGRESS);
        } elseif ($arrivalFilter === 'other') {
            $query->whereIn('status', [
                Appointment::STATUS_NO_SHOW,
                Appointment::STATUS_COMPLETED,
                Appointment::STATUS_CANCELLED,
            ]);
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
            ->orderByRaw("CASE WHEN status = 'da_check_in' THEN 0 WHEN status IN ('cho_phan_cong_bac_si','da_phan_cong_bac_si','da_xac_nhan') THEN 1 ELSE 2 END")
            ->orderBy('time_slot')
            ->paginate($perPage);
    }

    /**
     * UC11 - GET /api/reception/today-appointments counts theo filter.
     */
    public function todayCounts(array $filters = []): array
    {
        $date = ! empty($filters['date'])
            ? Carbon::parse($filters['date'])->toDateString()
            : Carbon::today()->toDateString();

        $base = Appointment::query()->whereDate('appointment_date', $date);
        if (! empty($filters['branch_id']) && $filters['branch_id'] !== 'all') {
            $base->where('branch_id', $filters['branch_id']);
        }

        $counts = (clone $base)->selectRaw('status, COUNT(*) as c')
            ->groupBy('status')->pluck('c', 'status')->all();

        $upcoming = 0;
        foreach (Appointment::CHECK_IN_ALLOWED_STATUSES as $s) {
            $upcoming += (int) ($counts[$s] ?? 0);
        }
        $other = 0;
        foreach ([Appointment::STATUS_NO_SHOW, Appointment::STATUS_COMPLETED, Appointment::STATUS_CANCELLED] as $s) {
            $other += (int) ($counts[$s] ?? 0);
        }

        return [
            'all' => array_sum($counts),
            'upcoming' => $upcoming,
            'checked_in' => (int) ($counts[Appointment::STATUS_CHECKED_IN] ?? 0),
            'in_progress' => (int) ($counts[Appointment::STATUS_IN_PROGRESS] ?? 0),
            'no_show' => (int) ($counts[Appointment::STATUS_NO_SHOW] ?? 0),
            'other' => $other,
        ];
    }

    /**
     * UC11 - Main Flow: check-in 1 lich hen (AC4-AC9, BR5-BR9, SR1-SR3).
     *
     * @param  array{arrival_flag?:string,note?:string}  $payload
     */
    public function checkIn(Appointment $appointment, array $payload, User $actor): Appointment
    {
        return DB::transaction(function () use ($appointment, $payload, $actor) {
            // VR15 - lock row chong race condition double-click.
            $locked = Appointment::query()->lockForUpdate()->find($appointment->id);
            if (! $locked) {
                throw ValidationException::withMessages([
                    'appointment_id' => 'VR1: Khong tim thay lich hen.',
                ]);
            }

            // VR3-VR5: chi cho phep tu 3 status hop le.
            if (! $locked->canBeCheckedIn()) {
                throw ValidationException::withMessages([
                    'status' => 'VR5: Trang thai lich hen khong cho phep check-in.',
                ]);
            }

            // VR2: BN phai ton tai va active.
            if (! $locked->patient_id) {
                throw ValidationException::withMessages([
                    'patient_id' => 'VR2: Lich hen chua gan benh nhan.',
                ]);
            }
            $patient = Patient::find($locked->patient_id);
            if (! $patient || $patient->status !== Patient::STATUS_ACTIVE) {
                throw ValidationException::withMessages([
                    'patient_id' => 'VR2: Ho so benh nhan khong hop le hoac da bi vo hieu.',
                ]);
            }

            // BR17 - tinh `arrival_flag` neu FE khong gui, dung lam hint.
            $arrivalFlag = $payload['arrival_flag'] ?? null;
            if (! $arrivalFlag) {
                $arrivalFlag = $this->computeArrivalFlag($locked, now());
            }

            $fromStatus = $locked->status;

            $locked->fill([
                'pre_checkin_status' => $fromStatus,
                'status' => Appointment::STATUS_CHECKED_IN,
                'checked_in_at' => now(),
                'checked_in_by' => $actor->id,
                'arrival_flag' => $arrivalFlag,
                'updated_by' => $actor->id,
                // BR (cancel check-in chi dung khi co snapshot).
                'check_in_cancelled_at' => null,
                'check_in_cancelled_by' => null,
            ])->save();

            // BR6-BR8: tao queue entry voi bucket dua tren bac si.
            $bucket = $locked->assigned_doctor_id
                ? AppointmentQueueEntry::BUCKET_WAITING
                : AppointmentQueueEntry::BUCKET_UNASSIGNED;

            $now = now();
            $code = AppointmentQueueEntry::generateCode($locked->branch_id, $now);
            $queueNumber = $this->nextQueueNumber($locked->branch_id, $now);

            $entry = AppointmentQueueEntry::create([
                'code' => $code,
                'appointment_id' => $locked->id,
                'patient_id' => $locked->patient_id,
                'assigned_doctor_id' => $locked->assigned_doctor_id,
                'branch_id' => $locked->branch_id,
                'bucket' => $bucket,
                'queue_number' => $queueNumber,
                'entered_at' => $now,
                'created_by' => $actor->id,
            ]);

            $session = ExaminationSession::query()
                ->where('appointment_id', $locked->id)
                ->whereIn('status', ExaminationSession::ACTIVE_STATUSES)
                ->lockForUpdate()
                ->first();

            if (! $session) {
                $session = ExaminationSession::create([
                    'code' => ExaminationSession::generateCode($now),
                    'patient_id' => $locked->patient_id,
                    'appointment_id' => $locked->id,
                    'queue_entry_id' => $entry->id,
                    'doctor_id' => $locked->assigned_doctor_id,
                    'status' => ExaminationSession::STATUS_CHO_KHAM,
                    'created_by' => $actor->id,
                    'updated_by' => $actor->id,
                ]);

                ExaminationHistory::create([
                    'examination_id' => $session->id,
                    'action' => 'created_from_checkin',
                    'actor_id' => $actor->id,
                    'actor_name' => $actor->name,
                    'after' => [
                        'appointment_id' => $locked->id,
                        'queue_entry_id' => $entry->id,
                        'status' => $session->status,
                    ],
                    'reason' => 'Tao phien cho kham sau check-in',
                    'created_at' => $now,
                ]);
            } elseif (! $session->queue_entry_id) {
                $session->forceFill([
                    'queue_entry_id' => $entry->id,
                    'updated_by' => $actor->id,
                ])->save();
            }

            $this->logHistory(
                $locked,
                action: AppointmentStatusHistory::ACTION_CHECKED_IN,
                fromStatus: $fromStatus,
                toStatus: Appointment::STATUS_CHECKED_IN,
                reason: $payload['note'] ?? null,
                actor: $actor,
                metadata: [
                    'arrival_flag' => $arrivalFlag,
                    'queue_code' => $entry->code,
                    'queue_bucket' => $bucket,
                    'has_doctor' => (bool) $locked->assigned_doctor_id,
                ],
            );

            // BR15 - thong bao noi bo cho bac si khong rollback nghiep vu.
            // Hien tai dung Log facade + queue board polling lam kenh noi bo
            // (xem analysis cau hoi #7). NotificationService email out of
            // scope cho event check-in.
            DB::afterCommit(function () use ($locked) {
                try {
                    Log::info('UC11 internal: appointment checked-in', [
                        'appointment_id' => $locked->id,
                        'appointment_code' => $locked->code,
                        'doctor_id' => $locked->assigned_doctor_id,
                        'branch_id' => $locked->branch_id,
                    ]);
                } catch (\Throwable $e) {
                    // best-effort; khong throw.
                }
            });

            return $locked->fresh([
                'patient',
                'assignedDoctor',
                'checkedInBy',
                'queueEntries',
                'histories',
            ]);
        });
    }

    /**
     * UC11 - A4: mark no-show (VR12, SR5).
     */
    public function markNoShow(Appointment $appointment, array $payload, User $actor): Appointment
    {
        return DB::transaction(function () use ($appointment, $payload, $actor) {
            $locked = Appointment::query()->lockForUpdate()->find($appointment->id);
            if (! $locked) {
                throw ValidationException::withMessages([
                    'appointment_id' => 'VR1: Khong tim thay lich hen.',
                ]);
            }

            if (! $locked->canMarkNoShow()) {
                throw ValidationException::withMessages([
                    'status' => 'VR12: Trang thai lich hen khong cho phep mark khong den.',
                ]);
            }

            $fromStatus = $locked->status;
            $now = now();

            $locked->fill([
                'status' => Appointment::STATUS_NO_SHOW,
                'no_show_at' => $now,
                'no_show_by' => $actor->id,
                'no_show_reason' => $payload['reason'],
                'updated_by' => $actor->id,
            ])->save();

            // Cancel cac queue entry active neu co (truong hop ngoai le: lich
            // co queue entry tu walk-in flow lo? bao mat).
            AppointmentQueueEntry::query()
                ->where('appointment_id', $locked->id)
                ->whereIn('bucket', AppointmentQueueEntry::ACTIVE_BUCKETS)
                ->update([
                    'bucket' => AppointmentQueueEntry::BUCKET_CANCELLED,
                    'cancelled_at' => $now,
                ]);

            $this->logHistory(
                $locked,
                action: AppointmentStatusHistory::ACTION_NO_SHOW,
                fromStatus: $fromStatus,
                toStatus: Appointment::STATUS_NO_SHOW,
                reason: $payload['reason'],
                actor: $actor,
                metadata: [
                    'note' => $payload['note'] ?? null,
                ],
            );

            return $locked->fresh(['patient', 'assignedDoctor', 'noShowBy', 'histories']);
        });
    }

    /**
     * UC11 - A5: huy check-in, restore status (VR9-VR10, VR14, SR4).
     */
    public function cancelCheckIn(Appointment $appointment, array $payload, User $actor): Appointment
    {
        return DB::transaction(function () use ($appointment, $payload, $actor) {
            $locked = Appointment::query()->lockForUpdate()->find($appointment->id);
            if (! $locked) {
                throw ValidationException::withMessages([
                    'appointment_id' => 'VR1: Khong tim thay lich hen.',
                ]);
            }

            // VR10 - chi cho phep khi van con `da_check_in`.
            if (! $locked->canCancelCheckIn()) {
                throw ValidationException::withMessages([
                    'status' => 'VR10: Lich hen da bat dau kham hoac khong o trang thai check-in.',
                ]);
            }

            $now = now();
            $restoreStatus = $locked->pre_checkin_status ?: Appointment::STATUS_DOCTOR_ASSIGNED;

            $locked->fill([
                'status' => $restoreStatus,
                'check_in_cancelled_at' => $now,
                'check_in_cancelled_by' => $actor->id,
                'updated_by' => $actor->id,
                // Giu lai checked_in_at/by de audit; chi reset pre_checkin_status.
                'pre_checkin_status' => null,
            ])->save();

            // Cancel queue entry active.
            AppointmentQueueEntry::query()
                ->where('appointment_id', $locked->id)
                ->whereIn('bucket', AppointmentQueueEntry::ACTIVE_BUCKETS)
                ->update([
                    'bucket' => AppointmentQueueEntry::BUCKET_CANCELLED,
                    'cancelled_at' => $now,
                ]);

            $this->logHistory(
                $locked,
                action: AppointmentStatusHistory::ACTION_CHECK_IN_CANCELLED,
                fromStatus: Appointment::STATUS_CHECKED_IN,
                toStatus: $restoreStatus,
                reason: $payload['reason'],
                actor: $actor,
                metadata: [
                    'note' => $payload['note'] ?? null,
                    'previous_checked_in_at' => optional($locked->checked_in_at)->toIso8601String(),
                ],
            );

            return $locked->fresh(['patient', 'assignedDoctor', 'checkInCancelledBy', 'histories']);
        });
    }

    /**
     * UC11 - GET /api/reception/queue (AC7, AC8, UI11).
     *
     * @param  array<string,mixed>  $filters
     * @return array{buckets:array<string,array>,summary:array,avg_wait_min:int}
     */
    public function queue(array $filters = []): array
    {
        $date = ! empty($filters['date'])
            ? Carbon::parse($filters['date'])->toDateString()
            : Carbon::today()->toDateString();

        $query = AppointmentQueueEntry::query()
            ->active()
            ->with([
                'patient:id,patient_code,full_name,phone',
                'assignedDoctor:id,name',
                'appointment:id,code,time_slot,branch_id,assigned_doctor_id,status,arrival_flag,service_ids,notes',
            ])
            ->whereDate('entered_at', $date);

        if (! empty($filters['branch_id']) && $filters['branch_id'] !== 'all') {
            $query->where('branch_id', $filters['branch_id']);
        }
        if (! empty($filters['doctor_id']) && $filters['doctor_id'] !== 'all') {
            $query->where('assigned_doctor_id', $filters['doctor_id']);
        }
        if (! empty($filters['bucket']) && $filters['bucket'] !== 'all') {
            $query->where('bucket', $filters['bucket']);
        }

        $entries = $query->orderBy('entered_at')->get();

        $buckets = [
            AppointmentQueueEntry::BUCKET_UNASSIGNED => [],
            AppointmentQueueEntry::BUCKET_WAITING => [],
            AppointmentQueueEntry::BUCKET_READY => [],
            AppointmentQueueEntry::BUCKET_IN_PROGRESS => [],
        ];

        $now = now();
        $totalWait = 0;
        $waitCount = 0;

        foreach ($entries as $entry) {
            $waitMin = max(0, (int) $entry->entered_at->diffInMinutes($now));
            if (in_array($entry->bucket, [
                AppointmentQueueEntry::BUCKET_UNASSIGNED,
                AppointmentQueueEntry::BUCKET_WAITING,
                AppointmentQueueEntry::BUCKET_READY,
            ], true)) {
                $totalWait += $waitMin;
                $waitCount++;
            }
            $buckets[$entry->bucket][] = $this->transformQueueEntry($entry, $waitMin);
        }

        $summary = [
            'total_active' => $entries->count(),
            'unassigned' => count($buckets[AppointmentQueueEntry::BUCKET_UNASSIGNED]),
            'waiting' => count($buckets[AppointmentQueueEntry::BUCKET_WAITING]),
            'ready' => count($buckets[AppointmentQueueEntry::BUCKET_READY]),
            'in_progress' => count($buckets[AppointmentQueueEntry::BUCKET_IN_PROGRESS]),
        ];

        return [
            'buckets' => $buckets,
            'summary' => $summary,
            'avg_wait_min' => $waitCount > 0 ? (int) round($totalWait / $waitCount) : 0,
        ];
    }

    /**
     * UC11 - GET /api/reception/queue-stats (tab "Theo doi hang cho").
     *
     * @param  array<string,mixed>  $filters
     */
    public function queueStats(array $filters = []): array
    {
        $date = ! empty($filters['date'])
            ? Carbon::parse($filters['date'])->toDateString()
            : Carbon::today()->toDateString();

        $appointmentQuery = Appointment::query()->whereDate('appointment_date', $date);
        if (! empty($filters['branch_id']) && $filters['branch_id'] !== 'all') {
            $appointmentQuery->where('branch_id', $filters['branch_id']);
        }

        $byStatus = (clone $appointmentQuery)->selectRaw('status, COUNT(*) as c')
            ->groupBy('status')->pluck('c', 'status')->all();

        $kpi = [
            'total_checked_in' => (int) ($byStatus[Appointment::STATUS_CHECKED_IN] ?? 0),
            'waiting' => (int) ($byStatus[Appointment::STATUS_CHECKED_IN] ?? 0),
            'in_progress' => (int) ($byStatus[Appointment::STATUS_IN_PROGRESS] ?? 0),
            'completed' => (int) ($byStatus[Appointment::STATUS_COMPLETED] ?? 0),
            'no_show' => (int) ($byStatus[Appointment::STATUS_NO_SHOW] ?? 0),
        ];

        $entries = AppointmentQueueEntry::query()
            ->active()
            ->with(['patient:id,patient_code,full_name', 'assignedDoctor:id,name'])
            ->whereDate('entered_at', $date)
            ->when(! empty($filters['branch_id']) && $filters['branch_id'] !== 'all',
                fn ($q) => $q->where('branch_id', $filters['branch_id']))
            ->orderBy('entered_at')
            ->get();

        $now = now();
        $overdue = [];
        $alerts = [];
        foreach ($entries as $entry) {
            $waitMin = max(0, (int) $entry->entered_at->diffInMinutes($now));
            if ($waitMin >= self::OVERDUE_WAIT_MIN) {
                $overdue[] = $this->transformQueueEntry($entry, $waitMin);
            }
        }

        if (count($overdue) > 0) {
            $alerts[] = [
                'severity' => 'warning',
                'code' => 'overdue_wait',
                'message' => 'Co '.count($overdue).' benh nhan cho qua '.self::OVERDUE_WAIT_MIN.' phut.',
            ];
        }

        return [
            'kpi' => $kpi,
            'overdue' => $overdue,
            'alerts' => $alerts,
        ];
    }

    /**
     * UC11 - Tinh arrival_flag dua tren time_slot va now (BR17).
     */
    public function computeArrivalFlag(Appointment $appointment, Carbon $now): string
    {
        $slot = (string) $appointment->time_slot;
        $start = $this->parseSlotStart($appointment->appointment_date, $slot);
        if (! $start) {
            return Appointment::ARRIVAL_ON_TIME;
        }

        $diff = $start->diffInMinutes($now, false);
        if ($diff <= self::EARLY_THRESHOLD_MIN) {
            return Appointment::ARRIVAL_EARLY;
        }
        if ($diff <= self::ON_TIME_LATE_LIMIT) {
            return Appointment::ARRIVAL_ON_TIME;
        }
        if ($diff <= self::LATE_LIMIT) {
            return Appointment::ARRIVAL_LATE;
        }

        return Appointment::ARRIVAL_VERY_LATE;
    }

    protected function parseSlotStart($appointmentDate, ?string $slot): ?Carbon
    {
        if (! $slot) {
            return null;
        }
        $parts = explode('-', $slot);
        if (count($parts) < 2) {
            return null;
        }
        $startRaw = $parts[0];
        $hour = (int) substr($startRaw, 0, 2);
        $min = strlen($startRaw) > 2 ? (int) substr($startRaw, 2) : 0;
        $date = $appointmentDate instanceof Carbon
            ? $appointmentDate
            : Carbon::parse($appointmentDate);

        return $date->copy()->setTime($hour, $min, 0);
    }

    protected function nextQueueNumber(?string $branchId, Carbon $date): int
    {
        $start = $date->copy()->startOfDay();
        $end = $date->copy()->endOfDay();

        return (int) AppointmentQueueEntry::query()
            ->whereBetween('entered_at', [$start, $end])
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->count() + 1;
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

    protected function transformQueueEntry(AppointmentQueueEntry $entry, int $waitMin): array
    {
        return [
            'id' => $entry->id,
            'code' => $entry->code,
            'bucket' => $entry->bucket,
            'queue_number' => $entry->queue_number,
            'branch_id' => $entry->branch_id,
            'entered_at' => optional($entry->entered_at)->toIso8601String(),
            'wait_minutes' => $waitMin,
            'overdue' => $waitMin >= self::OVERDUE_WAIT_MIN,
            'appointment' => $entry->appointment ? [
                'id' => $entry->appointment->id,
                'code' => $entry->appointment->code,
                'time_slot' => $entry->appointment->time_slot,
                'status' => $entry->appointment->status,
                'arrival_flag' => $entry->appointment->arrival_flag,
                'service_ids' => $entry->appointment->service_ids ?? [],
                'notes' => $entry->appointment->notes,
            ] : null,
            'patient' => $entry->patient ? [
                'id' => $entry->patient->id,
                'code' => $entry->patient->patient_code,
                'name' => $entry->patient->full_name,
                'phone' => $entry->patient->phone,
            ] : null,
            'assigned_doctor' => $entry->assignedDoctor ? [
                'id' => $entry->assignedDoctor->id,
                'name' => $entry->assignedDoctor->name,
            ] : null,
        ];
    }
}
