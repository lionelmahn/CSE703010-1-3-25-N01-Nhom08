<?php

namespace App\Services;

use App\Models\ShiftCoefficient;
use App\Models\User;
use App\Models\WorkSchedule;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ShiftCoefficientService
{
    private const BUSINESS_TIMEZONE = 'Asia/Ho_Chi_Minh';
    private const DEFAULT_COEFFICIENT = 1.0;

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

        $q = ShiftCoefficient::query()
            ->with(['creator:id,name', 'updater:id,name', 'stopper:id,name']);

        if (! empty($filters['status']) && $filters['status'] !== 'all') {
            $q->where('status', $filters['status']);
        }

        if (! empty($filters['day_type']) && $filters['day_type'] !== 'all') {
            $q->where('day_type', $filters['day_type']);
        }

        if (! empty($filters['shift_type']) && $filters['shift_type'] !== 'all') {
            $q->where('shift_type', $filters['shift_type']);
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

        return $q->orderBy('day_type')
            ->orderBy('shift_type')
            ->orderByDesc('effective_from')
            ->orderByDesc('id')
            ->paginate($perPage);
    }

    public function find(int $id): ShiftCoefficient
    {
        $this->refreshStatuses();

        return ShiftCoefficient::query()
            ->with(['creator:id,name', 'updater:id,name', 'stopper:id,name'])
            ->findOrFail($id);
    }

    /**
     * @return array<string,mixed>
     */
    public function effectiveMatrix(?string $date = null): array
    {
        $this->refreshStatuses();

        $when = $this->asBusinessDateTime($date);
        $matrix = [];
        $missingCount = 0;

        foreach (ShiftCoefficient::DAY_TYPES as $dayType) {
            $matrix[$dayType] = [];
            foreach (ShiftCoefficient::SHIFT_TYPES as $shiftType) {
                $record = $this->resolveFor($dayType, $shiftType, $when);
                if ($record) {
                    $matrix[$dayType][$shiftType] = $this->briefRecord($record);
                    continue;
                }

                $missingCount++;
                $matrix[$dayType][$shiftType] = [
                    'id' => null,
                    'code' => null,
                    'name' => 'Hệ số mặc định',
                    'day_type' => $dayType,
                    'shift_type' => $shiftType,
                    'coefficient' => number_format(self::DEFAULT_COEFFICIENT, 2, '.', ''),
                    'status' => 'default',
                    'is_default' => true,
                    'effective_from' => null,
                    'effective_to' => null,
                ];
            }
        }

        return [
            'date' => $when->toDateString(),
            'day_types' => ShiftCoefficient::DAY_TYPES,
            'shift_types' => ShiftCoefficient::SHIFT_TYPES,
            'matrix' => $matrix,
            'missing_count' => $missingCount,
        ];
    }

    public function resolveFor(string $dayType, string $shiftType, CarbonInterface|string|null $date = null): ?ShiftCoefficient
    {
        $when = $this->asBusinessDateTime($date);

        return ShiftCoefficient::query()
            ->where('day_type', $dayType)
            ->where('shift_type', $shiftType)
            ->where('status', '!=', ShiftCoefficient::STATUS_STOPPED)
            ->where('effective_from', '<=', $when)
            ->where(function (Builder $q) use ($when) {
                $q->whereNull('effective_to')->orWhere('effective_to', '>=', $when);
            })
            ->orderByDesc('effective_from')
            ->first();
    }

    public function resolveCoefficientValue(
        CarbonInterface|string $workDate,
        string $shiftType,
        ?User $actor = null,
        bool $logDefault = true
    ): float {
        $dayType = $this->dayTypeForDate($workDate);
        $record = $this->resolveFor($dayType, $shiftType, $workDate);

        if ($record) {
            return (float) $record->coefficient;
        }

        if ($logDefault) {
            $this->auditLog->log($actor, 'shift_coefficient.default_used', [
                'day_type' => $dayType,
                'shift_type' => $shiftType,
                'work_date' => $this->asBusinessDateTime($workDate)->toDateString(),
                'coefficient' => self::DEFAULT_COEFFICIENT,
            ]);
        }

        return self::DEFAULT_COEFFICIENT;
    }

    public function resolveCoefficientValueForSchedule(
        WorkSchedule $schedule,
        ?User $actor = null,
        bool $logDefault = true
    ): float {
        $schedule->loadMissing('shiftTemplate:id,code');

        return $this->resolveCoefficientValue(
            $schedule->work_date,
            $this->shiftTypeForSchedule($schedule),
            $actor,
            $logDefault
        );
    }

    public function shiftTypeForSchedule(WorkSchedule $schedule): string
    {
        $schedule->loadMissing('shiftTemplate:id,code');
        $code = $schedule->shiftTemplate?->code;

        return in_array($code, ShiftCoefficient::SHIFT_TYPES, true)
            ? $code
            : ShiftCoefficient::SHIFT_TYPE_CUSTOM;
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function create(array $data, ?User $actor): ShiftCoefficient
    {
        return DB::transaction(function () use ($data, $actor) {
            return $this->createRecord($data, $actor);
        });
    }

    /**
     * @param  array<int,array<string,mixed>>  $items
     * @return array<int,ShiftCoefficient>
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
    public function stop(int $id, array $data, ?User $actor): ShiftCoefficient
    {
        return DB::transaction(function () use ($id, $data, $actor) {
            $this->refreshStatuses();

            $record = ShiftCoefficient::query()->lockForUpdate()->findOrFail($id);

            if (in_array($record->status, [ShiftCoefficient::STATUS_EXPIRED, ShiftCoefficient::STATUS_STOPPED], true)) {
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
                'status' => ShiftCoefficient::STATUS_STOPPED,
                'stop_reason' => $data['reason'],
                'stop_reason_detail' => $data['reason_detail'] ?? null,
                'stopped_by' => $actor?->id,
                'stopped_at' => $this->businessNow(),
                'updated_by' => $actor?->id,
            ])->save();

            $this->auditLog->log($actor, 'shift_coefficient.stopped', [
                'coefficient_id' => $record->id,
                'effective_to' => $effectiveTo?->toDateString(),
                'reason' => $data['reason'],
                'reason_detail' => $data['reason_detail'] ?? null,
            ]);

            return $record->fresh(['creator:id,name', 'updater:id,name', 'stopper:id,name']);
        });
    }

    /**
     * @param  array<string,mixed>  $filters
     * @return array<int,array<string,mixed>>
     */
    public function auditLogs(int $coefficientId, array $filters = []): array
    {
        $q = DB::table('audit_logs')
            ->where('action', 'like', 'shift_coefficient.%')
            ->where('details', 'like', '%"coefficient_id":'.$coefficientId.'%');

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
    private function createRecord(array $data, ?User $actor): ShiftCoefficient
    {
        $this->refreshStatuses();

        ShiftCoefficient::query()
            ->where('day_type', $data['day_type'])
            ->where('shift_type', $data['shift_type'])
            ->whereIn('status', [ShiftCoefficient::STATUS_UPCOMING, ShiftCoefficient::STATUS_ACTIVE])
            ->lockForUpdate()
            ->get();

        $effectiveFrom = $this->parseBusinessDate($data['effective_from'])->startOfDay();
        $effectiveTo = ! empty($data['effective_to'])
            ? $this->parseBusinessDate($data['effective_to'])->endOfDay()
            : null;

        $this->validateRange($effectiveFrom, $effectiveTo);
        $cappedRecords = $this->capOpenEndedPredecessors($data['day_type'], $data['shift_type'], $effectiveFrom, $actor);
        $this->ensureNoOverlap($data['day_type'], $data['shift_type'], $effectiveFrom, $effectiveTo);

        $record = ShiftCoefficient::create([
            'code' => $this->generateCode(),
            'name' => $data['name'],
            'day_type' => $data['day_type'],
            'shift_type' => $data['shift_type'],
            'coefficient' => (float) $data['coefficient'],
            'effective_from' => $effectiveFrom,
            'effective_to' => $effectiveTo,
            'status' => $this->computeStatus($effectiveFrom, $effectiveTo),
            'change_reason' => $data['change_reason'] ?? null,
            'note' => $data['note'] ?? null,
            'created_by' => $actor?->id,
            'updated_by' => $actor?->id,
        ]);

        $this->auditLog->log($actor, 'shift_coefficient.created', [
            'coefficient_id' => $record->id,
            'code' => $record->code,
            'day_type' => $record->day_type,
            'shift_type' => $record->shift_type,
            'coefficient' => (float) $record->coefficient,
            'effective_from' => $effectiveFrom->toDateString(),
            'effective_to' => $effectiveTo?->toDateString(),
            'capped_predecessor_ids' => $cappedRecords,
        ]);

        return $record->fresh(['creator:id,name', 'updater:id,name', 'stopper:id,name']);
    }

    private function validateRange(CarbonInterface $from, ?CarbonInterface $to): void
    {
        if ($to && $to->lessThan($from)) {
            throw ValidationException::withMessages([
                'effective_to' => 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.',
            ]);
        }
    }

    private function ensureNoOverlap(string $dayType, string $shiftType, CarbonInterface $from, ?CarbonInterface $to): void
    {
        $q = ShiftCoefficient::query()
            ->where('day_type', $dayType)
            ->where('shift_type', $shiftType)
            ->whereIn('status', [ShiftCoefficient::STATUS_UPCOMING, ShiftCoefficient::STATUS_ACTIVE]);

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
        string $dayType,
        string $shiftType,
        CarbonInterface $newFrom,
        ?User $actor
    ): array {
        $now = $this->businessNow();
        $boundary = $newFrom->copy()->subSecond();
        $records = ShiftCoefficient::query()
            ->where('day_type', $dayType)
            ->where('shift_type', $shiftType)
            ->whereIn('status', [ShiftCoefficient::STATUS_ACTIVE, ShiftCoefficient::STATUS_UPCOMING])
            ->where('effective_from', '<=', $now)
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

            $this->auditLog->log($actor, 'shift_coefficient.superseded', [
                'coefficient_id' => $record->id,
                'new_effective_to' => $boundary->toDateString(),
            ]);
        }

        return $ids;
    }

    private function refreshStatuses(): void
    {
        $now = $this->businessNow();

        ShiftCoefficient::query()
            ->where('status', '!=', ShiftCoefficient::STATUS_STOPPED)
            ->where('effective_from', '>', $now)
            ->update(['status' => ShiftCoefficient::STATUS_UPCOMING]);

        ShiftCoefficient::query()
            ->where('status', '!=', ShiftCoefficient::STATUS_STOPPED)
            ->where('effective_from', '<=', $now)
            ->where(function (Builder $q) use ($now) {
                $q->whereNull('effective_to')->orWhere('effective_to', '>=', $now);
            })
            ->update(['status' => ShiftCoefficient::STATUS_ACTIVE]);

        ShiftCoefficient::query()
            ->where('status', '!=', ShiftCoefficient::STATUS_STOPPED)
            ->whereNotNull('effective_to')
            ->where('effective_to', '<', $now)
            ->update(['status' => ShiftCoefficient::STATUS_EXPIRED]);
    }

    private function computeStatus(CarbonInterface $from, ?CarbonInterface $to): string
    {
        $now = $this->businessNow();

        if ($from->greaterThan($now)) {
            return ShiftCoefficient::STATUS_UPCOMING;
        }

        if ($to && $to->lessThan($now)) {
            return ShiftCoefficient::STATUS_EXPIRED;
        }

        return ShiftCoefficient::STATUS_ACTIVE;
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

    private function dayTypeForDate(CarbonInterface|string $date): string
    {
        $when = $this->asBusinessDateTime($date);

        return match ($when->dayOfWeekIso) {
            6 => ShiftCoefficient::DAY_TYPE_SATURDAY,
            7 => ShiftCoefficient::DAY_TYPE_SUNDAY,
            default => ShiftCoefficient::DAY_TYPE_WEEKDAY,
        };
    }

    /**
     * @return array<string,mixed>
     */
    private function briefRecord(ShiftCoefficient $record): array
    {
        return [
            'id' => $record->id,
            'code' => $record->code,
            'name' => $record->name,
            'day_type' => $record->day_type,
            'shift_type' => $record->shift_type,
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
            $code = 'SCF-'.random_int(100000, 999999);
        } while (ShiftCoefficient::query()->where('code', $code)->exists());

        return $code;
    }

    private function hasFinalizedPayrollUsage(ShiftCoefficient $record): bool
    {
        // UC18 payroll tables are not present yet. Keep this integration point
        // so finalized payroll lines can block future mutations when UC18 lands.
        return false;
    }
}
