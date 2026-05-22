<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\OnlineBookingRequest;
use App\Models\Patient;
use App\Models\PatientHistory;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * UC5 - Quan ly ho so benh nhan.
 *
 * - Tao/sua ho so kem audit history.
 * - Sinh ma BN tu dong qua Patient::generateCode().
 * - Phat hien trung (E5) theo phone/email/CCCD/(ten+ngay sinh) voi xep hang
 *   muc do giong nhau.
 * - State machine: active <-> inactive (E8 kiem tra lich hen mo); active|inactive
 *   -> merged khi gop ho so trung.
 * - Khi gop: chuyen toan bo lich hen, yeu cau online ve ho so chinh; ho so phu
 *   bi danh dau "merged" va luu merged_into_id.
 */
class PatientService
{
    /**
     * Cac nguon tiep nhan goi y san. Lien tuc bo sung tu DB qua sources().
     */
    public const DEFAULT_SOURCES = [
        'Website',
        'Facebook',
        'Zalo',
        'Giới thiệu',
        'Đến trực tiếp',
        'Khác',
    ];

    public function __construct(private readonly AuditLogService $auditLog)
    {
    }

    /**
     * Danh sach + filter + pagination.
     *
     * Toan bo key trong `$filters` deu la optional - service phai tu set
     * default an toan thay vi assume controller da merge default.
     */
    public const SORTABLE_FIELDS = ['updated_at', 'created_at', 'full_name', 'patient_code'];

    public const DEFAULT_SORT_BY = 'updated_at';

    public const DEFAULT_SORT_DIR = 'desc';

    public const DEFAULT_PER_PAGE = 15;

    public const MAX_PER_PAGE = 100;

    public function listPatients(array $filters): LengthAwarePaginator
    {
        $query = Patient::query()
            ->with(['creator:id,name', 'updater:id,name', 'mergedInto:id,patient_code,full_name'])
            ->withCount(['appointments', 'onlineBookingRequests']);

        if (! empty($filters['q'])) {
            $term = '%'.trim((string) $filters['q']).'%';
            $query->where(function ($q) use ($term) {
                $q->where('full_name', 'like', $term)
                    ->orWhere('phone', 'like', $term)
                    ->orWhere('email', 'like', $term)
                    ->orWhere('patient_code', 'like', $term)
                    ->orWhere('id_number', 'like', $term);
            });
        }

        if (! empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['source']) && $filters['source'] !== 'all') {
            $query->where('source', $filters['source']);
        }

        if (! empty($filters['gender']) && $filters['gender'] !== 'all') {
            $query->where('gender', $filters['gender']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }
        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        $perPage = (int) ($filters['per_page'] ?? self::DEFAULT_PER_PAGE);
        if ($perPage < 1 || $perPage > self::MAX_PER_PAGE) {
            $perPage = self::DEFAULT_PER_PAGE;
        }

        // Whitelist sort_by - default neu thieu hoac khong thuoc list cho phep.
        $sortBy = $filters['sort_by'] ?? self::DEFAULT_SORT_BY;
        if (! in_array($sortBy, self::SORTABLE_FIELDS, true)) {
            $sortBy = self::DEFAULT_SORT_BY;
        }

        // Whitelist sort_dir - chi nhan asc/desc, default desc.
        $sortDir = strtolower((string) ($filters['sort_dir'] ?? self::DEFAULT_SORT_DIR));
        if (! in_array($sortDir, ['asc', 'desc'], true)) {
            $sortDir = self::DEFAULT_SORT_DIR;
        }

        return $query->orderBy($sortBy, $sortDir)->paginate($perPage);
    }

    /**
     * Chi tiet ho so (sau khi quyen da duoc check o middleware).
     */
    public function findPatient(int $id): Patient
    {
        return Patient::with([
            'creator:id,name',
            'updater:id,name',
            'mergedInto:id,patient_code,full_name',
            'mergedFrom:id,patient_code,full_name,merged_at',
        ])
            ->withCount(['appointments', 'onlineBookingRequests'])
            ->findOrFail($id);
    }

