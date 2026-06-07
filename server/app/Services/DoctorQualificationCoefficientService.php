<?php

namespace App\Services;

use App\Models\DoctorQualificationCoefficient;
use App\Models\ProfessionalProfile;
use App\Models\QualificationCatalog;
use App\Models\Staff;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class DoctorQualificationCoefficientService
{
    private const BUSINESS_TIMEZONE = 'Asia/Ho_Chi_Minh';

    public function __construct(private readonly AuditLogService $auditLog)
    {
    }

    /**
     * @param  array<string,mixed>  $filters
     */
    public function list(array $filters): LengthAwarePaginator
    {
        $this->refreshStatuses();

        $perPage = min(max((int) ($filters['per_page'] ?? 20), 1), 100);
        $type = $filters['qualification_type'] ?? $filters['type'] ?? null;

        $q = DoctorQualificationCoefficient::query()
            ->with(['catalog:id,code,name,type,priority,status', 'creator:id,name', 'updater:id,name', 'stopper:id,name']);

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $q->where(function (Builder $sub) use ($term) {
                $sub->where('code', 'like', $term)
                    ->orWhere('qualification_code', 'like', $term)
                    ->orWhere('qualification_name', 'like', $term);
            });
        }

        if (! empty($type) && $type !== 'all') {
            $q->where('qualification_type', $type);
        }

        if (! empty($filters['status']) && $filters['status'] !== 'all') {
            $q->where('status', $filters['status']);
        }

        if (! empty($filters['from'])) {
            $from = $this->parseBusinessDate($filters['from'])->startOfDay();
            $q->where(function (Builder $sub) use ($from) {
                $sub->whereNull('effective_to')->orWhere('effective_to', '>=', $from);
            });
        }

        if (! empty($filters['to'])) {
            $to = $this->parseBusinessDate($filters['to'])->endOfDay();
            $q->where('effective_from', '<=', $to);
        }

        return $q->orderBy('priority')
            ->orderByDesc('effective_from')
            ->orderByDesc('id')
            ->paginate($perPage);
    }

    public function find(int $id): DoctorQualificationCoefficient
    {
        $this->refreshStatuses();

        return DoctorQualificationCoefficient::query()
            ->with(['catalog:id,code,name,type,priority,status', 'creator:id,name', 'updater:id,name', 'stopper:id,name'])
            ->findOrFail($id);
    }

    /**
     * @return array<string,mixed>
     */
    public function options(): array
    {
        return [
            'qualifications' => $this->qualificationOptions(),
            'types' => [
                ['value' => DoctorQualificationCoefficient::TYPE_DEGREE, 'label' => 'Học vị'],
                ['value' => DoctorQualificationCoefficient::TYPE_ACADEMIC_TITLE, 'label' => 'Học hàm'],
            ],
            'statuses' => DoctorQualificationCoefficient::STATUSES,
            'coefficient_rules' => [
                'min' => 1.0,
                'max' => 3.0,
                'fallback' => DoctorQualificationCoefficient::DEFAULT_COEFFICIENT,
            ],
        ];
    }

    /**
     * @return array<int,array<string,mixed>>
     */
    private function qualificationOptions(): array
    {
        return QualificationCatalog::query()
            ->where('status', QualificationCatalog::STATUS_ACTIVE)
            ->orderBy('priority')
            ->orderBy('name')
            ->get()
            ->map(fn (QualificationCatalog $qualification) => $qualification->toPayrollOption())
            ->values()
            ->all();
    }

    /**
     * @return array<string,mixed>
     */
    public function effectiveMatrix(?string $date = null): array
    {
        $this->refreshStatuses();

        $when = $this->asBusinessDateTime($date);
        $matrix = [];
        $missing = [];
        $qualifications = $this->qualificationOptions();

        foreach ($qualifications as $qualification) {
            $record = $this->resolveFor($qualification['code'], $qualification['type'], $when);
            if ($record) {
                $matrix[$qualification['code']] = $this->briefRecord($record);
                continue;
            }

            $matrix[$qualification['code']] = $this->defaultCell($qualification);
            $missing[] = [
                'qualification_catalog_id' => $qualification['id'] ?? null,
                'qualification_code' => $qualification['code'],
                'qualification_name' => $qualification['name'],
                'qualification_type' => $qualification['type'],
                'priority' => $qualification['priority'],
            ];
        }

        return [
            'date' => $when->toDateString(),
            'qualifications' => $qualifications,
            'matrix' => $matrix,
            'missing_count' => count($missing),
            'missing' => $missing,
        ];
    }

    public function resolveFor(
        string $qualificationCode,
        ?string $qualificationType = null,
        CarbonInterface|string|null $date = null
    ): ?DoctorQualificationCoefficient {
        $when = $this->asBusinessDateTime($date);

        return DoctorQualificationCoefficient::query()
            ->where('qualification_code', $qualificationCode)
            ->when($qualificationType, fn (Builder $q) => $q->where('qualification_type', $qualificationType))
            ->where('status', '!=', DoctorQualificationCoefficient::STATUS_STOPPED)
            ->where('effective_from', '<=', $when)
            ->where(function (Builder $q) use ($when) {
                $q->whereNull('effective_to')->orWhere('effective_to', '>=', $when);
            })
            ->orderBy('priority')
            ->orderByDesc('effective_from')
            ->first();
    }

    /**
     * Resolve the best coefficient for UC18 when a doctor has one or more
     * qualifications. Priority 1 is highest.
     *
     * @param  array<int,string|array<string,mixed>>  $qualifications
     * @return array{coefficient:float,config_id:int|null,qualification_code:string|null,is_default:bool}
     */
    public function resolveForQualifications(
        array $qualifications,
        CarbonInterface|string|null $date = null,
        ?User $actor = null,
        bool $logDefault = true
    ): array {
        $this->refreshStatuses();

        $when = $this->asBusinessDateTime($date);
        $codes = collect($qualifications)
            ->map(fn ($qualification) => $this->normalizeQualificationInput($qualification))
            ->filter()
            ->unique()
            ->values()
            ->all();

        if (! empty($codes)) {
            $record = DoctorQualificationCoefficient::query()
                ->whereIn('qualification_code', $codes)
                ->where('status', '!=', DoctorQualificationCoefficient::STATUS_STOPPED)
                ->where('effective_from', '<=', $when)
                ->where(function (Builder $q) use ($when) {
                    $q->whereNull('effective_to')->orWhere('effective_to', '>=', $when);
                })
                ->orderBy('priority')
                ->orderByDesc('effective_from')
                ->first();

            if ($record) {
                return [
                    'coefficient' => (float) $record->coefficient,
                    'config_id' => $record->id,
                    'qualification_code' => $record->qualification_code,
                    'is_default' => false,
                ];
            }
        }

        if ($logDefault) {
            $this->auditLog->log($actor, 'doctor_qualification_coefficient.default_used', [
                'qualification_codes' => $codes,
                'effective_date' => $when->toDateString(),
                'coefficient' => DoctorQualificationCoefficient::DEFAULT_COEFFICIENT,
            ]);
        }

        return [
            'coefficient' => DoctorQualificationCoefficient::DEFAULT_COEFFICIENT,
            'config_id' => null,
            'qualification_code' => null,
            'is_default' => true,
        ];
    }

    public function resolveForDoctor(
        User|int $doctor,
        CarbonInterface|string|null $date = null,
        ?User $actor = null,
        bool $logDefault = true
    ): array {
        $userId = $doctor instanceof User ? $doctor->id : $doctor;
        $staff = Staff::query()->where('user_id', $userId)->first();

        return $staff
            ? $this->resolveForStaff($staff, $date, $actor, $logDefault)
            : $this->resolveForQualifications([], $date, $actor, $logDefault);
    }

    public function resolveForStaff(
        Staff $staff,
        CarbonInterface|string|null $date = null,
        ?User $actor = null,
        bool $logDefault = true
    ): array {
        return $this->resolveForQualifications(
            $this->qualificationInputsForStaff($staff),
            $date,
            $actor,
            $logDefault
        );
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function create(array $data, ?User $actor): DoctorQualificationCoefficient
    {
        return DB::transaction(function () use ($data, $actor) {
            return $this->createRecord($data, $actor);
        });
    }

    /**
     * @param  array<int,array<string,mixed>>  $items
     * @return array<int,DoctorQualificationCoefficient>
     */
    public function bulkCreate(array $items, ?User $actor): array
    {
        return DB::transaction(function () use ($items, $actor) {
            $records = [];
            foreach ($items as $item) {
                $records[] = $this->createRecord($item, $actor);
            }

            return $records;
        });
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function stop(int $id, array $data, ?User $actor): DoctorQualificationCoefficient
    {
        return DB::transaction(function () use ($id, $data, $actor) {
            $this->refreshStatuses();

            $record = DoctorQualificationCoefficient::query()->lockForUpdate()->findOrFail($id);

            if (in_array($record->status, [
                DoctorQualificationCoefficient::STATUS_EXPIRED,
                DoctorQualificationCoefficient::STATUS_STOPPED,
            ], true)) {
                throw ValidationException::withMessages([
                    'id' => 'Chỉ có thể ngừng áp dụng cấu hình chưa hết hiệu lực.',
                ]);
            }

            if ($this->hasFinalizedPayrollUsage($record)) {
                throw ValidationException::withMessages([
                    'id' => 'Cấu hình đã được dùng trong phiếu lương đã chốt, không thể sửa trực tiếp.',
                ]);
            }

            $effectiveTo = ! empty($data['effective_to'])
                ? $this->parseBusinessDate($data['effective_to'])->endOfDay()
                : ($record->effective_from->lessThanOrEqualTo($this->businessNow()) ? $this->businessNow() : $record->effective_to);

            if ($effectiveTo && $effectiveTo->lessThan($record->effective_from)) {
                throw ValidationException::withMessages([
                    'effective_to' => 'Ngày ngừng áp dụng không được nhỏ hơn ngày bắt đầu hiệu lực.',
                ]);
            }

            $record->fill([
                'effective_to' => $effectiveTo,
                'status' => DoctorQualificationCoefficient::STATUS_STOPPED,
                'stop_reason' => $data['reason'],
                'stop_reason_detail' => $data['reason_detail'] ?? null,
                'stopped_by' => $actor?->id,
                'stopped_at' => $this->businessNow(),
                'updated_by' => $actor?->id,
            ])->save();

            $this->auditLog->log($actor, 'doctor_qualification_coefficient.stopped', [
                'coefficient_id' => $record->id,
                'code' => $record->code,
                'qualification_catalog_id' => $record->qualification_catalog_id,
                'qualification_code' => $record->qualification_code,
                'effective_to' => $effectiveTo?->toDateString(),
                'reason' => $data['reason'],
                'reason_detail' => $data['reason_detail'] ?? null,
            ]);

            return $record->fresh(['catalog:id,code,name,type,priority,status', 'creator:id,name', 'updater:id,name', 'stopper:id,name']);
        });
    }

    /**
     * @param  array<string,mixed>  $filters
     * @return array<int,array<string,mixed>>
     */
    public function auditLogs(int $coefficientId, array $filters = []): array
    {
        $q = DB::table('audit_logs')
            ->where('action', 'like', 'doctor_qualification_coefficient.%')
            ->where(function ($query) use ($coefficientId) {
                $query->where('details', 'like', '%"coefficient_id":'.$coefficientId.',%')
                    ->orWhere('details', 'like', '%"coefficient_id":'.$coefficientId.'}%');
            });

        if (! empty($filters['action']) && $filters['action'] !== 'all') {
            $q->where('action', $filters['action']);
        }

        if (! empty($filters['actor'])) {
            $q->where('admin_name', 'like', '%'.$filters['actor'].'%');
        }

        if (! empty($filters['from'])) {
            $q->where('created_at', '>=', $this->parseBusinessDate($filters['from'])->startOfDay());
        }

        if (! empty($filters['to'])) {
            $q->where('created_at', '<=', $this->parseBusinessDate($filters['to'])->endOfDay());
        }

        return $q->orderByDesc('created_at')
            ->limit(100)
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'actor_id' => $log->admin_id,
                'actor_name' => $log->admin_name,
                'action' => $log->action,
                'details' => json_decode($log->details, true) ?: [],
                'created_at' => $log->created_at,
            ])
            ->all();
    }

    /**
     * @param  array<string,mixed>  $data
     */
    private function createRecord(array $data, ?User $actor): DoctorQualificationCoefficient
    {
        $this->refreshStatuses();
        $qualification = $this->assertQualification($data['qualification_code'], $data['qualification_type']);
        $priority = (int) ($data['priority'] ?? $qualification['priority']);

        DoctorQualificationCoefficient::query()
            ->where('qualification_code', $qualification['code'])
            ->where('qualification_type', $qualification['type'])
            ->whereIn('status', [
                DoctorQualificationCoefficient::STATUS_UPCOMING,
                DoctorQualificationCoefficient::STATUS_ACTIVE,
            ])
            ->lockForUpdate()
            ->get();

        $effectiveFrom = $this->parseBusinessDate($data['effective_from'])->startOfDay();
        $effectiveTo = ! empty($data['effective_to'])
            ? $this->parseBusinessDate($data['effective_to'])->endOfDay()
            : null;

        $this->validateRange($effectiveFrom, $effectiveTo);
        $cappedRecords = $this->capOpenEndedPredecessors($qualification['code'], $qualification['type'], $effectiveFrom, $actor);
        $this->ensureNoOverlap($qualification['code'], $qualification['type'], $effectiveFrom, $effectiveTo);

        $record = DoctorQualificationCoefficient::create([
            'code' => $this->generateCode(),
            'qualification_catalog_id' => $qualification['id'],
            'qualification_code' => $qualification['code'],
            'qualification_name' => $qualification['name'],
            'qualification_type' => $qualification['type'],
            'priority' => $priority,
            'coefficient' => round((float) $data['coefficient'], 2),
            'effective_from' => $effectiveFrom,
            'effective_to' => $effectiveTo,
            'status' => $this->computeStatus($effectiveFrom, $effectiveTo),
            'change_reason' => $data['change_reason'] ?? null,
            'note' => $data['note'] ?? null,
            'created_by' => $actor?->id,
            'updated_by' => $actor?->id,
        ]);

        $this->auditLog->log($actor, 'doctor_qualification_coefficient.created', [
            'coefficient_id' => $record->id,
            'code' => $record->code,
            'qualification_catalog_id' => $record->qualification_catalog_id,
            'qualification_code' => $record->qualification_code,
            'qualification_type' => $record->qualification_type,
            'coefficient' => (float) $record->coefficient,
            'priority' => $record->priority,
            'effective_from' => $effectiveFrom->toDateString(),
            'effective_to' => $effectiveTo?->toDateString(),
            'capped_predecessor_ids' => $cappedRecords,
        ]);

        return $record->fresh(['catalog:id,code,name,type,priority,status', 'creator:id,name', 'updater:id,name', 'stopper:id,name']);
    }

    /**
     * @return array<string,mixed>
     */
    private function assertQualification(string $code, string $type): array
    {
        $qualification = DoctorQualificationCoefficient::qualificationByCode($code);

        if (! $qualification || $qualification['type'] !== $type) {
            throw ValidationException::withMessages([
                'qualification_code' => 'Học hàm/học vị không hợp lệ.',
            ]);
        }

        return $qualification;
    }

    private function validateRange(CarbonInterface $from, ?CarbonInterface $to): void
    {
        if ($to && $to->lessThan($from)) {
            throw ValidationException::withMessages([
                'effective_to' => 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.',
            ]);
        }
    }

    private function ensureNoOverlap(
        string $qualificationCode,
        string $qualificationType,
        CarbonInterface $from,
        ?CarbonInterface $to
    ): void {
        $q = DoctorQualificationCoefficient::query()
            ->where('qualification_code', $qualificationCode)
            ->where('qualification_type', $qualificationType)
            ->whereIn('status', [
                DoctorQualificationCoefficient::STATUS_UPCOMING,
                DoctorQualificationCoefficient::STATUS_ACTIVE,
            ]);

        $q->where(function (Builder $sub) use ($from, $to) {
            $sub->where(function (Builder $left) use ($from) {
                $left->whereNull('effective_to')->orWhere('effective_to', '>=', $from);
            })->where(function (Builder $right) use ($to) {
                if ($to !== null) {
                    $right->where('effective_from', '<=', $to);
                }
            });
        });

        $conflict = $q->first();
        if ($conflict) {
            throw ValidationException::withMessages([
                'effective_from' => sprintf(
                    'Khoảng hiệu lực bị trùng với cấu hình %s (%s - %s).',
                    $conflict->code,
                    optional($conflict->effective_from)->format('d/m/Y') ?? '-',
                    optional($conflict->effective_to)->format('d/m/Y') ?? 'không thời hạn'
                ),
            ]);
        }
    }

    /**
     * @return array<int,int>
     */
    private function capOpenEndedPredecessors(
        string $qualificationCode,
        string $qualificationType,
        CarbonInterface $newFrom,
        ?User $actor
    ): array {
        $boundary = $newFrom->copy()->subSecond();
        $records = DoctorQualificationCoefficient::query()
            ->where('qualification_code', $qualificationCode)
            ->where('qualification_type', $qualificationType)
            ->whereIn('status', [
                DoctorQualificationCoefficient::STATUS_ACTIVE,
                DoctorQualificationCoefficient::STATUS_UPCOMING,
            ])
            ->where('effective_from', '<', $newFrom)
            ->where(function (Builder $q) use ($newFrom) {
                $q->whereNull('effective_to')->orWhere('effective_to', '>=', $newFrom);
            })
            ->get();

        $ids = [];
        foreach ($records as $record) {
            if ($this->hasFinalizedPayrollUsage($record)) {
                continue;
            }

            $record->fill([
                'effective_to' => $boundary,
                'status' => $this->computeStatus($record->effective_from, $boundary),
                'updated_by' => $actor?->id,
            ])->save();

            $ids[] = $record->id;

            $this->auditLog->log($actor, 'doctor_qualification_coefficient.superseded', [
                'coefficient_id' => $record->id,
                'qualification_catalog_id' => $record->qualification_catalog_id,
                'qualification_code' => $record->qualification_code,
                'new_effective_to' => $boundary->toDateString(),
            ]);
        }

        return $ids;
    }

    public function refreshStatuses(): void
    {
        $now = $this->businessNow();

        DoctorQualificationCoefficient::query()
            ->where('status', '!=', DoctorQualificationCoefficient::STATUS_STOPPED)
            ->where('effective_from', '>', $now)
            ->update(['status' => DoctorQualificationCoefficient::STATUS_UPCOMING]);

        DoctorQualificationCoefficient::query()
            ->where('status', '!=', DoctorQualificationCoefficient::STATUS_STOPPED)
            ->where('effective_from', '<=', $now)
            ->where(function (Builder $q) use ($now) {
                $q->whereNull('effective_to')->orWhere('effective_to', '>=', $now);
            })
            ->update(['status' => DoctorQualificationCoefficient::STATUS_ACTIVE]);

        DoctorQualificationCoefficient::query()
            ->where('status', '!=', DoctorQualificationCoefficient::STATUS_STOPPED)
            ->whereNotNull('effective_to')
            ->where('effective_to', '<', $now)
            ->update(['status' => DoctorQualificationCoefficient::STATUS_EXPIRED]);
    }

    private function computeStatus(CarbonInterface $from, ?CarbonInterface $to): string
    {
        $now = $this->businessNow();

        if ($from->greaterThan($now)) {
            return DoctorQualificationCoefficient::STATUS_UPCOMING;
        }

        if ($to && $to->lessThan($now)) {
            return DoctorQualificationCoefficient::STATUS_EXPIRED;
        }

        return DoctorQualificationCoefficient::STATUS_ACTIVE;
    }

    private function parseBusinessDate(string $date): Carbon
    {
        return Carbon::parse($date, self::BUSINESS_TIMEZONE);
    }

    private function asBusinessDateTime(CarbonInterface|string|null $date = null): Carbon
    {
        if ($date instanceof CarbonInterface) {
            return Carbon::instance($date)->setTimezone(self::BUSINESS_TIMEZONE);
        }

        return $date
            ? Carbon::parse($date, self::BUSINESS_TIMEZONE)
            : $this->businessNow();
    }

    private function businessNow(): Carbon
    {
        return now(self::BUSINESS_TIMEZONE);
    }

    /**
     * @return array<int,string>
     */
    private function qualificationInputsForStaff(Staff $staff): array
    {
        $profile = ProfessionalProfile::query()
            ->with(['qualificationCatalogs', 'specialties'])
            ->where('staff_id', $staff->id)
            ->where('profile_role', 'bac_si')
            ->where('status', ProfessionalProfile::STATUS_APPROVED)
            ->where('is_active', true)
            ->orderByDesc('approved_at')
            ->orderByDesc('id')
            ->first();

        $codes = [];
        if ($profile) {
            // Payroll source of truth: normalized catalog qualifications.
            // Legacy degree fields are fallback only while old data is being phased out.
            $codes = array_merge($codes, $profile->qualification_codes);

            if ($codes === []) {
                $codes = array_merge($codes, $this->qualificationCodesForLegacyValue($profile->degree));
            }

            if ($codes === []) {
                foreach ($profile->specialties as $specialty) {
                    $codes = array_merge($codes, $this->qualificationCodesForLegacyValue($specialty->degree));
                }
            }
        }

        if ($codes === []) {
            $codes = array_merge($codes, $this->qualificationCodesForLegacyValue($staff->highest_degree));
        }

        return array_values(array_unique(array_filter($codes)));
    }

    /**
     * @return array<int,string>
     */
    private function qualificationCodesForLegacyValue(?string $value): array
    {
        $value = trim((string) $value);
        if ($value === '') {
            return [];
        }

        $slug = Str::slug($value, '_');
        $codes = match ($slug) {
            'giao_su', 'gs', 'gs_ts', 'gsts', 'giao_su_tien_si' => ['giao_su', 'tien_si'],
            'pho_giao_su', 'pgs', 'pgs_ts', 'pgsts', 'pho_giao_su_tien_si' => ['pho_giao_su', 'tien_si'],
            'tien_si', 'ts', 'bac_si_tien_si' => ['tien_si'],
            'thac_si', 'ths', 'thac_sy', 'thac_si_bac_si' => ['thac_si'],
            'dai_hoc', 'cu_nhan', 'bac_si', 'bac_sy', 'bs' => ['dai_hoc'],
            default => [],
        };

        if ($codes !== []) {
            return $codes;
        }

        $code = QualificationCatalog::normalizeLegacyCode($value);

        return $code ? [$code] : [];
    }

    /**
     * @param  string|array<string,mixed>  $qualification
     */
    private function normalizeQualificationInput(string|array $qualification): ?string
    {
        if (is_array($qualification)) {
            $qualification = (string) (
                $qualification['qualification_code']
                ?? $qualification['code']
                ?? $qualification['degree']
                ?? $qualification['name']
                ?? ''
            );
        }

        $value = trim($qualification);
        if ($value === '') {
            return null;
        }

        return QualificationCatalog::normalizeLegacyCode($value);
    }

    /**
     * @param  array<string,mixed>  $record
     * @return array<string,mixed>
     */
    private function defaultCell(array $record): array
    {
        return [
            'id' => null,
            'code' => null,
            'qualification_catalog_id' => $record['id'] ?? null,
            'qualification_code' => $record['code'],
            'qualification_name' => $record['name'],
            'qualification_type' => $record['type'],
            'priority' => $record['priority'],
            'coefficient' => number_format(DoctorQualificationCoefficient::DEFAULT_COEFFICIENT, 2, '.', ''),
            'suggested_coefficient' => number_format((float) $record['default_coefficient'], 2, '.', ''),
            'status' => 'default',
            'is_default' => true,
            'effective_from' => null,
            'effective_to' => null,
        ];
    }

    /**
     * @return array<string,mixed>
     */
    private function briefRecord(DoctorQualificationCoefficient $record): array
    {
        return [
            'id' => $record->id,
            'code' => $record->code,
            'qualification_catalog_id' => $record->qualification_catalog_id,
            'qualification_code' => $record->qualification_code,
            'qualification_name' => $record->qualification_name,
            'qualification_type' => $record->qualification_type,
            'priority' => $record->priority,
            'coefficient' => (string) $record->coefficient,
            'status' => $record->status,
            'is_default' => false,
            'effective_from' => $record->effective_from,
            'effective_to' => $record->effective_to,
        ];
    }

    private function generateCode(): string
    {
        do {
            $code = 'DQC-'.random_int(100000, 999999);
        } while (DoctorQualificationCoefficient::query()->where('code', $code)->exists());

        return $code;
    }

    private function hasFinalizedPayrollUsage(DoctorQualificationCoefficient $record): bool
    {
        // UC18 payroll tables are not present yet. Keep this integration point
        // so finalized payroll lines can block future mutations when UC18 lands.
        return false;
    }
}
