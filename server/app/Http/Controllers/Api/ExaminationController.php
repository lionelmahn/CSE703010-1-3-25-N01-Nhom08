<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Examination\BulkToothChartRequest;
use App\Http\Requests\Examination\CompleteExaminationRequest;
use App\Http\Requests\Examination\LockExaminationRequest;
use App\Http\Requests\Examination\RecallExaminationRequest;
use App\Http\Requests\Examination\SaveDraftRequest;
use App\Http\Requests\Examination\StartExaminationRequest;
use App\Http\Requests\Examination\StoreServiceItemRequest;
use App\Http\Requests\Examination\UpdateExaminationRequest;
use App\Http\Requests\Examination\UpdateServiceItemRequest;
use App\Models\ExaminationServiceItem;
use App\Models\ExaminationSession;
use App\Models\Service;
use App\Models\ToothStatus;
use App\Models\User;
use App\Services\ComplexityConfigService;
use App\Services\ExaminationService;
use App\Services\ExaminationServiceItemService;
use App\Services\ToothChartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * UC12 - REST API cho phien kham / ho so benh an.
 *
 * Tat ca endpoint deu yeu cau auth:sanctum + permission tuong ung.
 * Permission slug check duoc dat o routes/api.php (middleware('permission:..')).
 *
 * Cac action ghi/sua co them check owner-or-admin trong service.
 */
class ExaminationController extends Controller
{
    public function __construct(
        private readonly ExaminationService $examinations,
        private readonly ComplexityConfigService $complexity,
        private readonly ExaminationServiceItemService $items,
        private readonly ToothChartService $toothChart,
    ) {}

