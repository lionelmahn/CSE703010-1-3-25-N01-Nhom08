<?php

namespace App\Services;

use App\Models\ExaminationServiceItem;
use App\Models\Service;
use App\Models\ServiceComplexityCoefficient;
use App\Models\ServiceGroup;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ServiceComplexityService
{
    private const BUSINESS_TIMEZONE = 'Asia/Ho_Chi_Minh';
    private const DEFAULT_COEFFICIENT = 0.0;
    private const CONFIGURABLE_SERVICE_STATUSES = [
        Service::STATUS_ACTIVE,
        Service::STATUS_HIDDEN,
        Service::STATUS_DRAFT,
    ];

    /**
     * @var array<string,array{min:float,max:float,exact?:float}>
     */
    private const COEFFICIENT_RULES = [
        ExaminationServiceItem::LEVEL_THONG_THUONG => ['min' => 0.0, 'max' => 0.0, 'exact' => 0.0],
        ExaminationServiceItem::LEVEL_KHO => ['min' => 0.1, 'max' => 0.2],
        ExaminationServiceItem::LEVEL_PHUC_TAP => ['min' => 0.3, 'max' => 0.4],
        ExaminationServiceItem::LEVEL_RAT_PHUC_TAP => ['min' => 0.5, 'max' => 0.5, 'exact' => 0.5],
    ];

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

        $q = ServiceComplexityCoefficient::query()
            ->with([
                'service:id,service_code,name,service_group_id,status,visibility',
                'service.group:id,name',
                'creator:id,name',
                'updater:id,name',
                'stopper:id,name',
            ])
            ->withCount('serviceItems');

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $q->where(function (Builder $sub) use ($term) {
                $sub->where('code', 'like', $term)
                    ->orWhereHas('service', function (Builder $svc) use ($term) {
                        $svc->where('name', 'like', $term)
                            ->orWhere('service_code', 'like', $term);
                    });
            });
        }

        if (! empty($filters['status']) && $filters['status'] !== 'all') {
            $q->where('status', $filters['status']);
        }

        if (! empty($filters['service_id']) && $filters['service_id'] !== 'all') {
            $q->where('service_id', (int) $filters['service_id']);
        }

        if (! empty($filters['group_id']) && $filters['group_id'] !== 'all') {
            $q->whereHas('service', fn (Builder $svc) => $svc->where('service_group_id', (int) $filters['group_id']));
        }

        if (! empty($filters['processing_level']) && $filters['processing_level'] !== 'all') {
            $q->where('processing_level', $filters['processing_level']);
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

        return $q->orderByDesc('effective_from')
            ->orderByDesc('id')
            ->paginate($perPage);
    }

    public function find(int $id): ServiceComplexityCoefficient
    {
        $this->refreshStatuses();

        return ServiceComplexityCoefficient::query()
            ->with([
                'service:id,service_code,name,service_group_id,status,visibility',
                'service.group:id,name',
                'creator:id,name',
                'updater:id,name',
                'stopper:id,name',
            ])
            ->withCount('serviceItems')
            ->findOrFail($id);
    }

    /**
     * @return array<string,mixed>
     */
    public function options(?string $search = null): array
    {
        $services = Service::query()
            ->select('id', 'service_code', 'name', 'service_group_id', 'status', 'visibility')
            ->with('group:id,name')
            ->whereIn('status', self::CONFIGURABLE_SERVICE_STATUSES)
            ->when($search, function (Builder $q) use ($search) {
                $term = '%'.$search.'%';
                $q->where(function (Builder $sub) use ($term) {
                    $sub->where('name', 'like', $term)->orWhere('service_code', 'like', $term);
                });
            })
            ->orderBy('name')
            ->limit(100)
            ->get();

        return [
            'processing_levels' => $this->processingLevels(),
            'coefficient_rules' => self::COEFFICIENT_RULES,
            'statuses' => ServiceComplexityCoefficient::STATUSES,
            'services' => $services,
            'service_groups' => ServiceGroup::query()
                ->select('id', 'name')
                ->where('is_active', true)
                ->orderBy('display_order')
                ->orderBy('name')
                ->get(),
        ];
    }

    /**
     * @param  array<string,mixed>  $filters
     * @return array<string,mixed>
     */
    public function effectiveMatrix(array $filters = []): array
    {
        $this->refreshStatuses();

        $when = $this->asBusinessDateTime($filters['date'] ?? null);
        $services = Service::query()
            ->select('id', 'service_code', 'name', 'service_group_id', 'status', 'visibility')
            ->with('group:id,name')
            ->whereIn('status', self::CONFIGURABLE_SERVICE_STATUSES)
            ->when(! empty($filters['service_id']) && $filters['service_id'] !== 'all', fn (Builder $q) => $q->where('id', (int) $filters['service_id']))
            ->when(! empty($filters['group_id']) && $filters['group_id'] !== 'all', fn (Builder $q) => $q->where('service_group_id', (int) $filters['group_id']))
            ->orderBy('name')
            ->limit(100)
            ->get();

        $matrix = [];
        $missing = [];

        foreach ($services as $service) {
            $matrix[$service->id] = [];
            foreach (ExaminationServiceItem::ALL_LEVELS as $level) {
                $record = $this->resolveFor($service->id, $level, $when);
                if ($record) {
                    $matrix[$service->id][$level] = $this->briefRecord($record);
                    continue;
                }

                $matrix[$service->id][$level] = $this->defaultCell($service->id, $level);
                $missing[] = [
                    'service_id' => $service->id,
                    'service_code' => $service->service_code,
                    'service_name' => $service->name,
                    'processing_level' => $level,
                ];
            }
        }

        return [
            'date' => $when->toDateString(),
            'services' => $services,
            'processing_levels' => $this->processingLevels(),
            'matrix' => $matrix,
            'missing_count' => count($missing),
            'missing' => array_slice($missing, 0, 50),
        ];
    }

    public function resolveFor(
        int $serviceId,
        string $processingLevel,
        CarbonInterface|string|null $date = null
    ): ?ServiceComplexityCoefficient {
        $when = $this->asBusinessDateTime($date);

        return ServiceComplexityCoefficient::query()
            ->where('service_id', $serviceId)
            ->where('processing_level', $processingLevel)
            ->where('status', '!=', ServiceComplexityCoefficient::STATUS_STOPPED)
            ->where('effective_from', '<=', $when)
            ->where(function (Builder $q) use ($when) {
                $q->whereNull('effective_to')->orWhere('effective_to', '>=', $when);
            })
            ->orderByDesc('effective_from')
            ->first();
    }

    /**
     * @return array{coefficient:float,config_id:int|null,is_default:bool}
     */
    public function snapshotFor(
        ?int $serviceId,
        string $processingLevel,
        ?User $actor = null,
        bool $logDefault = true,
        CarbonInterface|string|null $date = null
    ): array {
        if ($serviceId && in_array($processingLevel, ExaminationServiceItem::ALL_LEVELS, true)) {
            $record = $this->resolveFor($serviceId, $processingLevel, $date);
            if ($record) {
                return [
                    'coefficient' => (float) $record->coefficient,
                    'config_id' => $record->id,
                    'is_default' => false,
                ];
            }
        }

        if ($logDefault) {
            $this->auditLog->log($actor, 'service_complexity.default_used', [
                'service_id' => $serviceId,
                'processing_level' => $processingLevel,
                'coefficient' => self::DEFAULT_COEFFICIENT,
                'effective_date' => $this->asBusinessDateTime($date)->toDateString(),
            ]);
        }

        return [
            'coefficient' => self::DEFAULT_COEFFICIENT,
            'config_id' => null,
            'is_default' => true,
        ];
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function create(array $data, ?User $actor): ServiceComplexityCoefficient
    {
        return DB::transaction(function () use ($data, $actor) {
            return $this->createRecord($data, $actor);
        });
    }

    /**
     * @param  array<int,array<string,mixed>>  $items
     * @return array<int,ServiceComplexityCoefficient>
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
    public function stop(int $id, array $data, ?User $actor): ServiceComplexityCoefficient
    {
        return DB::transaction(function () use ($id, $data, $actor) {
            $this->refreshStatuses();

            $record = ServiceComplexityCoefficient::query()->lockForUpdate()->findOrFail($id);

            if (in_array($record->status, [ServiceComplexityCoefficient::STATUS_EXPIRED, ServiceComplexityCoefficient::STATUS_STOPPED], true)) {
                throw ValidationException::withMessages([
                    'id' => 'Chi co the ngung ap dung cau hinh chua het hieu luc.',
                ]);
            }

            if ($this->hasFinalizedPayrollUsage($record)) {
                throw ValidationException::withMessages([
                    'id' => 'Cau hinh da duoc dung trong phieu luong da chot, khong the sua truc tiep.',
                ]);
            }

            $effectiveTo = ! empty($data['effective_to'])
                ? $this->parseBusinessDate($data['effective_to'])->endOfDay()
                : ($record->effective_from->lessThanOrEqualTo($this->businessNow()) ? $this->businessNow() : $record->effective_to);

            if ($effectiveTo && $effectiveTo->lessThan($record->effective_from)) {
                throw ValidationException::withMessages([
                    'effective_to' => 'Ngay ngung ap dung khong duoc nho hon ngay bat dau hieu luc.',
                ]);
            }

            $record->fill([
                'effective_to' => $effectiveTo,
                'status' => ServiceComplexityCoefficient::STATUS_STOPPED,
                'stop_reason' => $data['reason'],
                'stop_reason_detail' => $data['reason_detail'] ?? null,
                'stopped_by' => $actor?->id,
                'stopped_at' => $this->businessNow(),
                'updated_by' => $actor?->id,
            ])->save();

            $this->auditLog->log($actor, 'service_complexity.stopped', [
                'complexity_id' => $record->id,
                'service_id' => $record->service_id,
                'processing_level' => $record->processing_level,
                'effective_to' => $effectiveTo?->toDateString(),
                'reason' => $data['reason'],
                'reason_detail' => $data['reason_detail'] ?? null,
            ]);

            return $this->find($record->id);
        });
    }

    /**
     * @param  array<string,mixed>  $filters
     * @return array<int,array<string,mixed>>
     */
    public function auditLogs(int $complexityId, array $filters = []): array
    {
        $q = DB::table('audit_logs')
            ->where('action', 'like', 'service_complexity.%')
            ->where(function ($query) use ($complexityId) {
                $query->where('details', 'like', '%"complexity_id":'.$complexityId.',%')
                    ->orWhere('details', 'like', '%"complexity_id":'.$complexityId.'}%');
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
     * @return array<int,array{value:string,label:string,default_coefficient:float}>
     */
    public function processingLevels(): array
    {
        return collect(ExaminationServiceItem::ALL_LEVELS)
            ->map(fn (string $level) => [
                'value' => $level,
                'label' => ExaminationServiceItem::LEVEL_LABELS[$level] ?? $level,
                'default_coefficient' => self::DEFAULT_COEFFICIENT,
            ])
            ->values()
            ->all();
    }

    /**
     * @param  array<string,mixed>  $data
     */
    private function createRecord(array $data, ?User $actor): ServiceComplexityCoefficient
    {
        $this->refreshStatuses();
        $service = $this->assertConfigurableService((int) $data['service_id']);
        $this->validateCoefficient($data['processing_level'], (float) $data['coefficient']);

        ServiceComplexityCoefficient::query()
            ->where('service_id', $service->id)
            ->where('processing_level', $data['processing_level'])
            ->whereIn('status', [ServiceComplexityCoefficient::STATUS_UPCOMING, ServiceComplexityCoefficient::STATUS_ACTIVE])
            ->lockForUpdate()
            ->get();

        $effectiveFrom = $this->parseBusinessDate($data['effective_from'])->startOfDay();
        $effectiveTo = ! empty($data['effective_to'])
            ? $this->parseBusinessDate($data['effective_to'])->endOfDay()
            : null;

        $this->validateRange($effectiveFrom, $effectiveTo);
        $cappedRecords = $this->capOpenEndedPredecessors($service->id, $data['processing_level'], $effectiveFrom, $actor);
        $this->ensureNoOverlap($service->id, $data['processing_level'], $effectiveFrom, $effectiveTo);

        $record = ServiceComplexityCoefficient::create([
            'code' => $this->generateCode(),
            'service_id' => $service->id,
            'processing_level' => $data['processing_level'],
            'coefficient' => round((float) $data['coefficient'], 2),
            'effective_from' => $effectiveFrom,
            'effective_to' => $effectiveTo,
            'status' => $this->computeStatus($effectiveFrom, $effectiveTo),
            'change_reason' => $data['change_reason'] ?? null,
            'note' => $data['note'] ?? null,
            'created_by' => $actor?->id,
            'updated_by' => $actor?->id,
        ]);

        $this->auditLog->log($actor, 'service_complexity.created', [
            'complexity_id' => $record->id,
            'code' => $record->code,
            'service_id' => $record->service_id,
            'processing_level' => $record->processing_level,
            'coefficient' => (float) $record->coefficient,
            'effective_from' => $effectiveFrom->toDateString(),
            'effective_to' => $effectiveTo?->toDateString(),
            'capped_predecessor_ids' => $cappedRecords,
        ]);

        return $this->find($record->id);
    }

    private function assertConfigurableService(int $serviceId): Service
    {
        $service = Service::query()->findOrFail($serviceId);
        if (! in_array($service->status, self::CONFIGURABLE_SERVICE_STATUSES, true)) {
            throw ValidationException::withMessages([
                'service_id' => 'Dịch vụ không tồn tại hoặc đã ngừng áp dụng.',
            ]);
        }

        return $service;
    }

    private function validateCoefficient(string $level, float $coefficient): void
    {
        if (! in_array($level, ExaminationServiceItem::ALL_LEVELS, true)) {
            throw ValidationException::withMessages([
                'processing_level' => 'Muc xu ly khong hop le.',
            ]);
        }

        $rounded = round($coefficient, 2);
        $rule = self::COEFFICIENT_RULES[$level];

        if (array_key_exists('exact', $rule) && abs($rounded - $rule['exact']) > 0.0001) {
            throw ValidationException::withMessages([
                'coefficient' => sprintf('Muc %s phai co he so %.2f.', $level, $rule['exact']),
            ]);
        }

        if ($rounded < $rule['min'] || $rounded > $rule['max']) {
            throw ValidationException::withMessages([
                'coefficient' => sprintf('He so muc %s phai nam trong khoang %.2f - %.2f.', $level, $rule['min'], $rule['max']),
            ]);
        }
    }

    private function validateRange(CarbonInterface $from, ?CarbonInterface $to): void
    {
        if ($to && $to->lessThan($from)) {
            throw ValidationException::withMessages([
                'effective_to' => 'Ngay ket thuc phai lon hon hoac bang ngay bat dau.',
            ]);
        }
    }

    private function ensureNoOverlap(int $serviceId, string $level, CarbonInterface $from, ?CarbonInterface $to): void
    {
        $q = ServiceComplexityCoefficient::query()
            ->where('service_id', $serviceId)
            ->where('processing_level', $level)
            ->whereIn('status', [ServiceComplexityCoefficient::STATUS_UPCOMING, ServiceComplexityCoefficient::STATUS_ACTIVE]);

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
                    'Khoang hieu luc bi trung voi cau hinh %s (%s - %s).',
                    $conflict->code,
                    optional($conflict->effective_from)->format('d/m/Y') ?? '-',
                    optional($conflict->effective_to)->format('d/m/Y') ?? 'khong thoi han'
                ),
            ]);
        }
    }

    /**
     * @return array<int,int>
     */
    private function capOpenEndedPredecessors(
        int $serviceId,
        string $level,
        CarbonInterface $newFrom,
        ?User $actor
    ): array {
        $boundary = $newFrom->copy()->subSecond();
        $records = ServiceComplexityCoefficient::query()
            ->where('service_id', $serviceId)
            ->where('processing_level', $level)
            ->whereIn('status', [ServiceComplexityCoefficient::STATUS_ACTIVE, ServiceComplexityCoefficient::STATUS_UPCOMING])
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

            $this->auditLog->log($actor, 'service_complexity.superseded', [
                'complexity_id' => $record->id,
                'new_effective_to' => $boundary->toDateString(),
            ]);
        }

        return $ids;
    }

    public function refreshStatuses(): void
    {
        $now = $this->businessNow();

        ServiceComplexityCoefficient::query()
            ->where('status', '!=', ServiceComplexityCoefficient::STATUS_STOPPED)
            ->where('effective_from', '>', $now)
            ->update(['status' => ServiceComplexityCoefficient::STATUS_UPCOMING]);

        ServiceComplexityCoefficient::query()
            ->where('status', '!=', ServiceComplexityCoefficient::STATUS_STOPPED)
            ->where('effective_from', '<=', $now)
            ->where(function (Builder $q) use ($now) {
                $q->whereNull('effective_to')->orWhere('effective_to', '>=', $now);
            })
            ->update(['status' => ServiceComplexityCoefficient::STATUS_ACTIVE]);

        ServiceComplexityCoefficient::query()
            ->where('status', '!=', ServiceComplexityCoefficient::STATUS_STOPPED)
            ->whereNotNull('effective_to')
            ->where('effective_to', '<', $now)
            ->update(['status' => ServiceComplexityCoefficient::STATUS_EXPIRED]);
    }

    private function computeStatus(CarbonInterface $from, ?CarbonInterface $to): string
    {
        $now = $this->businessNow();

        if ($from->greaterThan($now)) {
            return ServiceComplexityCoefficient::STATUS_UPCOMING;
        }

        if ($to && $to->lessThan($now)) {
            return ServiceComplexityCoefficient::STATUS_EXPIRED;
        }

        return ServiceComplexityCoefficient::STATUS_ACTIVE;
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
     * @return array<string,mixed>
     */
    private function briefRecord(ServiceComplexityCoefficient $record): array
    {
        return [
            'id' => $record->id,
            'code' => $record->code,
            'service_id' => $record->service_id,
            'processing_level' => $record->processing_level,
            'coefficient' => (string) $record->coefficient,
            'status' => $record->status,
            'is_default' => false,
            'effective_from' => $record->effective_from,
            'effective_to' => $record->effective_to,
        ];
    }

    /**
     * @return array<string,mixed>
     */
    private function defaultCell(int $serviceId, string $level): array
    {
        return [
            'id' => null,
            'code' => null,
            'service_id' => $serviceId,
            'processing_level' => $level,
            'coefficient' => number_format(self::DEFAULT_COEFFICIENT, 2, '.', ''),
            'status' => 'default',
            'is_default' => true,
            'effective_from' => null,
            'effective_to' => null,
        ];
    }

    private function generateCode(): string
    {
        do {
            $code = 'SCX-'.random_int(100000, 999999);
        } while (ServiceComplexityCoefficient::query()->where('code', $code)->exists());

        return $code;
    }

    private function hasFinalizedPayrollUsage(ServiceComplexityCoefficient $record): bool
    {
        // UC18 payroll tables are not present yet. Keep this integration point
        // so finalized payroll lines can block future mutations when UC18 lands.
        return false;
    }
}