    /**
     * Tao moi ho so. Neu phat hien trung va khong co force_create_reason -> 422.
     */
    public function createPatient(array $data, ?User $actor): Patient
    {
        $duplicates = $this->checkDuplicates($data);
        $forceReason = trim((string) ($data['force_create_reason'] ?? ''));

        if (! empty($duplicates) && $forceReason === '') {
            // E5 — phat hien ho so trung, can ly do hop le moi cho tao tiep.
            throw ValidationException::withMessages([
                'duplicates' => 'Phát hiện hồ sơ trùng. Vui lòng kiểm tra hoặc nhập lý do tạo mới (E5).',
            ])->status(422);
        }

        return DB::transaction(function () use ($data, $actor, $forceReason, $duplicates) {
            $payload = $this->sanitizePayload($data, isUpdate: false);
            $payload['patient_code'] = Patient::generateCode();
            $payload['status'] = Patient::STATUS_ACTIVE;
            $payload['is_active'] = true;
            $payload['created_by'] = $actor?->id;
            $payload['updated_by'] = $actor?->id;
            if ($forceReason !== '') {
                $payload['force_create_reason'] = $forceReason;
            }

            $patient = Patient::create($payload);

            $this->recordHistory(
                $patient,
                'created',
                null,
                $patient->fresh()->toArray(),
                $actor,
                $forceReason !== '' ? 'Tạo mới (force): '.$forceReason : 'Tạo mới hồ sơ',
                ['duplicates_detected' => array_map(fn ($d) => $d['id'], $duplicates)],
            );
            $this->auditLog->log($actor, 'patient.created', [
                'patient_id' => $patient->id,
                'patient_code' => $patient->patient_code,
                'forced' => $forceReason !== '',
            ]);

            return $this->findPatient($patient->id);
        });
    }

    /**
     * Cap nhat ho so. Neu doi field dinh danh (phone/email/cccd/name+dob) va
     * gay trung, yeu cau force_create_reason.
     */
    public function updatePatient(int $id, array $data, ?User $actor): Patient
    {
        $patient = Patient::findOrFail($id);

        // BR: ho so da merged khong cho sua.
        if ($patient->isMerged()) {
            throw ValidationException::withMessages([
                'status' => 'Hồ sơ đã gộp không thể chỉnh sửa.',
            ])->status(422);
        }

        $identifyingFields = ['phone', 'email', 'id_number', 'full_name', 'dob'];
        $touchedIdentity = false;
        foreach ($identifyingFields as $field) {
            if (array_key_exists($field, $data) && (string) $data[$field] !== (string) $patient->{$field}) {
                $touchedIdentity = true;
                break;
            }
        }

        $forceReason = trim((string) ($data['force_create_reason'] ?? ''));
        $duplicates = [];
        if ($touchedIdentity) {
            $duplicates = $this->checkDuplicates([
                'phone' => $data['phone'] ?? $patient->phone,
                'email' => $data['email'] ?? $patient->email,
                'id_number' => $data['id_number'] ?? $patient->id_number,
                'full_name' => $data['full_name'] ?? $patient->full_name,
                'dob' => $data['dob'] ?? optional($patient->dob)->toDateString(),
            ], excludeId: $patient->id);

            if (! empty($duplicates) && $forceReason === '') {
                throw ValidationException::withMessages([
                    'duplicates' => 'Cập nhật làm hồ sơ trùng với hồ sơ khác. Vui lòng kiểm tra hoặc nhập lý do.',
                ])->status(422);
            }
        }

        return DB::transaction(function () use ($patient, $data, $actor, $forceReason, $duplicates) {
            $before = $patient->getOriginal();
            $payload = $this->sanitizePayload($data, isUpdate: true);
            $payload['updated_by'] = $actor?->id;
            if ($forceReason !== '') {
                $payload['force_create_reason'] = $forceReason;
            }

            $patient->fill($payload)->save();
            $after = $patient->fresh()->toArray();

            $this->recordHistory(
                $patient,
                'updated',
                $this->snapshotForHistory($before),
                $this->snapshotForHistory($after),
                $actor,
                'Cập nhật thông tin hồ sơ',
                ['duplicates_detected' => array_map(fn ($d) => $d['id'], $duplicates)],
            );
            $this->auditLog->log($actor, 'patient.updated', [
                'patient_id' => $patient->id,
                'changes' => array_keys($payload),
            ]);

            return $this->findPatient($patient->id);
        });
    }

