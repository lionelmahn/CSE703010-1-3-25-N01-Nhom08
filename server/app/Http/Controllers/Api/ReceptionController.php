<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Appointment\CancelCheckInRequest;
use App\Http\Requests\Appointment\CheckInAppointmentRequest;
use App\Http\Requests\Appointment\NoShowAppointmentRequest;
use App\Models\Appointment;
use App\Services\AppointmentService;
use App\Services\CheckInService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * UC11 - API REST tiep nhan / check-in benh nhan.
 *
 * Quyen kiem tra o middleware:
 *  - `permission:appointments.view` cho GET (list, queue, queue-stats).
 *  - `permission:appointments.check_in` cho POST check-in, no-show.
 *  - `permission:appointments.cancel_check_in` cho POST cancel-check-in.
 */
class ReceptionController extends Controller
{
    public function __construct(
        private readonly CheckInService $checkIns,
        private readonly AppointmentService $appointments,
    ) {
    }

    public function todayAppointments(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'date' => ['nullable', 'date'],
            'branch_id' => ['nullable', 'string', 'max:64'],
            'q' => ['nullable', 'string', 'max:191'],
            'arrival_filter' => ['nullable', 'in:all,upcoming,checked_in,in_progress,other'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $paginator = $this->checkIns->listTodayAppointments($filters);
        $counts = $this->checkIns->todayCounts($filters);

        return response()->json([
            'data' => collect($paginator->items())
                ->map(fn (Appointment $a) => $this->transformAppointment($a))
                ->all(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
            'counts' => $counts,
        ]);
    }

    public function checkIn(CheckInAppointmentRequest $request, int $id): JsonResponse
    {
        $appointment = $this->appointments->findAppointment($id);
        $updated = $this->checkIns->checkIn(
            $appointment,
            $request->validated(),
            $request->user(),
        );

        return response()->json([
            'data' => $this->transformAppointment($updated, withHistory: true),
            'message' => 'Da check-in benh nhan '.$updated->patient?->full_name.'.',
        ]);
    }

    public function cancelCheckIn(CancelCheckInRequest $request, int $id): JsonResponse
    {
        $appointment = $this->appointments->findAppointment($id);
        $updated = $this->checkIns->cancelCheckIn(
            $appointment,
            $request->validated(),
            $request->user(),
        );

        return response()->json([
            'data' => $this->transformAppointment($updated, withHistory: true),
            'message' => 'Da huy check-in.',
        ]);
    }

    public function markNoShow(NoShowAppointmentRequest $request, int $id): JsonResponse
    {
        $appointment = $this->appointments->findAppointment($id);
        $updated = $this->checkIns->markNoShow(
            $appointment,
            $request->validated(),
            $request->user(),
        );

        return response()->json([
            'data' => $this->transformAppointment($updated, withHistory: true),
            'message' => 'Da danh dau khong den.',
        ]);
    }

    public function queue(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'date' => ['nullable', 'date'],
            'branch_id' => ['nullable', 'string', 'max:64'],
            'doctor_id' => ['nullable'],
            'bucket' => ['nullable', 'in:all,unassigned,waiting,ready,in_progress'],
        ]);

        if (($filters['doctor_id'] ?? null) === 'me') {
            $filters['doctor_id'] = $request->user()?->id;
        }

        return response()->json($this->checkIns->queue($filters));
    }

