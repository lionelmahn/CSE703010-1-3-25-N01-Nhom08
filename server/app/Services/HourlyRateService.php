<?php

namespace App\Services;

use App\Models\BaseHourlyRate;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class HourlyRateService
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

        $q = BaseHourlyRate::query()
            ->with(['creator:id,name', 'updater:id,name', 'stopper:id,name']);

        if (! empty($filters['status']) && $filters['status'] !== 'all') {
            $q->where('status', $filters['status']);
        }

        if (! empty($filters['from']) || ! empty($filters['to'])) {
            $from = ! empty($filters['from']) ? $this->parseBusinessDate($filters['from'])->startOfDay() : null;
            $to = ! empty($filters['to']) ? $this->parseBusinessDate($filters['to'])->endOfDay() : null;

            $q->where(function (Builder $sub) use ($from, $to) {
                if ($from) {
                    $sub->whereNull('effective_to')->orWhere('effective_to', '>=', $from);
                }
                if ($to) {
                    $sub->where('effective_from', '<=', $to);
                }
            });
        }

        return $q->orderByDesc('effective_from')
            ->orderByDesc('id')
            ->paginate($perPage);
    }

    public function find(int $id): BaseHourlyRate
    {
        $this->refreshStatuses();

        return BaseHourlyRate::query()
            ->with(['creator:id,name', 'updater:id,name', 'stopper:id,name'])
            ->findOrFail($id);
    }

    public function current(?string $date = null): ?BaseHourlyRate
    {
        $this->refreshStatuses();

        $when = $this->asBusinessDateTime($date);

        return $this->resolveForDate($when);
    }

    public function resolveForDate(CarbonInterface|string|null $date = null): ?BaseHourlyRate
    {
        $when = $this->asBusinessDateTime($date);

        return BaseHourlyRate::query()
            ->with(['creator:id,name', 'updater:id,name', 'stopper:id,name'])
            ->where('status', '!=', BaseHourlyRate::STATUS_STOPPED)
            ->where('effective_from', '<=', $when)
            ->where(function (Builder $q) use ($when) {
                $q->whereNull('effective_to')->orWhere('effective_to', '>=', $when);
            })
            ->orderByDesc('effective_from')
            ->first();
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function create(array $data, ?User $actor): BaseHourlyRate
    {
        return DB::transaction(function () use ($data, $actor) {
            $this->refreshStatuses();

            BaseHourlyRate::query()
                ->whereIn('status', [BaseHourlyRate::STATUS_UPCOMING, BaseHourlyRate::STATUS_ACTIVE])
                ->lockForUpdate()
                ->get();

            $effectiveFrom = $this->parseBusinessDate($data['effective_from'])->startOfDay();
            $effectiveTo = ! empty($data['effective_to'])
                ? $this->parseBusinessDate($data['effective_to'])->endOfDay()
                : null;

            $this->validateRange($effectiveFrom, $effectiveTo);
            $cappedRecords = $this->capOpenEndedPredecessors($effectiveFrom, $actor);
            $this->ensureNoOverlap($effectiveFrom, $effectiveTo);

            $record = BaseHourlyRate::create([
                'hourly_rate' => (float) $data['hourly_rate'],
                'currency' => 'VND',
                'effective_from' => $effectiveFrom,
                'effective_to' => $effectiveTo,
                'status' => $this->computeStatus($effectiveFrom, $effectiveTo),
                'note' => $data['note'] ?? null,
                'created_by' => $actor?->id,
                'updated_by' => $actor?->id,
            ]);

            $this->auditLog->log($actor, 'hourly_rate.created', [
                'rate_id' => $record->id,
                'hourly_rate' => (float) $record->hourly_rate,
                'currency' => $record->currency,
                'effective_from' => $effectiveFrom->toDateString(),
                'effective_to' => $effectiveTo?->toDateString(),
                'capped_predecessor_ids' => $cappedRecords,
            ]);

            return $record->fresh(['creator:id,name', 'updater:id,name', 'stopper:id,name']);
        });
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function stop(int $id, array $data, ?User $actor): BaseHourlyRate
    {
        return DB::transaction(function () use ($id, $data, $actor) {
            $this->refreshStatuses();

            $record = BaseHourlyRate::query()->lockForUpdate()->findOrFail($id);

            if (in_array($record->status, [BaseHourlyRate::STATUS_EXPIRED, BaseHourlyRate::STATUS_STOPPED], true)) {
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
                'status' => BaseHourlyRate::STATUS_STOPPED,
                'stop_reason' => $data['reason'],
                'stop_reason_detail' => $data['reason_detail'] ?? null,
                'stopped_by' => $actor?->id,
                'stopped_at' => $this->businessNow(),
                'updated_by' => $actor?->id,
            ])->save();

            $this->auditLog->log($actor, 'hourly_rate.stopped', [
                'rate_id' => $record->id,
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
    public function auditLogs(int $rateId, array $filters = []): array
    {
        $q = DB::table('audit_logs')
            ->where('action', 'like', 'hourly_rate.%')
            ->where('details', 'like', '%"rate_id":'.$rateId.'%');

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

    private function validateRange(CarbonInterface $from, ?CarbonInterface $to): void
    {
        if ($to && $to->lessThan($from)) {
            throw ValidationException::withMessages([
                'effective_to' => 'Ngay ket thuc phai lon hon hoac bang ngay bat dau.',
            ]);
        }
    }

    private function ensureNoOverlap(CarbonInterface $from, ?CarbonInterface $to, ?int $excludeId = null): void
    {
        $q = BaseHourlyRate::query()
            ->whereIn('status', [BaseHourlyRate::STATUS_UPCOMING, BaseHourlyRate::STATUS_ACTIVE]);

        if ($excludeId) {
            $q->where('id', '!=', $excludeId);
        }

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
                    'Khoang hieu luc bi trung voi cau hinh #%d (%s - %s).',
                    $conflict->id,
                    optional($conflict->effective_from)->format('d/m/Y') ?? '-',
                    optional($conflict->effective_to)->format('d/m/Y') ?? 'khong thoi han'
                ),
            ]);
        }
    }

    /**
     * @return array<int,int>
     */
    private function capOpenEndedPredecessors(CarbonInterface $newFrom, ?User $actor): array
    {
        $now = $this->businessNow();
        $boundary = $newFrom->copy()->subSecond();
        $records = BaseHourlyRate::query()
            ->whereIn('status', [BaseHourlyRate::STATUS_ACTIVE, BaseHourlyRate::STATUS_UPCOMING])
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

            $this->auditLog->log($actor, 'hourly_rate.superseded', [
                'rate_id' => $record->id,
                'new_effective_to' => $boundary->toDateString(),
            ]);
        }

        return $ids;
    }

    private function refreshStatuses(): void
    {
        $now = $this->businessNow();

        BaseHourlyRate::query()
            ->where('status', '!=', BaseHourlyRate::STATUS_STOPPED)
            ->where('effective_from', '>', $now)
            ->update(['status' => BaseHourlyRate::STATUS_UPCOMING]);

        BaseHourlyRate::query()
            ->where('status', '!=', BaseHourlyRate::STATUS_STOPPED)
            ->where('effective_from', '<=', $now)
            ->where(function (Builder $q) use ($now) {
                $q->whereNull('effective_to')->orWhere('effective_to', '>=', $now);
            })
            ->update(['status' => BaseHourlyRate::STATUS_ACTIVE]);

        BaseHourlyRate::query()
            ->where('status', '!=', BaseHourlyRate::STATUS_STOPPED)
            ->whereNotNull('effective_to')
            ->where('effective_to', '<', $now)
            ->update(['status' => BaseHourlyRate::STATUS_EXPIRED]);
    }

    private function computeStatus(CarbonInterface $from, ?CarbonInterface $to): string
    {
        $now = $this->businessNow();

        if ($from->greaterThan($now)) {
            return BaseHourlyRate::STATUS_UPCOMING;
        }

        if ($to && $to->lessThan($now)) {
            return BaseHourlyRate::STATUS_EXPIRED;
        }

        return BaseHourlyRate::STATUS_ACTIVE;
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

    private function hasFinalizedPayrollUsage(BaseHourlyRate $record): bool
    {
        // UC18 payroll tables are not present yet. Keep this as the integration
        // point so finalized payroll lines can block future mutations later.
        return false;
    }
}