    public function worklist(Request $request): JsonResponse
    {
        $paginator = $this->examinations->worklist($request->only([
            'q', 'status', 'doctor_id', 'tab', 'from', 'to', 'per_page', 'page',
        ]), $request->user());

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
            'counts' => $this->examinations->worklistCounts($request->user()),
        ]);
    }

    public function start(StartExaminationRequest $request): JsonResponse
    {
        $session = $this->examinations->start((int) $request->input('appointment_id'), $request->user());

        return response()->json(['data' => $this->examinations->show($session->id)], Response::HTTP_CREATED);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(['data' => $this->examinations->show($id)]);
    }

    public function update(int $id, UpdateExaminationRequest $request): JsonResponse
    {
        $this->ensureOwnerOrAdmin($id, $request);
        $session = $this->examinations->update($id, $request->validated(), $request->user());

        return response()->json(['data' => $this->examinations->show($session->id)]);
    }

    public function saveDraft(int $id, SaveDraftRequest $request): JsonResponse
    {
        $this->ensureOwnerOrAdmin($id, $request);
        $session = $this->examinations->saveDraft($id, $request->input('note'), $request->user());

        return response()->json(['data' => $this->examinations->show($session->id)]);
    }

    public function complete(int $id, CompleteExaminationRequest $request): JsonResponse
    {
        $this->ensureOwnerOrAdmin($id, $request);
        $session = $this->examinations->complete($id, $request->validated(), $request->user());

        return response()->json(['data' => $this->examinations->show($session->id)]);
    }

    public function recall(int $id, RecallExaminationRequest $request): JsonResponse
    {
        $this->ensureOwnerOrAdmin($id, $request);
        $session = $this->examinations->setRecall($id, $request->validated(), $request->user());

        return response()->json(['data' => $this->examinations->show($session->id)]);
    }

    public function lock(int $id, LockExaminationRequest $request): JsonResponse
    {
        // bac_si chi khoa phien cua minh; admin co the khoa moi phien.
        $this->ensureOwnerOrAdmin($id, $request);
        $session = $this->examinations->lock($id, (string) $request->input('reason'), $request->user());

        return response()->json(['data' => $this->examinations->show($session->id)]);
    }

    public function unlock(int $id, LockExaminationRequest $request): JsonResponse
    {
        // unlock chi admin (permission da check o route middleware).
        $session = $this->examinations->unlock($id, (string) $request->input('reason'), $request->user());

        return response()->json(['data' => $this->examinations->show($session->id)]);
    }

    public function histories(int $id): JsonResponse
    {
        $session = ExaminationSession::findOrFail($id);

        return response()->json([
            'data' => $session->histories()->with('actor:id,name')->paginate(30),
        ]);
    }

    /* =============================================================
     * Service items (DR69-DR76)
     * ============================================================= */

    public function storeServiceItem(int $id, StoreServiceItemRequest $request): JsonResponse
    {
        $this->ensureOwnerOrAdmin($id, $request);
        $item = $this->items->addItem($id, $request->validated(), $request->user());

        return response()->json(['data' => $this->examinations->show($id), 'item' => $item], Response::HTTP_CREATED);
    }

    public function updateServiceItem(int $id, int $itemId, UpdateServiceItemRequest $request): JsonResponse
    {
        $this->ensureOwnerOrAdmin($id, $request);
        $item = $this->items->updateItem($id, $itemId, $request->validated(), $request->user());

        return response()->json(['data' => $this->examinations->show($id), 'item' => $item]);
    }

    public function destroyServiceItem(int $id, int $itemId, Request $request): JsonResponse
    {
        $this->ensureOwnerOrAdmin($id, $request);
        $this->items->removeItem($id, $itemId, $request->user());

        return response()->json(['data' => $this->examinations->show($id)]);
    }

    /* =============================================================
     * Tooth chart (DR68)
     * ============================================================= */

    public function toothChart(int $id): JsonResponse
    {
        // Ensure exists - 404 otherwise.
        ExaminationSession::query()->select('id')->findOrFail($id);

        return response()->json([
            'data' => $this->toothChart->listForExamination($id),
        ]);
    }

    public function upsertToothChart(int $id, BulkToothChartRequest $request): JsonResponse
    {
        $this->ensureOwnerOrAdmin($id, $request);
        $entries = $this->toothChart->bulkUpsert($id, $request->validated()['entries'], $request->user());

        return response()->json(['data' => $entries]);
    }

    public function patientExaminations(int $patientId, Request $request): JsonResponse
    {
        $paginator = $this->examinations->patientExaminations(
            $patientId,
            (int) $request->input('limit', 10)
        );

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    public function serviceCatalog(Request $request): JsonResponse
    {
        $q = (string) $request->input('q', '');
        $services = Service::query()
            ->select('id', 'service_code', 'name', 'price', 'duration_minutes', 'status')
            ->where('status', Service::STATUS_ACTIVE)
            ->when($q !== '', function ($builder) use ($q) {
                $builder->where(function ($b) use ($q) {
                    $b->where('name', 'like', '%'.$q.'%')
                        ->orWhere('service_code', 'like', '%'.$q.'%');
                });
            })
            ->orderBy('name')
            ->limit(50)
            ->get();

        return response()->json(['data' => $services]);
    }

    public function toothStatuses(): JsonResponse
    {
        $statuses = ToothStatus::query()
            ->select('id', 'code', 'name', 'color', 'icon', 'tooth_status_group_id', 'is_active')
            ->where('is_active', true)
            ->orderBy('display_order')
            ->orderBy('id')
            ->get();

        return response()->json(['data' => $statuses]);
    }

    public function options(): JsonResponse
    {
        return response()->json([
            'data' => [
                'processing_levels' => collect($this->complexity->processingLevels())
                    ->map(fn ($label, $key) => [
                        'value' => $key,
                        'label' => $label,
                        'default_coefficient' => $this->complexity->coefficientFor(null, $key),
                    ])
                    ->values(),
                'allowed_coefficients' => $this->complexity->allowedCoefficients(),
                'max_service_items' => $this->complexity->maxServiceItemsPerExamination(),
                'statuses' => collect(ExaminationSession::ALL_STATUSES)->map(fn ($s) => [
                    'value' => $s,
                    'label' => self::statusLabel($s),
                ]),
                'service_item_levels' => collect(ExaminationServiceItem::ALL_LEVELS)->map(fn ($l) => [
                    'value' => $l,
                    'label' => ExaminationServiceItem::LEVEL_LABELS[$l] ?? $l,
                ]),
            ],
        ]);
    }

    public function serviceComplexityPreview(Request $request): JsonResponse
    {
        $data = $request->validate([
            'service_id' => ['required', 'integer', 'exists:services,id'],
            'processing_level' => ['required', 'string'],
            'date' => ['nullable', 'date'],
        ]);

        if (! $this->complexity->isValidLevel($data['processing_level'])) {
            return response()->json([
                'message' => 'Muc xu ly khong hop le.',
                'errors' => ['processing_level' => ['Muc xu ly khong hop le.']],
            ], 422);
        }

        $snapshot = $this->complexity->snapshotFor(
            (int) $data['service_id'],
            $data['processing_level'],
            $request->user(),
            logDefault: false,
            date: $data['date'] ?? null,
        );

        return response()->json([
            'data' => [
                'service_id' => (int) $data['service_id'],
                'processing_level' => $data['processing_level'],
                'coefficient' => $snapshot['coefficient'],
                'config_id' => $snapshot['config_id'],
                'is_default' => $snapshot['is_default'],
            ],
        ]);
    }

    /**
     * Bac si chi duoc thao tac voi phien cua minh; admin override.
     */
    private function ensureOwnerOrAdmin(int $id, Request $request): void
    {
        /** @var User $user */
        $user = $request->user();
        if ($user && $user->hasRole('admin')) {
            return;
        }

        $session = ExaminationSession::query()->select('doctor_id')->find($id);
        if (! $session) {
            abort(404);
        }
        if ((int) $session->doctor_id !== (int) $user?->id) {
            abort(403, 'Chi bac si cua phien moi co the thao tac (AC2/VR13).');
        }
    }

    public static function statusLabel(string $status): string
    {
        return match ($status) {
            ExaminationSession::STATUS_CHO_KHAM => 'Cho kham',
            ExaminationSession::STATUS_DANG_KHAM => 'Dang kham',
            ExaminationSession::STATUS_NHAP => 'Ban nhap',
            ExaminationSession::STATUS_CHO_THANH_TOAN => 'Cho thanh toan',
            ExaminationSession::STATUS_HOAN_TAT => 'Da hoan tat',
            ExaminationSession::STATUS_DA_KHOA => 'Da khoa',
            ExaminationSession::STATUS_DA_HUY => 'Da huy',
            default => $status,
        };
    }
}
