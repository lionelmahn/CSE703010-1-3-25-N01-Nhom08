<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\TransformsBookingResponses;
use App\Http\Controllers\Controller;
use App\Http\Requests\MergePatientsRequest;
use App\Http\Requests\StorePatientRequest;
use App\Http\Requests\UpdatePatientRequest;
use App\Models\Patient;
use App\Services\PatientService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * UC5 + UC6.2 - Quan ly ho so benh nhan.
 *
 * Quyen kiem tra o middleware (`permission:patients.*`). Tat ca business
 * logic nam trong PatientService.
 */
class PatientController extends Controller
{
    use TransformsBookingResponses;

    public function __construct(private readonly PatientService $patients)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:191'],
            'status' => ['nullable', 'string', 'max:32'],
            'source' => ['nullable', 'string', 'max:64'],
            'gender' => ['nullable', 'string', 'max:16'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
            'sort_by' => ['nullable', 'string'],
            'sort_dir' => ['nullable', 'string'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $paginator = $this->patients->listPatients($filters);

        return response()->json([
            'data' => collect($paginator->items())->map(fn ($p) => $this->transformPatientFull($p))->all(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    public function store(StorePatientRequest $request): JsonResponse
    {
        $patient = $this->patients->createPatient(
            $request->validatedPayload(),
            $request->user(),
        );

        return response()->json([
            'data' => $this->transformPatientFull($patient),
            'message' => 'Tạo hồ sơ thành công ('.$patient->patient_code.').',
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $patient = $this->patients->findPatient($id);

        return response()->json([
            'data' => $this->transformPatientFull($patient),
        ]);
    }

    public function update(UpdatePatientRequest $request, int $id): JsonResponse
    {
        $patient = $this->patients->updatePatient(
            $id,
            $request->validatedPayload(),
            $request->user(),
        );

        return response()->json([
            'data' => $this->transformPatientFull($patient),
            'message' => 'Cập nhật hồ sơ thành công.',
        ]);
    }

    public function deactivate(Request $request, int $id): JsonResponse
    {
        $payload = $request->validate([
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $patient = $this->patients->deactivatePatient(
            $id,
            $payload['reason'] ?? null,
            $request->user(),
        );

        return response()->json([
            'data' => $this->transformPatientFull($patient),
            'message' => 'Đã chuyển hồ sơ sang Ngừng hoạt động.',
        ]);
    }

    public function reactivate(Request $request, int $id): JsonResponse
    {
        $patient = $this->patients->reactivatePatient($id, $request->user());

        return response()->json([
            'data' => $this->transformPatientFull($patient),
            'message' => 'Đã mở lại hồ sơ.',
        ]);
    }

    public function merge(MergePatientsRequest $request): JsonResponse
    {
        $primary = $this->patients->mergePatients(
            (int) $request->input('primary_id'),
            array_map('intval', $request->input('secondary_ids', [])),
            $request->input('note'),
            $request->user(),
        );

        return response()->json([
            'data' => $this->transformPatientFull($primary),
            'message' => 'Đã gộp hồ sơ thành công.',
        ]);
    }

    public function duplicateCheck(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'full_name' => ['nullable', 'string', 'max:191'],
            'phone' => ['nullable', 'string', 'max:32'],
            'email' => ['nullable', 'string', 'max:191'],
            'id_number' => ['nullable', 'string', 'max:32'],
            'dob' => ['nullable', 'date'],
            'exclude_id' => ['nullable', 'integer', 'min:1'],
        ]);

        $duplicates = $this->patients->checkDuplicates(
            $payload,
            $payload['exclude_id'] ?? null,
        );

        return response()->json([
            'data' => $duplicates,
            'meta' => [
                'count' => count($duplicates),
            ],
        ]);
    }

    public function history(int $id): JsonResponse
    {
        // Ensure patient exists; throws 404 if not.
        $this->patients->findPatient($id);

        $history = $this->patients->patientHistory($id);

        return response()->json([
            'data' => $history->map(fn ($h) => [
                'id' => $h->id,
                'action' => $h->action,
                'actor_id' => $h->actor_id,
                'actor_name' => $h->actor?->name ?? $h->actor_name ?? 'Hệ thống',
                'note' => $h->note,
                'before' => $h->before,
                'after' => $h->after,
                'metadata' => $h->metadata,
                'at' => optional($h->created_at)->toIso8601String(),
            ])->all(),
        ]);
    }

    public function sources(): JsonResponse
    {
        return response()->json([
            'data' => $this->patients->listSources(),
        ]);
    }

    /**
     * UC6.2 - giu nguyen API lookup cu (used by FE booking management).
     */
    public function lookup(Request $request): JsonResponse
    {
        $params = $request->validate([
            'q' => ['nullable', 'string', 'max:191'],
            'phone' => ['nullable', 'string', 'max:32'],
            'email' => ['nullable', 'string', 'max:191'],
            'name' => ['nullable', 'string', 'max:100'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $query = Patient::query()->where('status', '!=', Patient::STATUS_MERGED);

        if (! empty($params['phone'])) {
            $query->where('phone', 'like', '%'.$params['phone'].'%');
        }
        if (! empty($params['email'])) {
            $query->where('email', 'like', '%'.$params['email'].'%');
        }
        if (! empty($params['name'])) {
            $query->where('full_name', 'like', '%'.$params['name'].'%');
        }
        if (! empty($params['q'])) {
            $term = '%'.$params['q'].'%';
            $query->where(function ($q) use ($term) {
                $q->where('full_name', 'like', $term)
                    ->orWhere('phone', 'like', $term)
                    ->orWhere('email', 'like', $term)
                    ->orWhere('patient_code', 'like', $term);
            });
        }

        $limit = $params['limit'] ?? 10;
        $patients = $query->orderByDesc('updated_at')->limit($limit)->get();

        return response()->json([
            'data' => $patients->map(fn ($p) => $this->transformPatient($p))->all(),
        ]);
    }

    /**
     * Shape day du cho UC5 (mo rong tu transformPatient cu).
     */
    protected function transformPatientFull(Patient $patient): array
    {
        $base = $this->transformPatient($patient);

        return array_merge($base, [
            'status' => $patient->status,
            'source' => $patient->source,
            'id_number' => $patient->id_number,
            'dob' => optional($patient->dob)->toDateString(),
            'full_name' => $patient->full_name,
            'patient_code' => $patient->patient_code,
            'occupation' => $patient->occupation,
            'marital_status' => $patient->marital_status,
            'medical_history' => $patient->medical_history,
            'allergies' => $patient->allergies,
            'notes' => $patient->notes,
            'loyalty_points' => (int) $patient->loyalty_points,
            'total_debt' => (float) $patient->total_debt,
            'last_visit_at' => optional($patient->last_visit_at)->toIso8601String(),
            'deactivated_at' => optional($patient->deactivated_at)->toIso8601String(),
            'deactivation_reason' => $patient->deactivation_reason,
            'merged_at' => optional($patient->merged_at)->toIso8601String(),
            'merged_into_id' => $patient->merged_into_id,
            'merged_into' => $patient->relationLoaded('mergedInto') && $patient->mergedInto
                ? [
                    'id' => $patient->mergedInto->id,
                    'patient_code' => $patient->mergedInto->patient_code,
                    'full_name' => $patient->mergedInto->full_name,
                ]
                : null,
            'merged_from' => $patient->relationLoaded('mergedFrom')
                ? $patient->mergedFrom->map(fn ($p) => [
                    'id' => $p->id,
                    'patient_code' => $p->patient_code,
                    'full_name' => $p->full_name,
                    'merged_at' => optional($p->merged_at)->toIso8601String(),
                ])->values()->all()
                : [],
            'created_by' => $patient->relationLoaded('creator') ? $patient->creator?->name : null,
            'updated_by' => $patient->relationLoaded('updater') ? $patient->updater?->name : null,
            'appointments_count' => (int) ($patient->appointments_count ?? 0),
            'online_booking_requests_count' => (int) ($patient->online_booking_requests_count ?? 0),
            'created_at' => optional($patient->created_at)->toIso8601String(),
            'updated_at' => optional($patient->updated_at)->toIso8601String(),
        ]);
    }
}