    /**
     * Chuyen sang trang thai Ngung hoat dong (A3).
     * E8: chan neu con lich hen dang dien ra (status != cancelled/completed).
     */
    public function deactivatePatient(int $id, ?string $reason, ?User $actor): Patient
    {
        $patient = Patient::findOrFail($id);

        if ($patient->isMerged()) {
            throw ValidationException::withMessages([
                'status' => 'Hồ sơ đã gộp không thể chuyển trạng thái.',
            ])->status(422);
        }

        if ($patient->status === Patient::STATUS_INACTIVE) {
            return $patient;
        }

        $openCount = $this->countOpenAppointments($patient->id);
        if ($openCount > 0) {
            // E8 — con nghiep vu dang dien ra.
            throw ValidationException::withMessages([
                'status' => "Không thể ngừng hoạt động: còn {$openCount} lịch hẹn đang diễn ra (E8).",
            ])->status(422);
        }

        return DB::transaction(function () use ($patient, $reason, $actor) {
            $before = ['status' => $patient->status, 'is_active' => $patient->is_active];
            $patient->status = Patient::STATUS_INACTIVE;
            $patient->is_active = false;
            $patient->deactivated_at = now();
            $patient->deactivation_reason = $reason;
            $patient->updated_by = $actor?->id;
            $patient->save();

            $this->recordHistory(
                $patient,
                'deactivated',
                $before,
                ['status' => $patient->status, 'is_active' => false],
                $actor,
                $reason ?: 'Ngừng hoạt động hồ sơ',
            );
            $this->auditLog->log($actor, 'patient.deactivated', [
                'patient_id' => $patient->id,
                'reason' => $reason,
            ]);

            return $this->findPatient($patient->id);
        });
    }

    /**
     * Mo lai ho so da Ngung hoat dong.
     */
    public function reactivatePatient(int $id, ?User $actor): Patient
    {
        $patient = Patient::findOrFail($id);

        if ($patient->isMerged()) {
            throw ValidationException::withMessages([
                'status' => 'Hồ sơ đã gộp không thể kích hoạt lại.',
            ])->status(422);
        }

        if ($patient->status === Patient::STATUS_ACTIVE) {
            return $patient;
        }

        return DB::transaction(function () use ($patient, $actor) {
            $before = ['status' => $patient->status, 'is_active' => $patient->is_active];
            $patient->status = Patient::STATUS_ACTIVE;
            $patient->is_active = true;
            $patient->deactivated_at = null;
            $patient->deactivation_reason = null;
            $patient->updated_by = $actor?->id;
            $patient->save();

            $this->recordHistory(
                $patient,
                'reactivated',
                $before,
                ['status' => $patient->status, 'is_active' => true],
                $actor,
                'Mở lại hồ sơ',
            );
            $this->auditLog->log($actor, 'patient.reactivated', [
                'patient_id' => $patient->id,
            ]);

            return $this->findPatient($patient->id);
        });
    }

    /**
     * Gop nhieu ho so trung vao 1 ho so chinh (A4).
     *
     * - Lich hen va yeu cau dat lich online -> chuyen patient_id ve primary.
     * - Cac ho so phu chuyen status=merged, luu merged_into_id, merged_at.
     * - Ghi history ca primary lan secondary.
     */
    public function mergePatients(int $primaryId, array $secondaryIds, ?string $note, ?User $actor): Patient
    {
        $primary = Patient::findOrFail($primaryId);

        if ($primary->isMerged()) {
            throw ValidationException::withMessages([
                'primary_id' => 'Hồ sơ chính đã từng bị gộp vào hồ sơ khác, không thể làm hồ sơ chính.',
            ])->status(422);
        }

        $secondaries = Patient::whereIn('id', $secondaryIds)->get();
        if ($secondaries->count() !== count(array_unique($secondaryIds))) {
            throw ValidationException::withMessages([
                'secondary_ids' => 'Một số hồ sơ phụ không tồn tại.',
            ])->status(422);
        }

        foreach ($secondaries as $sec) {
            if ($sec->isMerged()) {
                throw ValidationException::withMessages([
                    'secondary_ids' => "Hồ sơ {$sec->patient_code} đã ở trạng thái Đã gộp, không thể gộp tiếp.",
                ])->status(422);
            }
            if ($sec->id === $primary->id) {
                throw ValidationException::withMessages([
                    'secondary_ids' => 'Hồ sơ phụ không được trùng hồ sơ chính.',
                ])->status(422);
            }
        }

        return DB::transaction(function () use ($primary, $secondaries, $note, $actor) {
            $movedAppointments = 0;
            $movedRequests = 0;

            foreach ($secondaries as $secondary) {
                $movedAppointments += Appointment::where('patient_id', $secondary->id)
                    ->update(['patient_id' => $primary->id]);
                $movedRequests += OnlineBookingRequest::where('patient_id', $secondary->id)
                    ->update(['patient_id' => $primary->id]);

                $beforeSec = ['status' => $secondary->status, 'merged_into_id' => $secondary->merged_into_id];
                $secondary->status = Patient::STATUS_MERGED;
                $secondary->merged_into_id = $primary->id;
                $secondary->merged_at = now();
                $secondary->is_active = false;
                $secondary->updated_by = $actor?->id;
                $secondary->save();

                $this->recordHistory(
                    $secondary,
                    'merged_into',
                    $beforeSec,
                    [
                        'status' => $secondary->status,
                        'merged_into_id' => $primary->id,
                        'primary_code' => $primary->patient_code,
                    ],
                    $actor,
                    $note ?: 'Gộp vào hồ sơ '.$primary->patient_code,
                );

                $this->auditLog->log($actor, 'patient.merged_into', [
                    'secondary_id' => $secondary->id,
                    'primary_id' => $primary->id,
                ]);
            }

            $this->recordHistory(
                $primary,
                'merge_received',
                null,
                [
                    'secondary_ids' => $secondaries->pluck('id')->all(),
                    'secondary_codes' => $secondaries->pluck('patient_code')->all(),
                    'moved_appointments' => $movedAppointments,
                    'moved_requests' => $movedRequests,
                ],
                $actor,
                $note ?: 'Tiếp nhận '.$secondaries->count().' hồ sơ gộp vào',
            );
            $this->auditLog->log($actor, 'patient.merge_completed', [
                'primary_id' => $primary->id,
                'secondary_ids' => $secondaries->pluck('id')->all(),
                'moved_appointments' => $movedAppointments,
                'moved_requests' => $movedRequests,
            ]);

            return $this->findPatient($primary->id);
        });
    }

