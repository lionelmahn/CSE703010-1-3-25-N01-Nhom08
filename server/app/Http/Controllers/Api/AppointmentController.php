<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Appointment\CancelAppointmentRequest;
use App\Http\Requests\Appointment\RescheduleAppointmentRequest;
use App\Http\Requests\Appointment\StoreAppointmentRequest;
use App\Http\Requests\Appointment\UpdateAppointmentRequest;
use App\Models\Appointment;
use App\Models\Branch;
use App\Models\Patient;
use App\Services\AppointmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * UC7 - API REST quan ly lich hen chinh thuc.
 *
 * Quyen kiem tra o middleware (`permission:appointments.view`,
 * `permission:appointments.create`). Business logic giao het cho service.
 *
 * UC7 KHONG expose:
 *  - Assign bac si / phong (UC8) - VR12, AC18.
 *  - Check-in, bat dau kham, hoan tat, khong den (UC9) - VR11, AC19.
 */
class AppointmentController extends Controller
{
    public function __construct(private readonly AppointmentService $appointments)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'status' => ['nullable', 'string', 'max:64'],
            'branch_id' => ['nullable', 'string', 'max:64'],
            'source' => ['nullable', 'string', 'max:64'],
            'doctor_id' => ['nullable'],
            'service_id' => ['nullable', 'string', 'max:64'],
            'q' => ['nullable', 'string', 'max:191'],
            'date' => ['nullable', 'date'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
            'date_dir' => ['nullable', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $paginator = $this->appointments->listAppointments($filters);
        $counts = $this->appointments->statusCounts($filters);

        return response()->json([
            'data' => collect($paginator->items())->map(fn (Appointment $a) => $this->transform($a, withHistory: false))->all(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
            'counts' => $counts,
        ]);
    }

    public function counts(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'branch_id' => ['nullable', 'string', 'max:64'],
            'date' => ['nullable', 'date'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
        ]);

        return response()->json([
            'counts' => $this->appointments->statusCounts($filters),
        ]);
    }

    /**
     * UC7 - Du lieu cho calendar (Day/Week/Month) theo HTML thiet ke.
     */
    public function calendar(Request $request): JsonResponse
    {
        $data = $request->validate([
            'view' => ['nullable', 'in:day,week,month'],
            'date' => ['nullable', 'date'],
            'branch_id' => ['nullable', 'string', 'max:64'],
            'doctor_id' => ['nullable'],
            'status' => ['nullable', 'string', 'max:64'],
        ]);

        $payload = $this->appointments->calendarData(
            $data['view'] ?? 'day',
            $data['date'] ?? null,
            $data,
        );

        return response()->json($payload);
    }

    public function options(Request $request): JsonResponse
    {
        $branches = Branch::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'city', 'address'])
            ->map(fn (Branch $b) => [
                'id' => $b->code ?: (string) $b->id,
                'code' => $b->code,
                'name' => $b->name,
                'label' => $b->name,
                'city' => $b->city,
                'address' => $b->address,
                'active' => true,
            ])->values();

        $patientQuery = Patient::query()
            ->where('status', Patient::STATUS_ACTIVE)
            ->orderByDesc('id');

        if ($q = $request->string('patient_q')->toString()) {
            $term = '%'.$q.'%';
            $patientQuery->where(function ($w) use ($term) {
                $w->where('full_name', 'like', $term)
                    ->orWhere('phone', 'like', $term)
                    ->orWhere('patient_code', 'like', $term);
            });
        }

        $patients = $patientQuery
            ->limit(50)
            ->get(['id', 'patient_code', 'full_name', 'phone', 'email'])
            ->map(fn (Patient $p) => [
                'id' => $p->id,
                'code' => $p->patient_code,
                'name' => $p->full_name,
                'phone' => $p->phone,
                'email' => $p->email,
            ])->values();

