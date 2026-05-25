<?php

namespace App\Services;

use App\Models\AppNotification;
use App\Models\Appointment;
use App\Models\OnlineBookingRequest;
use App\Models\OnlineBookingRequestHistory;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * UC6.2 - Logic xu ly yeu cau dat lich online.
 *
 * Trach nhiem:
 *   - State machine (cho_xu_ly -> dang_xu_ly -> ...).
 *   - Ghi history (BR-08, AC17).
 *   - Tao Appointment khi confirm (BR-04).
 *   - Tao/link Patient khi xu ly (BR-06, AC4/AC5).
 *   - Validate workflow (VR1-VR12).
 */
class OnlineBookingService
{
    public function listRequests(array $filters): LengthAwarePaginator
    {
        $query = OnlineBookingRequest::query()
            ->with(['patient', 'appointment', 'processor:id,name'])
            ->withCount('histories');

        if (! empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['branch_id']) && $filters['branch_id'] !== 'all') {
            $query->where('branch_id', $filters['branch_id']);
        }

        if (! empty($filters['service_id']) && $filters['service_id'] !== 'all') {
            // service_ids la JSON array, dung whereJsonContains.
            $query->whereJsonContains('service_ids', $filters['service_id']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('preferred_date', '>=', $filters['date_from']);
        }
        if (! empty($filters['date_to'])) {
            $query->whereDate('preferred_date', '<=', $filters['date_to']);
        }

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(function ($q) use ($term) {
                $q->where('code', 'like', $term)
                    ->orWhere('name', 'like', $term)
                    ->orWhere('phone', 'like', $term)
                    ->orWhere('email', 'like', $term);
            });
        }

        $perPage = (int) ($filters['per_page'] ?? 10);
        $perPage = max(1, min(50, $perPage));