    /**
     * Phat hien ho so trung. Tra ve mang [
     *   ['id', 'patient_code', 'full_name', 'phone', 'email', 'id_number',
     *    'dob', 'gender', 'status', 'match_fields' => [...], 'score' => int]
     * ].
     */
    public function checkDuplicates(array $payload, ?int $excludeId = null): array
    {
        $phone = $this->normalizePhone($payload['phone'] ?? null);
        $email = $this->normalizeEmail($payload['email'] ?? null);
        $idNumber = trim((string) ($payload['id_number'] ?? ''));
        $fullName = $this->normalizeName($payload['full_name'] ?? null);
        $dob = ! empty($payload['dob']) ? substr((string) $payload['dob'], 0, 10) : null;

        $hasAnyKey = $phone || $email || $idNumber || ($fullName && $dob);
        if (! $hasAnyKey) {
            return [];
        }

        $query = Patient::query()->where('status', '!=', Patient::STATUS_MERGED);
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        $query->where(function ($q) use ($phone, $email, $idNumber, $fullName, $dob) {
            if ($phone) {
                $q->orWhere('phone', $phone);
            }
            if ($email) {
                $q->orWhereRaw('LOWER(email) = ?', [$email]);
            }
            if ($idNumber) {
                $q->orWhere('id_number', $idNumber);
            }
            if ($fullName && $dob) {
                $q->orWhere(function ($sub) use ($fullName, $dob) {
                    $sub->whereRaw('LOWER(full_name) = ?', [$fullName])->whereDate('dob', $dob);
                });
            }
        });

        $candidates = $query->limit(20)->get();

        $duplicates = [];
        foreach ($candidates as $candidate) {
            $matches = [];
            $score = 0;

            if ($phone && $candidate->phone && $this->normalizePhone($candidate->phone) === $phone) {
                $matches[] = 'phone';
                $score = max($score, 95);
            }
            if ($email && $candidate->email && $this->normalizeEmail($candidate->email) === $email) {
                $matches[] = 'email';
                $score = max($score, 85);
            }
            if ($idNumber && $candidate->id_number && $candidate->id_number === $idNumber) {
                $matches[] = 'id_number';
                $score = max($score, 90);
            }
            if (
                $fullName && $dob && $candidate->full_name && $candidate->dob
                && $this->normalizeName($candidate->full_name) === $fullName
                && optional($candidate->dob)->toDateString() === $dob
            ) {
                $matches[] = 'name_and_dob';
                $score = max($score, 70);
            }

            if (empty($matches)) {
                continue;
            }

            $duplicates[] = [
                'id' => $candidate->id,
                'patient_code' => $candidate->patient_code,
                'full_name' => $candidate->full_name,
                'phone' => $candidate->phone,
                'email' => $candidate->email,
                'id_number' => $candidate->id_number,
                'dob' => optional($candidate->dob)->toDateString(),
                'gender' => $candidate->gender,
                'status' => $candidate->status,
                'match_fields' => $matches,
                'score' => $score,
            ];
        }

        usort($duplicates, fn ($a, $b) => $b['score'] <=> $a['score']);

        return $duplicates;
    }

