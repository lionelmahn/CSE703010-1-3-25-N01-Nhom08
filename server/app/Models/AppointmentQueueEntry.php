<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * UC11 - Mot luot cho kham cua benh nhan (DR52, DR53).
 *
 * Tao tu CheckInService::checkIn. Khong cap nhat truc tiep tu controller -
 * moi thay doi bucket phai di qua service de bao dam audit + transaction.
 */
class AppointmentQueueEntry extends Model
{
    use HasFactory;

    public const BUCKET_UNASSIGNED = 'unassigned';
    public const BUCKET_WAITING = 'waiting';
    public const BUCKET_READY = 'ready';
    public const BUCKET_IN_PROGRESS = 'in_progress';
    public const BUCKET_COMPLETED = 'completed';
    public const BUCKET_CANCELLED = 'cancelled';

    public const ACTIVE_BUCKETS = [
        self::BUCKET_UNASSIGNED,
        self::BUCKET_WAITING,
        self::BUCKET_READY,
        self::BUCKET_IN_PROGRESS,
    ];

    public const ALL_BUCKETS = [
        self::BUCKET_UNASSIGNED,
        self::BUCKET_WAITING,
        self::BUCKET_READY,
        self::BUCKET_IN_PROGRESS,
        self::BUCKET_COMPLETED,
        self::BUCKET_CANCELLED,
    ];

    protected $fillable = [
        'code',
        'appointment_id',
        'patient_id',
        'assigned_doctor_id',
        'branch_id',
        'bucket',
        'queue_number',
        'entered_at',
        'started_at',
        'completed_at',
        'cancelled_at',
        'created_by',
    ];

    protected $casts = [
        'entered_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'queue_number' => 'integer',
    ];

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function assignedDoctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_doctor_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereIn('bucket', self::ACTIVE_BUCKETS);
    }

    public function scopeForBranch(Builder $query, ?string $branchId): Builder
    {
        if ($branchId === null || $branchId === '' || $branchId === 'all') {
            return $query;
        }

        return $query->where('branch_id', $branchId);
    }

    /**
     * Sinh code W0001 reset moi ngay theo branch. Ham co the goi nhieu lan
     * trong cung 1 transaction nhung yeu cau row lock o muc cao hon.
     */
    public static function generateCode(?string $branchId, Carbon $date): string
    {
        $prefix = 'W'.$date->format('ymd');
        $count = static::query()
            ->whereBetween('entered_at', [
                $date->copy()->startOfDay(),
                $date->copy()->endOfDay(),
            ])
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->count() + 1;

        return $prefix.str_pad((string) $count, 3, '0', STR_PAD_LEFT);
    }
}
