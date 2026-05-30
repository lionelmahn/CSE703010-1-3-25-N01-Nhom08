<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\AppointmentQueueEntry;
use App\Models\AppointmentStatusHistory;
use App\Models\ExaminationHistory;
use App\Models\ExaminationSession;
use App\Models\Invoice;
use App\Models\PatientHistory;
use App\Models\User;
use App\Models\WorkSchedule;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * UC12 - Business logic ho so benh an.
 *
 * Cac transition matrix (SR1-SR7):
 *  - cho_kham      -> dang_kham (start)
 *  - dang_kham     -> nhap (save-draft), cho_thanh_toan (complete), da_huy
 *  - nhap          -> dang_kham (resume), cho_thanh_toan (complete)
 *  - cho_thanh_toan-> hoan_tat (UC13), da_khoa (admin lock)
 *  - hoan_tat      -> da_khoa (lock)
 *  - da_khoa       -> dang_kham/nhap (unlock - chi admin, AC23)
 *
 * Methods nay luon viet su kien vao `examination_histories` va goi
 * `AuditLogService::log` cho audit log toan he thong.
 */
class ExaminationService
{
    public function __construct(
        private readonly AuditLogService $auditLog,
        private readonly ComplexityConfigService $complexityConfig,
        private readonly InvoiceService $invoices,
    ) {}

    /* =====================================================================
     * 1. Worklist - GET /api/medical-records/worklist
     * ===================================================================== */