        return $query
            ->orderByRaw("CASE WHEN status = 'cho_xu_ly' THEN 0 WHEN status = 'dang_xu_ly' THEN 1 ELSE 2 END")
            ->orderByDesc('submitted_at')
            ->paginate($perPage);
    }

    public function statusCounts(): array
    {
        $rows = OnlineBookingRequest::query()
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $defaults = array_fill_keys(OnlineBookingRequest::ALL_STATUSES, 0);

        return array_merge($defaults, $rows);
    }

    public function findRequest(int $id): OnlineBookingRequest
    {
        return OnlineBookingRequest::query()
            ->with(['patient', 'appointment', 'processor:id,name', 'histories.actor:id,name'])
            ->findOrFail($id);
    }

    public function createFromPublicPayload(array $payload, ?string $ip = null, ?string $device = null): OnlineBookingRequest
    {
        return DB::transaction(function () use ($payload, $ip, $device) {
            $request = OnlineBookingRequest::create([
                'code' => OnlineBookingRequest::generateCode(),
                'name' => $payload['name'],
                'phone' => $payload['phone'],
                'email' => $payload['email'] ?? null,
                'need' => $payload['need'] ?? null,
                'service_ids' => $payload['service_ids'] ?? [],
                'branch_id' => $payload['branch_id'] ?? null,
                'preferred_date' => $payload['preferred_date'] ?? null,
                'preferred_time_slot' => $payload['preferred_time_slot'] ?? null,
                'customer_note' => $payload['customer_note'] ?? $payload['note'] ?? null,
                'status' => OnlineBookingRequest::STATUS_PENDING,
                'email_status' => OnlineBookingRequest::EMAIL_STATUS_NONE,
                'source' => $payload['source'] ?? 'landing_page',
                'submitted_at' => now(),
                'device' => $device ?? $payload['device'] ?? null,
                'ip' => $ip ?? $payload['ip'] ?? null,
            ]);

            $this->logHistory($request, 'request_created', null, [
                'actor_name' => 'He thong',
                'note' => 'Yeu cau duoc gui tu landing page.',
            ]);
            $this->logHistory($request, 'request_received', null, [
                'actor_name' => 'He thong',
                'note' => 'Yeu cau duoc he thong tiep nhan thanh cong.',
            ]);

            return $request->fresh(['histories']);
        });
    }

    public function startProcessing(OnlineBookingRequest $request, User $actor): OnlineBookingRequest
    {
        if ($request->status !== OnlineBookingRequest::STATUS_PENDING
            && $request->status !== OnlineBookingRequest::STATUS_PROCESSING) {
            // Idempotent voi PROCESSING; cac trang thai khac khong duoc tiep nhan.
            throw ValidationException::withMessages([
                'status' => 'Khong the chuyen yeu cau o trang thai hien tai sang dang xu ly.',
            ]);
        }

        if ($request->status === OnlineBookingRequest::STATUS_PENDING) {
            $request->status = OnlineBookingRequest::STATUS_PROCESSING;
            $request->processed_by = $actor->id;
            $request->processed_at = now();
            $request->save();

            $this->logHistory($request, 'processing_started', $actor, [
                'note' => 'Bat dau xu ly yeu cau.',
            ]);
        }

        return $request->fresh(['histories', 'patient', 'appointment']);
    }

    public function linkPatient(OnlineBookingRequest $request, Patient $patient, User $actor): OnlineBookingRequest
    {
        $this->assertProcessable($request);

        $request->patient_id = $patient->id;
        $request->save();

        $this->logHistory($request, 'patient_linked', $actor, [
            'note' => sprintf('Lien ket voi %s - %s.', $patient->patient_code, $patient->full_name),
            'metadata' => ['patient_id' => $patient->id],
        ]);

        return $request->fresh(['histories', 'patient']);
    }

    public function createPatient(OnlineBookingRequest $request, array $payload, User $actor): Patient
    {
        $this->assertProcessable($request);

        return DB::transaction(function () use ($request, $payload, $actor) {
            $patient = Patient::firstOrCreate(
                ['phone' => $payload['phone'] ?? $request->phone],
                [
                    'patient_code' => Patient::generateCode(),
                    'full_name' => $payload['name'] ?? $request->name,
                    'email' => $payload['email'] ?? $request->email,
                    'dob' => $payload['birthdate'] ?? null,
                    'gender' => Patient::normalizeGender($payload['gender'] ?? null),
                    'address' => $payload['address'] ?? null,
                    'is_active' => true,
                ]
            );

            $request->patient_id = $patient->id;
            $request->save();

            $this->logHistory($request, 'patient_created', $actor, [
                'note' => sprintf('Tao moi ho so %s - %s.', $patient->patient_code, $patient->full_name),
                'metadata' => ['patient_id' => $patient->id],
            ]);

            return $patient;
        });
    }

    public function confirmAppointment(OnlineBookingRequest $request, array $payload, User $actor): array
    {
        $this->assertProcessable($request);

        if (! $request->patient_id) {
            throw ValidationException::withMessages([
                'patient_id' => 'Phai lien ket hoac tao moi ho so benh nhan truoc khi xac nhan.',
            ]);
        }

        if ($request->appointment_id) {
            throw ValidationException::withMessages([
                'appointment' => 'Yeu cau nay da co lich hen, khong the tao lich moi.',
            ]);
        }

        $result = DB::transaction(function () use ($request, $payload, $actor) {
            $appointment = Appointment::create([
                'code' => Appointment::generateCode(),
                'online_booking_request_id' => $request->id,
                'patient_id' => $request->patient_id,
                'appointment_date' => $payload['appointment_date'],
                'time_slot' => $payload['time_slot'],
                'service_ids' => $payload['service_ids'] ?? $request->service_ids ?? [],
                'branch_id' => $payload['branch_id'] ?? $request->branch_id,
                'status' => Appointment::STATUS_WAITING_DOCTOR_ASSIGNMENT,
                'created_by' => $actor->id,
                'notes' => $payload['notes'] ?? null,
            ]);

            $request->status = OnlineBookingRequest::STATUS_APPOINTMENT_CREATED;
            $request->appointment_id = $appointment->id;
            $request->processed_by = $actor->id;
            $request->processed_at = now();
            $request->save();

            $this->logHistory($request, 'appointment_created', $actor, [
                'note' => sprintf(
                    'Tao lich hen %s vao %s (%s).',
                    $appointment->code,
                    Carbon::parse($appointment->appointment_date)->format('d/m/Y'),
                    $appointment->time_slot,
                ),
                'metadata' => ['appointment_id' => $appointment->id],
            ]);

            return [
                'request' => $request->fresh(['histories', 'patient', 'appointment']),
                'appointment' => $appointment,
            ];
        });

        // UC10 - Sau khi confirm thanh cong: gui appointment_confirmation +
        // schedule reminder 24h. Khong fail ca flow neu gui email loi (IR8).
        $this->dispatchNotificationAfterCommit(function (NotificationService $service) use ($result, $actor) {
            try {
                $service->dispatchForAppointment(
                    AppNotification::TYPE_APPOINTMENT_CONFIRMATION,
                    $result['appointment'],
                    [
                        'sent_by_user_id' => $actor->id,
                        'actor_name' => $actor->name,
                    ],
                );
            } catch (\Throwable $e) {
                report($e);
            }
            try {
                $service->scheduleReminder24h($result['appointment']);
            } catch (\Throwable $e) {
                report($e);
            }
        });

        return $result;
    }

    public function proposeAlternative(OnlineBookingRequest $request, array $payload, User $actor): OnlineBookingRequest
    {
        $this->assertProcessable($request);

        $fresh = DB::transaction(function () use ($request, $payload, $actor) {
            $request->status = OnlineBookingRequest::STATUS_PROPOSE_OTHER;
            $request->proposed_slots = $payload['proposed_slots'];
            $request->processed_by = $actor->id;
            $request->processed_at = now();
            $request->save();

            $countSlots = count($payload['proposed_slots']);
            $this->logHistory($request, 'alternative_proposed', $actor, [
                'note' => sprintf('De xuat %d khung gio thay the.', $countSlots),
                'metadata' => ['proposed_slots' => $payload['proposed_slots']],
            ]);

            return $request->fresh(['histories']);
        });

        // UC10 - Gui email de xuat khung gio thay the.
        $this->dispatchNotificationAfterCommit(function (NotificationService $service) use ($fresh, $payload, $actor) {
            try {
                $service->dispatchForOnlineBooking(
                    AppNotification::TYPE_ALTERNATIVE_PROPOSED,
                    $fresh,
                    [
                        'sent_by_user_id' => $actor->id,
                        'actor_name' => $actor->name,
                        'context_override' => [
                            'proposed_slots' => $payload['proposed_slots'] ?? [],
                            'message_body' => $payload['message'] ?? null,
                        ],
                    ],
                );
            } catch (\Throwable $e) {
                report($e);
            }
        });

        return $fresh;
    }

    public function rejectRequest(OnlineBookingRequest $request, string $reason, User $actor): OnlineBookingRequest
    {
        if ($request->status === OnlineBookingRequest::STATUS_APPOINTMENT_CREATED) {
            throw ValidationException::withMessages([
                'status' => 'Yeu cau da tao lich hen, khong the tu choi.',
            ]);
        }

        $fresh = DB::transaction(function () use ($request, $reason, $actor) {
            $request->status = OnlineBookingRequest::STATUS_REJECTED;
            $request->reject_reason = $reason;
            $request->processed_by = $actor->id;
            $request->processed_at = now();
            $request->save();

            $this->logHistory($request, 'request_rejected', $actor, [
                'note' => 'Ly do: '.$reason,
                'metadata' => ['reason' => $reason],
            ]);

            return $request->fresh(['histories']);
        });

        // UC10 - Gui email tu choi yeu cau (chi reason public, khong leak
        // internal_note - VR11).
        $this->dispatchNotificationAfterCommit(function (NotificationService $service) use ($fresh, $reason, $actor) {
            try {
                $service->dispatchForOnlineBooking(
                    AppNotification::TYPE_REQUEST_REJECTED,
                    $fresh,
                    [
                        'sent_by_user_id' => $actor->id,
                        'actor_name' => $actor->name,
                        'context_override' => [
                            'reject_reason' => $reason,
                        ],
                    ],
                );
            } catch (\Throwable $e) {
                report($e);
            }
        });

        return $fresh;
    }

    /**
     * UC10 - Helper goi callback voi NotificationService sau khi transaction
     * commit. Resolve service tu container de tranh circular constructor.
     */
    private function dispatchNotificationAfterCommit(callable $callback): void
    {
        DB::afterCommit(function () use ($callback) {
            $service = App::make(NotificationService::class);
            $callback($service);
        });
    }

    public function reopen(OnlineBookingRequest $request, User $actor): OnlineBookingRequest
    {
        if (! in_array($request->status, [
            OnlineBookingRequest::STATUS_REJECTED,
            OnlineBookingRequest::STATUS_CANCELED,
            OnlineBookingRequest::STATUS_EXPIRED,
        ], true)) {
            throw ValidationException::withMessages([
                'status' => 'Chi co the mo lai yeu cau o trang thai da tu choi, da huy hoac qua han.',
            ]);
        }

        return DB::transaction(function () use ($request, $actor) {
            $request->status = OnlineBookingRequest::STATUS_PROCESSING;
            $request->reject_reason = null;
            $request->processed_by = $actor->id;
            $request->processed_at = now();
            $request->save();

            $this->logHistory($request, 'request_reopened', $actor, [
                'note' => 'Mo lai yeu cau de tiep tuc xu ly.',
            ]);

            return $request->fresh(['histories']);
        });
    }

    public function updateInternalNote(OnlineBookingRequest $request, ?string $note, User $actor): OnlineBookingRequest
    {
        $note = $note !== null ? trim(strip_tags($note)) : null;

        $request->internal_note = $note;
        $request->save();

        $this->logHistory($request, 'internal_note_updated', $actor, [
            'note' => 'Ghi chu noi bo da cap nhat.',
        ]);

        return $request->fresh(['histories']);
    }

    public function markEmail(OnlineBookingRequest $request, string $kind, string $status, User $actor, ?string $errorMessage = null): OnlineBookingRequest
    {
        $request->email_status = $status;
        $request->save();

        $action = $status === OnlineBookingRequest::EMAIL_STATUS_SENT
            ? 'email_sent'
            : 'email_failed';

        $note = $status === OnlineBookingRequest::EMAIL_STATUS_SENT
            ? sprintf('Email %s da gui den %s.', $kind, $request->email)
            : sprintf('Gui email %s that bai: %s', $kind, $errorMessage ?? 'unknown');

        $this->logHistory($request, $action, $actor, [
            'note' => $note,
            'metadata' => ['kind' => $kind],
        ]);

        return $request->fresh(['histories']);
    }

    public function logHistory(
        OnlineBookingRequest $request,
        string $action,
        ?User $actor,
        array $extra = [],
    ): OnlineBookingRequestHistory {
        return OnlineBookingRequestHistory::create([
            'request_id' => $request->id,
            'action' => $action,
            'actor_id' => $actor?->id,
            'actor_name' => $actor?->name ?? ($extra['actor_name'] ?? null),
            'note' => $extra['note'] ?? null,
            'metadata' => $extra['metadata'] ?? null,
            'created_at' => now(),
        ]);
    }

    private function assertProcessable(OnlineBookingRequest $request): void
    {
        if (! $request->isProcessable()) {
            throw ValidationException::withMessages([
                'status' => 'Yeu cau o trang thai khong cho phep xu ly.',
            ]);
        }
    }
}