        return response()->json([
            'branches' => $branches,
            'patients' => $patients,
            'sources' => [
                ['id' => Appointment::SOURCE_ONLINE, 'label' => 'Online (UC6.2)'],
                ['id' => Appointment::SOURCE_WALK_IN, 'label' => 'Truc tiep tai quay'],
                ['id' => Appointment::SOURCE_PHONE, 'label' => 'Dien thoai'],
                ['id' => Appointment::SOURCE_FOLLOW_UP, 'label' => 'Tai kham'],
            ],
            'time_slots' => [
                ['id' => '08-09', 'label' => '08:00 - 09:00', 'break' => false],
                ['id' => '09-10', 'label' => '09:00 - 10:00', 'break' => false],
                ['id' => '10-11', 'label' => '10:00 - 11:00', 'break' => false],
                ['id' => '11-12', 'label' => '11:00 - 12:00', 'break' => false],
                ['id' => '12-13', 'label' => '12:00 - 13:00 (Nghi trua)', 'break' => true],
                ['id' => '13-14', 'label' => '13:00 - 14:00', 'break' => false],
                ['id' => '14-15', 'label' => '14:00 - 15:00', 'break' => false],
                ['id' => '15-16', 'label' => '15:00 - 16:00', 'break' => false],
                ['id' => '16-17', 'label' => '16:00 - 17:00', 'break' => false],
                ['id' => '17-1730', 'label' => '17:00 - 17:30', 'break' => false],
            ],
            'statuses' => collect(Appointment::ALL_STATUSES)->map(fn ($s) => [
                'id' => $s,
                'label' => $this->statusLabel($s),
            ])->values(),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $appointment = $this->appointments->findAppointment($id);

        return response()->json([
            'data' => $this->transform($appointment, withHistory: true),
        ]);
    }

    public function store(StoreAppointmentRequest $request): JsonResponse
    {
        $appointment = $this->appointments->createAppointment(
            $request->validated(),
            $request->user(),
        );

        return response()->json([
            'data' => $this->transform($appointment, withHistory: true),
            'message' => 'Da tao lich hen '.$appointment->code.'.',
        ], 201);
    }

    public function update(UpdateAppointmentRequest $request, int $id): JsonResponse
    {
        $appointment = $this->appointments->findAppointment($id);
        $updated = $this->appointments->updateAppointment(
            $appointment,
            $request->validated(),
            $request->user(),
        );

        return response()->json([
            'data' => $this->transform($updated, withHistory: true),
            'message' => 'Cap nhat lich hen thanh cong.',
        ]);
    }

    public function reschedule(RescheduleAppointmentRequest $request, int $id): JsonResponse
    {
        $appointment = $this->appointments->findAppointment($id);
        $updated = $this->appointments->rescheduleAppointment(
            $appointment,
            $request->validated(),
            $request->user(),
        );

        return response()->json([
            'data' => $this->transform($updated, withHistory: true),
            'message' => 'Da doi lich hen.',
        ]);
    }

    public function cancel(CancelAppointmentRequest $request, int $id): JsonResponse
    {
        $appointment = $this->appointments->findAppointment($id);
        $updated = $this->appointments->cancelAppointment(
            $appointment,
            $request->input('reason'),
            $request->user(),
        );

        return response()->json([
            'data' => $this->transform($updated, withHistory: true),
            'message' => 'Da huy lich hen.',
        ]);
    }

    protected function transform(Appointment $a, bool $withHistory = false): array
    {
        $a->loadMissing(['patient', 'assignedDoctor:id,name,email', 'creator:id,name', 'updater:id,name', 'bookingRequest:id,code,status,source']);
        if ($withHistory) {
            $a->loadMissing(['histories.actor:id,name']);
        }

        return [
            'id' => $a->id,
            'code' => $a->code,
            'status' => $a->status,
            'status_label' => $this->statusLabel($a->status),
            'source' => $a->source,
            'online_booking_request_id' => $a->online_booking_request_id,
            'online_booking_request_code' => $a->bookingRequest?->code,
            'appointment_date' => optional($a->appointment_date)->toDateString(),
            'time_slot' => $a->time_slot,
            'service_ids' => $a->service_ids ?? [],
            'branch_id' => $a->branch_id,
            'notes' => $a->notes,
            'reschedule_reason' => $a->reschedule_reason,
            'cancel_reason' => $a->cancel_reason,
            'cancelled_at' => optional($a->cancelled_at)->toIso8601String(),
            'rescheduled_at' => optional($a->rescheduled_at)->toIso8601String(),
            'patient' => $a->patient ? [
                'id' => $a->patient->id,
                'code' => $a->patient->patient_code,
                'name' => $a->patient->full_name,
                'phone' => $a->patient->phone,
                'email' => $a->patient->email,
                'gender' => $a->patient->gender,
                'birthdate' => optional($a->patient->dob)->toDateString(),
                'address' => $a->patient->address,
            ] : null,
            'assigned_doctor' => $a->assignedDoctor ? [
                'id' => $a->assignedDoctor->id,
                'name' => $a->assignedDoctor->name,
                'email' => $a->assignedDoctor->email,
            ] : null,
            'created_by' => $a->creator?->name,
            'created_by_id' => $a->created_by,
            'updated_by' => $a->updater?->name,
            'updated_by_id' => $a->updated_by,
            'created_at' => optional($a->created_at)->toIso8601String(),
            'updated_at' => optional($a->updated_at)->toIso8601String(),
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
            'allowed_actions' => [
                'edit' => $a->canBeEdited(),
                'reschedule' => $a->canBeRescheduled(),
                'cancel' => $a->canBeCancelled(),
            ],
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