    public function queueStats(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'date' => ['nullable', 'date'],
            'branch_id' => ['nullable', 'string', 'max:64'],
        ]);

        return response()->json($this->checkIns->queueStats($filters));
    }

    public function reasons(): JsonResponse
    {
        return response()->json([
            'no_show_reasons' => [
                ['id' => 'khong_lien_lac_duoc', 'label' => 'Khong lien lac duoc benh nhan'],
                ['id' => 'benh_nhan_huy_phut_chot', 'label' => 'Benh nhan huy phut chot'],
                ['id' => 'qua_lau_khong_den', 'label' => 'Qua lau khong den'],
                ['id' => 'khac', 'label' => 'Khac'],
            ],
            'cancel_check_in_reasons' => [
                ['id' => 'sai_thong_tin', 'label' => 'Check-in nham/sai thong tin'],
                ['id' => 'benh_nhan_doi_y', 'label' => 'Benh nhan doi y'],
                ['id' => 'doi_ngay_kham', 'label' => 'Doi ngay/gio kham'],
                ['id' => 'khac', 'label' => 'Khac'],
            ],
            'arrival_flags' => [
                ['id' => Appointment::ARRIVAL_EARLY, 'label' => 'Den som'],
                ['id' => Appointment::ARRIVAL_ON_TIME, 'label' => 'Dung gio'],
                ['id' => Appointment::ARRIVAL_LATE, 'label' => 'Den tre'],
                ['id' => Appointment::ARRIVAL_VERY_LATE, 'label' => 'Tre nhieu'],
            ],
        ]);
    }

    /**
     * UC11 - Transform 1 Appointment kem check-in fields. Khac voi UC7
     * transform o cho luon dinh kem `allowed_actions.check_in/.no_show/
     * .cancel_check_in` + danh sach queue entries gan day nhat.
     */
    protected function transformAppointment(Appointment $a, bool $withHistory = false): array
    {
        $a->loadMissing([
            'patient',
            'assignedDoctor:id,name,email',
            'creator:id,name',
            'updater:id,name',
            'checkedInBy:id,name',
            'noShowBy:id,name',
            'checkInCancelledBy:id,name',
            'queueEntries' => fn ($q) => $q->limit(3),
        ]);
        if ($withHistory) {
            $a->loadMissing(['histories.actor:id,name']);
        }

        return [
            'id' => $a->id,
            'code' => $a->code,
            'status' => $a->status,
            'status_label' => $this->statusLabel($a->status),
            'source' => $a->source,
            'appointment_date' => optional($a->appointment_date)->toDateString(),
            'time_slot' => $a->time_slot,
            'service_ids' => $a->service_ids ?? [],
            'branch_id' => $a->branch_id,
            'notes' => $a->notes,
            'patient' => $a->patient ? [
                'id' => $a->patient->id,
                'code' => $a->patient->patient_code,
                'name' => $a->patient->full_name,
                'phone' => $a->patient->phone,
                'email' => $a->patient->email,
                'gender' => $a->patient->gender,
                'birthdate' => optional($a->patient->dob)->toDateString(),
                'address' => $a->patient->address,
                'total_debt' => (float) ($a->patient->total_debt ?? 0),
                'allergies' => $a->patient->allergies,
                'medical_history' => $a->patient->medical_history,
            ] : null,
            'assigned_doctor' => $a->assignedDoctor ? [
                'id' => $a->assignedDoctor->id,
                'name' => $a->assignedDoctor->name,
                'email' => $a->assignedDoctor->email,
            ] : null,
            // UC11 specific.
            'checked_in_at' => optional($a->checked_in_at)->toIso8601String(),
            'checked_in_by' => $a->checkedInBy?->name,
            'checked_in_by_id' => $a->checked_in_by,
            'arrival_flag' => $a->arrival_flag,
            'pre_checkin_status' => $a->pre_checkin_status,
            'no_show_at' => optional($a->no_show_at)->toIso8601String(),
            'no_show_by' => $a->noShowBy?->name,
            'no_show_reason' => $a->no_show_reason,
            'check_in_cancelled_at' => optional($a->check_in_cancelled_at)->toIso8601String(),
            'check_in_cancelled_by' => $a->checkInCancelledBy?->name,
            'queue_entry' => $a->queueEntries->first() ? [
                'id' => $a->queueEntries->first()->id,
                'code' => $a->queueEntries->first()->code,
                'bucket' => $a->queueEntries->first()->bucket,
                'queue_number' => $a->queueEntries->first()->queue_number,
                'entered_at' => optional($a->queueEntries->first()->entered_at)->toIso8601String(),
            ] : null,
            'allowed_actions' => [
                'check_in' => $a->canBeCheckedIn(),
                'cancel_check_in' => $a->canCancelCheckIn(),
                'no_show' => $a->canMarkNoShow(),
                'assign' => $a->canAssignDoctor(),
                'edit' => $a->canBeEdited(),
                'reschedule' => $a->canBeRescheduled(),
                'cancel' => $a->canBeCancelled(),
            ],
            'history' => $withHistory
                ? $a->histories->map(fn ($h) => [
                    'id' => $h->id,
                    'action' => $h->action,
                    'from_status' => $h->from_status,
                    'to_status' => $h->to_status,
                    'reason' => $h->reason,
                    'metadata' => $h->metadata,
                    'actor' => $h->actor?->name ?? $h->actor_name ?? 'He thong',
                    'actor_id' => $h->actor_id,
                    'at' => optional($h->created_at)?->toIso8601String(),
                ])->values()->all()
                : null,
            'created_at' => optional($a->created_at)->toIso8601String(),
            'updated_at' => optional($a->updated_at)->toIso8601String(),
        ];
    }

    protected function statusLabel(string $status): string
    {
        return match ($status) {
            Appointment::STATUS_WAITING_DOCTOR_ASSIGNMENT => 'Cho phan cong bac si',
            Appointment::STATUS_DOCTOR_ASSIGNED => 'Da phan cong bac si',
            Appointment::STATUS_CONFIRMED => 'Da xac nhan',
            Appointment::STATUS_CHECKED_IN => 'Da check-in',
            Appointment::STATUS_IN_PROGRESS => 'Dang kham',
            Appointment::STATUS_COMPLETED => 'Hoan tat',
            Appointment::STATUS_CANCELLED => 'Da huy',
            Appointment::STATUS_RESCHEDULED => 'Doi lich',
            Appointment::STATUS_NO_SHOW => 'Khong den',
            default => $status,
        };
    }
}