    /**
     * @param  array<string,mixed>  $filters
     */
    public function worklist(array $filters, ?User $actor): LengthAwarePaginator
    {
        $perPage = max(1, min(100, (int) ($filters['per_page'] ?? 20)));
        $tab = $filters['tab'] ?? 'all';

        $query = ExaminationSession::query()
            ->with([
                'patient:id,patient_code,full_name,phone,dob,gender',
                'appointment:id,code,appointment_date,time_slot,branch_id,assigned_doctor_id',
                'doctor:id,name,email',
            ]);

        // Doctor chi thay phien cua minh (AC1). Admin/le tan thay all.
        if ($actor && $actor->roles()->where('slug', 'bac_si')->exists()
            && ! $actor->roles()->where('slug', 'admin')->exists()) {
            $query->where('doctor_id', $actor->id);
        }

        if ($tab === 'in_progress') {
            $query->whereIn('status', [ExaminationSession::STATUS_DANG_KHAM]);
        } elseif ($tab === 'draft') {
            $query->where('status', ExaminationSession::STATUS_NHAP);
        } elseif ($tab === 'completed') {
            $query->whereIn('status', [
                ExaminationSession::STATUS_CHO_THANH_TOAN,
                ExaminationSession::STATUS_HOAN_TAT,
                ExaminationSession::STATUS_DA_KHOA,
            ]);
        }

        if (! empty($filters['status']) && in_array($filters['status'], ExaminationSession::ALL_STATUSES, true)) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['doctor_id'])) {
            $query->where('doctor_id', (int) $filters['doctor_id']);
        }

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(function (Builder $q) use ($term) {
                $q->where('code', 'like', $term)
                    ->orWhereHas('patient', function (Builder $pq) use ($term) {
                        $pq->where('full_name', 'like', $term)
                            ->orWhere('phone', 'like', $term)
                            ->orWhere('patient_code', 'like', $term);
                    });
            });
        }

        if (! empty($filters['from'])) {
            $query->whereDate('started_at', '>=', Carbon::parse($filters['from'])->toDateString());
        }
        if (! empty($filters['to'])) {
            $query->whereDate('started_at', '<=', Carbon::parse($filters['to'])->toDateString());
        }

        return $query->orderByDesc('started_at')->paginate($perPage);
    }

    /**
     * Buc tranh tong quat counts theo status cho header tab.
     *
     * @return array<string,int>
     */
    public function worklistCounts(?User $actor): array
    {
        $base = ExaminationSession::query();
        if ($actor && $actor->roles()->where('slug', 'bac_si')->exists()
            && ! $actor->roles()->where('slug', 'admin')->exists()) {
            $base->where('doctor_id', $actor->id);
        }

        $rows = (clone $base)->selectRaw('status, count(*) as c')->groupBy('status')->pluck('c', 'status');

        return [
            'in_progress' => (int) ($rows[ExaminationSession::STATUS_DANG_KHAM] ?? 0),
            'draft' => (int) ($rows[ExaminationSession::STATUS_NHAP] ?? 0),
            'pending_payment' => (int) ($rows[ExaminationSession::STATUS_CHO_THANH_TOAN] ?? 0),
            'completed' => (int) ($rows[ExaminationSession::STATUS_HOAN_TAT] ?? 0)
                + (int) ($rows[ExaminationSession::STATUS_DA_KHOA] ?? 0),
            'total' => array_sum($rows->toArray()),
        ];
    }

    /* =====================================================================
     * 2. Start - POST /api/examinations/start (Main Flow buoc 2)
     * ===================================================================== */

    public function start(int $appointmentId, User $actor): ExaminationSession
    {
        return DB::transaction(function () use ($appointmentId, $actor) {
            /** @var Appointment $appointment */
            $appointment = Appointment::query()->lockForUpdate()->findOrFail($appointmentId);

            // VR1 - phai da_check_in hoac dang_kham (resume).
            if (! in_array($appointment->status, [
                Appointment::STATUS_CHECKED_IN,
                Appointment::STATUS_IN_PROGRESS,
            ], true)) {
                throw ValidationException::withMessages([
                    'appointment_id' => 'Lich hen phai duoc check-in truoc khi bat dau kham (VR1).',
                ]);
            }

            // VR2 - phai co bac si.
            if (! $appointment->assigned_doctor_id) {
                throw ValidationException::withMessages([
                    'appointment_id' => 'Lich hen chua duoc phan cong bac si (VR2).',
                ]);
            }

            // VR13 - chi bac si duoc phan cong moi co the bat dau (admin
            // co the override - kiem tra o Policy).
            $isAdmin = $actor->roles()->where('slug', 'admin')->exists();
            if (! $isAdmin && (int) $appointment->assigned_doctor_id !== (int) $actor->id) {
                throw ValidationException::withMessages([
                    'appointment_id' => 'Chi bac si duoc phan cong moi co the bat dau phien kham (VR13).',
                ]);
            }

            // VR12 - mot appointment chi co 1 examination active.
            $existing = ExaminationSession::query()
                ->where('appointment_id', $appointment->id)
                ->whereIn('status', ExaminationSession::ACTIVE_STATUSES)
                ->lockForUpdate()
                ->first();

            if ($existing) {
                // Idempotent - resume thay vi bao loi.
                if (in_array($existing->status, [
                    ExaminationSession::STATUS_DANG_KHAM,
                    ExaminationSession::STATUS_NHAP,
                ], true)) {
                    $existing->update([
                        'status' => ExaminationSession::STATUS_DANG_KHAM,
                        'updated_by' => $actor->id,
                    ]);

                    return $existing->fresh();
                }

                throw ValidationException::withMessages([
                    'appointment_id' => 'Da co phien kham hoat dong cho lich hen nay (VR12).',
                ]);
            }

            $queueEntry = AppointmentQueueEntry::query()
                ->where('appointment_id', $appointment->id)
                ->whereIn('bucket', AppointmentQueueEntry::ACTIVE_BUCKETS)
                ->first();

            $now = Carbon::now();

            $session = ExaminationSession::create([
                'code' => ExaminationSession::generateCode($now),
                'patient_id' => $appointment->patient_id,
                'appointment_id' => $appointment->id,
                'queue_entry_id' => $queueEntry?->id,
                'doctor_id' => $appointment->assigned_doctor_id,
                'status' => ExaminationSession::STATUS_DANG_KHAM,
                'started_at' => $now,
                'created_by' => $actor->id,
                'updated_by' => $actor->id,
            ]);

            // Cap nhat appointment + queue entry.
            $appointment->forceFill([
                'status' => Appointment::STATUS_IN_PROGRESS,
            ])->save();

            if ($queueEntry) {
                $queueEntry->forceFill([
                    'bucket' => AppointmentQueueEntry::BUCKET_IN_PROGRESS,
                    'started_at' => $queueEntry->started_at ?? $now,
                ])->save();
            }

            AppointmentStatusHistory::create([
                'appointment_id' => $appointment->id,
                'action' => AppointmentStatusHistory::ACTION_STATUS_CHANGED,
                'from_status' => Appointment::STATUS_CHECKED_IN,
                'to_status' => Appointment::STATUS_IN_PROGRESS,
                'reason' => 'Bat dau phien kham (UC12)',
                'metadata' => ['examination_id' => $session->id, 'examination_code' => $session->code],
                'actor_id' => $actor->id,
                'actor_name' => $actor->name,
                'created_at' => $now,
            ]);

            $this->writeHistory($session, 'start', $actor, null, [
                'examination_code' => $session->code,
            ], 'Bat dau phien kham');

            PatientHistory::create([
                'patient_id' => $appointment->patient_id,
                'action' => 'record.start',
                'actor_id' => $actor->id,
                'actor_name' => $actor->name,
                'note' => 'Bat dau phien kham '.$session->code,
                'metadata' => ['examination_id' => $session->id],
                'created_at' => $now,
            ]);

            $this->auditLog->log($actor, 'examination.start', [
                'examination_id' => $session->id,
                'appointment_id' => $appointment->id,
            ]);

            return $session->fresh();
        });
    }

    /* =====================================================================
     * 3. Show - GET /api/examinations/:id
     * ===================================================================== */

    public function show(int $id): ExaminationSession
    {
        return ExaminationSession::query()
            ->with([
                'patient',
                'appointment:id,code,appointment_date,time_slot,branch_id,service_ids,notes,assigned_doctor_id',
                'doctor:id,name,email,phone',
                'completer:id,name',
                'locker:id,name',
                'workSchedule:id,work_date,start_time,end_time,room',
                'serviceItems' => function ($q) {
                    $q->orderBy('id');
                },
                'serviceItems.service:id,name,service_code,duration_minutes',
                'serviceItems.performer:id,name',
                'toothChart' => function ($q) {
                    $q->orderBy('tooth_fdi');
                },
                'toothChart.status:id,name,code,color',
            ])
            ->findOrFail($id);
    }

    /* =====================================================================
     * 4. Update - PATCH /api/examinations/:id (auto-save)
     * ===================================================================== */

    /**
     * @param  array<string,mixed>  $payload
     */
    public function update(int $id, array $payload, User $actor): ExaminationSession
    {
        return DB::transaction(function () use ($id, $payload, $actor) {
            $session = ExaminationSession::query()->lockForUpdate()->findOrFail($id);
            $this->assertEditable($session);

            // AC28 optimistic locking.
            $clientLastUpdated = $payload['last_updated_at'] ?? null;
            if ($clientLastUpdated) {
                $clientTs = Carbon::parse($clientLastUpdated)->toIso8601String();
                $serverTs = optional($session->updated_at)->toIso8601String();
                if ($serverTs && $clientTs && $clientTs !== $serverTs) {
                    throw ValidationException::withMessages([
                        'last_updated_at' => 'Du lieu da bi thay doi boi nguoi khac. Vui long tai lai (AC28).',
                    ])->status(409);
                }
            }

            $before = $session->only([
                'chief_complaint', 'symptoms', 'clinical_findings', 'diagnosis',
                'clinical_notes', 'treatment_outcome', 'conclusion',
                'recall_date', 'recall_note', 'completion_note',
            ]);

            $allowed = [
                'chief_complaint', 'symptoms', 'clinical_findings', 'diagnosis',
                'clinical_notes', 'treatment_outcome', 'conclusion',
                'recall_date', 'recall_note', 'completion_note', 'last_edit_reason',
            ];

            foreach ($allowed as $field) {
                if (array_key_exists($field, $payload)) {
                    $value = $payload[$field];
                    if (is_string($value)) {
                        // VR10 / AC27 sanitize.
                        $value = $this->sanitizeText($value);
                    }
                    $session->{$field} = $value;
                }
            }

            $session->updated_by = $actor->id;
            $session->save();

            $after = $session->only(array_keys($before));

            if ($after !== $before) {
                $this->writeHistory($session, 'update', $actor, $before, $after);
            }

            return $session->fresh();
        });
    }

    /* =====================================================================
     * 5. Save draft - POST /api/examinations/:id/save-draft (Alt A1)
     * ===================================================================== */

    public function saveDraft(int $id, ?string $note, User $actor): ExaminationSession
    {
        return DB::transaction(function () use ($id, $note, $actor) {
            $session = ExaminationSession::query()->lockForUpdate()->findOrFail($id);

            if (! in_array($session->status, [
                ExaminationSession::STATUS_DANG_KHAM,
                ExaminationSession::STATUS_NHAP,
            ], true)) {
                throw ValidationException::withMessages([
                    'status' => 'Chi co the luu nhap khi phien dang kham (SR2/SR3).',
                ]);
            }

            $from = $session->status;
            $session->status = ExaminationSession::STATUS_NHAP;
            if ($note !== null) {
                $session->completion_note = $this->sanitizeText($note);
            }
            $session->updated_by = $actor->id;
            $session->save();

            $this->writeHistory($session, 'save_draft', $actor, ['status' => $from], ['status' => $session->status]);
            $this->auditLog->log($actor, 'examination.save_draft', [
                'examination_id' => $session->id,
            ]);

            return $session->fresh();
        });
    }

    /* =====================================================================
     * 6. Complete - POST /api/examinations/:id/complete (Main Flow buoc 17)
     * ===================================================================== */

    /**
     * @param  array<string,mixed>  $payload
     */
    public function complete(int $id, array $payload, User $actor): ExaminationSession
    {
        return DB::transaction(function () use ($id, $payload, $actor) {
            /** @var ExaminationSession $session */
            $session = ExaminationSession::query()->with('serviceItems')->lockForUpdate()->findOrFail($id);

            if (! in_array($session->status, [
                ExaminationSession::STATUS_DANG_KHAM,
                ExaminationSession::STATUS_NHAP,
            ], true)) {
                throw ValidationException::withMessages([
                    'status' => 'Phien khong o trang thai hop le de hoan tat (SR2/SR3).',
                ])->status(409);
            }

            $issues = $this->validateCompletion($session);
            if (! empty($issues)) {
                throw ValidationException::withMessages($issues);
            }

            $now = Carbon::now();
            $fromStatus = $session->status;

            // AC19/AC20 - tim ca lam viec phu hop.
            $workScheduleId = $this->findMatchingWorkSchedule($session, $now);

            $session->status = ExaminationSession::STATUS_CHO_THANH_TOAN;
            $session->completed_at = $now;
            $session->completed_by = $actor->id;
            $session->updated_by = $actor->id;
            $session->completion_note = $this->sanitizeText($payload['completion_note'] ?? $session->completion_note);
            $session->work_schedule_id = $workScheduleId;
            $session->unlinked_shift = $workScheduleId === null;
            $session->save();

            $appointment = Appointment::query()->lockForUpdate()->find($session->appointment_id);
            if ($appointment) {
                $appointment->status = Appointment::STATUS_COMPLETED;
                $appointment->save();

                AppointmentStatusHistory::create([
                    'appointment_id' => $appointment->id,
                    'action' => AppointmentStatusHistory::ACTION_STATUS_CHANGED,
                    'from_status' => Appointment::STATUS_IN_PROGRESS,
                    'to_status' => Appointment::STATUS_COMPLETED,
                    'reason' => 'Hoan tat phien kham (UC12)',
                    'metadata' => [
                        'examination_id' => $session->id,
                        'examination_code' => $session->code,
                    ],
                    'actor_id' => $actor->id,
                    'actor_name' => $actor->name,
                    'created_at' => $now,
                ]);
            }

            $queueEntry = AppointmentQueueEntry::query()
                ->where('appointment_id', $session->appointment_id)
                ->whereIn('bucket', AppointmentQueueEntry::ACTIVE_BUCKETS)
                ->lockForUpdate()
                ->first();
            if ($queueEntry) {
                $queueEntry->forceFill([
                    'bucket' => AppointmentQueueEntry::BUCKET_COMPLETED,
                    'completed_at' => $now,
                ])->save();
            }

            $this->writeHistory($session, 'complete', $actor, ['status' => $fromStatus], [
                'status' => $session->status,
                'work_schedule_id' => $workScheduleId,
                'unlinked_shift' => $session->unlinked_shift,
            ]);

            PatientHistory::create([
                'patient_id' => $session->patient_id,
                'action' => 'record.complete',
                'actor_id' => $actor->id,
                'actor_name' => $actor->name,
                'note' => 'Hoan tat phien kham '.$session->code,
                'metadata' => [
                    'examination_id' => $session->id,
                    'unlinked_shift' => $session->unlinked_shift,
                ],
                'created_at' => $now,
            ]);

            $this->auditLog->log($actor, 'examination.complete', [
                'examination_id' => $session->id,
                'service_items_count' => $session->serviceItems()->count(),
                'unlinked_shift' => $session->unlinked_shift,
            ]);

            // UC13 - Auto-create invoice ngay sau khi complete (Q17).
            // Idempotent: neu da co invoice main active thi tra ve no.
            $this->invoices->createFromExamination($session, $actor);

            return $session->fresh(['serviceItems', 'toothChart']);
        });
    }

    /**
     * VR4 + VR5 + VR7 - chan complete neu thieu du lieu chuyen mon hoac
     * dong dich vu khong hop le.
     *
     * @return array<string,string>
     */
    public function validateCompletion(ExaminationSession $session): array
    {
        $issues = [];
        if (blank($session->chief_complaint)) {
            $issues['chief_complaint'] = 'Vui long nhap ly do den kham (DR66).';
        }
        if (blank($session->diagnosis)) {
            $issues['diagnosis'] = 'Vui long nhap chan doan truoc khi hoan tat (DR67/VR4).';
        }
        if (blank($session->conclusion)) {
            $issues['conclusion'] = 'Vui long nhap ket luan kham (DR67/VR4).';
        }

        $items = $session->serviceItems()->get();
        if ($items->isEmpty()) {
            $issues['service_items'] = 'Phai chi dinh it nhat mot dich vu (VR5).';
        }

        foreach ($items as $idx => $item) {
            if ((float) $item->complexity_coefficient > 0 && blank($item->complexity_reason)) {
                $issues['service_items.'.$idx.'.complexity_reason'] = 'Bat buoc nhap ly do khi he so phuc tap > 0 (VR7/AC11).';
            }
        }

        return $issues;
    }

    /* =====================================================================
     * 7. Recall - POST /api/examinations/:id/recall (Alt A2)
     * ===================================================================== */

    /**
     * @param  array<string,mixed>  $payload
     */
    public function setRecall(int $id, array $payload, User $actor): ExaminationSession
    {
        return DB::transaction(function () use ($id, $payload, $actor) {
            $session = ExaminationSession::query()->lockForUpdate()->findOrFail($id);

            // Cho phep luu recall ngay ca khi da hoan tat (chi luu de xuat).
            if (in_array($session->status, [
                ExaminationSession::STATUS_DA_KHOA,
                ExaminationSession::STATUS_DA_HUY,
            ], true)) {
                throw ValidationException::withMessages([
                    'status' => 'Phien da khoa/da huy khong the cap nhat de xuat tai kham.',
                ])->status(409);
            }

            $before = $session->only(['recall_date', 'recall_note']);

            $session->recall_date = ! empty($payload['recall_date'])
                ? Carbon::parse($payload['recall_date'])->toDateString()
                : null;
            $session->recall_note = isset($payload['recall_note'])
                ? $this->sanitizeText($payload['recall_note'])
                : null;
            $session->updated_by = $actor->id;
            $session->save();

            $this->writeHistory($session, 'recall', $actor, $before, $session->only(['recall_date', 'recall_note']));

            return $session->fresh();
        });
    }

    /* =====================================================================
     * 8. Lock / Unlock - POST /api/examinations/:id/lock|unlock (A5)
     * ===================================================================== */

    public function lock(int $id, string $reason, User $actor): ExaminationSession
    {
        return DB::transaction(function () use ($id, $reason, $actor) {
            $session = ExaminationSession::query()->lockForUpdate()->findOrFail($id);

            if (! in_array($session->status, [
                ExaminationSession::STATUS_CHO_THANH_TOAN,
                ExaminationSession::STATUS_HOAN_TAT,
            ], true)) {
                throw ValidationException::withMessages([
                    'status' => 'Chi co the khoa phien da hoan tat (SR4/SR5).',
                ])->status(409);
            }

            $reason = $this->sanitizeText($reason);
            if ($reason === '') {
                throw ValidationException::withMessages([
                    'reason' => 'Vui long nhap ly do khoa ho so.',
                ]);
            }

            $from = $session->status;
            $session->status = ExaminationSession::STATUS_DA_KHOA;
            $session->lock_reason = $reason;
            $session->locked_at = Carbon::now();
            $session->locked_by = $actor->id;
            $session->updated_by = $actor->id;
            $session->save();

            $this->writeHistory($session, 'lock', $actor, ['status' => $from], ['status' => $session->status], $reason);
            $this->auditLog->log($actor, 'examination.lock', [
                'examination_id' => $session->id,
                'reason' => $reason,
            ]);

            return $session->fresh();
        });
    }

    public function unlock(int $id, string $reason, User $actor): ExaminationSession
    {
        return DB::transaction(function () use ($id, $reason, $actor) {
            $session = ExaminationSession::query()->lockForUpdate()->findOrFail($id);

            if ($session->status !== ExaminationSession::STATUS_DA_KHOA) {
                throw ValidationException::withMessages([
                    'status' => 'Phien chua duoc khoa (SR6).',
                ])->status(409);
            }

            // R17 (UC13): chan unlock khi hoa don da paid - tranh sai lech
            // tai chinh. Admin can hoan tien + huy hoa don truoc.
            $paidInvoice = Invoice::query()
                ->where('examination_id', $session->id)
                ->where('type', Invoice::TYPE_MAIN)
                ->whereIn('status', [Invoice::STATUS_PAID, Invoice::STATUS_PARTIAL])
                ->first();
            if ($paidInvoice) {
                throw ValidationException::withMessages([
                    'status' => 'Hoa don '.$paidInvoice->code.' da co thanh toan ('.$paidInvoice->status.'). '
                        .'Vui long hoan tien va huy hoa don truoc khi mo khoa (R17).',
                ])->status(409);
            }

            $reason = $this->sanitizeText($reason);
            if ($reason === '') {
                throw ValidationException::withMessages([
                    'reason' => 'Vui long nhap ly do mo khoa.',
                ]);
            }

            $session->status = ExaminationSession::STATUS_CHO_THANH_TOAN;
            $session->lock_reason = null;
            $session->locked_at = null;
            $session->locked_by = null;
            $session->last_edit_reason = $reason;
            $session->updated_by = $actor->id;
            $session->save();

            $this->writeHistory($session, 'unlock', $actor, ['status' => ExaminationSession::STATUS_DA_KHOA], ['status' => $session->status], $reason);
            $this->auditLog->log($actor, 'examination.unlock', [
                'examination_id' => $session->id,
                'reason' => $reason,
            ]);

            return $session->fresh();
        });
    }

    /* =====================================================================
     * Patient examinations - GET /api/patients/:id/examinations
     * ===================================================================== */

    public function patientExaminations(int $patientId, int $limit = 5): LengthAwarePaginator
    {
        return ExaminationSession::query()
            ->where('patient_id', $patientId)
            ->whereNotIn('status', [ExaminationSession::STATUS_DA_HUY])
            ->with(['doctor:id,name'])
            ->orderByDesc('started_at')
            ->paginate(max(1, min(50, $limit)));
    }

    /* =====================================================================
     * Helpers
     * ===================================================================== */

    public function writeHistory(
        ExaminationSession $session,
        string $action,
        User $actor,
        ?array $before = null,
        ?array $after = null,
        ?string $reason = null,
    ): ExaminationHistory {
        return ExaminationHistory::create([
            'examination_id' => $session->id,
            'action' => $action,
            'actor_id' => $actor->id,
            'actor_name' => $actor->name,
            'before' => $before,
            'after' => $after,
            'reason' => $reason,
            'created_at' => Carbon::now(),
        ]);
    }

    public function assertEditable(ExaminationSession $session): void
    {
        if (! $session->isEditable()) {
            throw ValidationException::withMessages([
                'status' => 'Phien khong o trang thai cho phep chinh sua (SR).',
            ])->status(409);
        }
    }

    /**
     * VR10/AC27 - loai bo HTML/script. Cho phep new line.
     */
    public function sanitizeText(?string $text): string
    {
        if ($text === null) {
            return '';
        }
        $clean = strip_tags($text);

        return trim($clean);
    }

    /**
     * AC19/AC20 - tim ca lam viec cua bac si phu hop voi appointment.
     */
    private function findMatchingWorkSchedule(ExaminationSession $session, Carbon $when): ?int
    {
        if (! $session->doctor_id) {
            return null;
        }

        $staff = DB::table('staff')->where('user_id', $session->doctor_id)->first();
        if (! $staff) {
            return null;
        }

        $appointment = $session->appointment()->first();
        $date = $appointment?->appointment_date
            ? Carbon::parse($appointment->appointment_date)->toDateString()
            : $when->toDateString();

        return WorkSchedule::query()
            ->where('staff_id', $staff->id)
            ->whereIn('status', WorkSchedule::ACTIVE_STATUSES)
            ->whereDate('work_date', $date)
            ->orderBy('start_time')
            ->value('id');
    }
}