    /**
     * Lich su thay doi cua mot ho so.
     */
    public function patientHistory(int $patientId, int $limit = 100): Collection
    {
        return PatientHistory::with('actor:id,name')
            ->where('patient_id', $patientId)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();
    }

    /**
     * Danh sach nguon tiep nhan da dung + nguon mac dinh.
     */
    public function listSources(): array
    {
        $existing = Patient::whereNotNull('source')
            ->where('source', '!=', '')
            ->distinct()
            ->pluck('source')
            ->filter()
            ->all();

        return array_values(array_unique(array_merge(self::DEFAULT_SOURCES, $existing)));
    }

    private function sanitizePayload(array $data, bool $isUpdate): array
    {
        $allowed = [
            'full_name', 'phone', 'email', 'id_number', 'source',
            'dob', 'gender', 'address', 'occupation', 'marital_status',
            'medical_history', 'allergies', 'notes',
        ];
        $payload = array_intersect_key($data, array_flip($allowed));

        if (isset($payload['phone'])) {
            $payload['phone'] = $this->normalizePhone($payload['phone']);
        }
        if (isset($payload['email'])) {
            $payload['email'] = $this->normalizeEmail($payload['email']);
        }
        if (isset($payload['id_number'])) {
            $payload['id_number'] = trim((string) $payload['id_number']) ?: null;
        }
        if (isset($payload['full_name'])) {
            $payload['full_name'] = Str::limit(trim((string) $payload['full_name']), 191, '');
        }
        if (array_key_exists('dob', $payload) && $payload['dob'] === '') {
            $payload['dob'] = null;
        }
        if (array_key_exists('gender', $payload)) {
            $payload['gender'] = Patient::normalizeGender($payload['gender']);
        }
        foreach (['address', 'occupation', 'marital_status', 'medical_history', 'allergies', 'notes', 'source'] as $field) {
            if (array_key_exists($field, $payload) && is_string($payload[$field])) {
                $payload[$field] = trim($payload[$field]);
                if ($payload[$field] === '') {
                    $payload[$field] = null;
                }
            }
        }

        return $payload;
    }

    /**
     * Demo snapshot cho history - bo cac field nhay cam / qua dai.
     */
    private function snapshotForHistory(array $row): array
    {
        $keep = [
            'full_name', 'phone', 'email', 'id_number', 'source', 'dob',
            'gender', 'address', 'occupation', 'marital_status',
            'medical_history', 'allergies', 'notes', 'status', 'is_active',
        ];

        return array_intersect_key($row, array_flip($keep));
    }

    private function recordHistory(
        Patient $patient,
        string $action,
        ?array $before,
        ?array $after,
        ?User $actor,
        ?string $note = null,
        ?array $metadata = null,
    ): PatientHistory {
        return PatientHistory::create([
            'patient_id' => $patient->id,
            'action' => $action,
            'actor_id' => $actor?->id,
            'actor_name' => $actor?->name ?? 'Hệ thống',
            'note' => $note,
            'before' => $before,
            'after' => $after,
            'metadata' => $metadata,
            'created_at' => now(),
        ]);
    }

    private function countOpenAppointments(int $patientId): int
    {
        if (! Schema::hasTable('appointments')) {
            return 0;
        }

        $query = Appointment::where('patient_id', $patientId);
        if (Schema::hasColumn('appointments', 'status')) {
            $query->whereNotIn('status', ['cancelled', 'completed', 'no_show']);
        }

        return $query->count();
    }

    private function normalizePhone(?string $value): ?string
    {
        if (! $value) {
            return null;
        }
        $value = preg_replace('/\s+/', '', $value);
        if (str_starts_with($value, '+84')) {
            $value = '0'.substr($value, 3);
        }

        return $value ?: null;
    }

    private function normalizeEmail(?string $value): ?string
    {
        if (! $value) {
            return null;
        }

        return Str::lower(trim($value)) ?: null;
    }

    private function normalizeName(?string $value): ?string
    {
        if (! $value) {
            return null;
        }
        $value = preg_replace('/\s+/', ' ', trim($value));

        return Str::lower($value) ?: null;
    }
}
