<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DoctorQualificationCoefficient extends Model
{
    public const TYPE_DEGREE = 'degree';
    public const TYPE_ACADEMIC_TITLE = 'academic_title';

    public const STATUS_UPCOMING = 'upcoming';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_EXPIRED = 'expired';
    public const STATUS_STOPPED = 'stopped';

    public const DEFAULT_COEFFICIENT = 1.0;

    public const TYPES = [
        self::TYPE_DEGREE,
        self::TYPE_ACADEMIC_TITLE,
    ];

    public const STATUSES = [
        self::STATUS_UPCOMING,
        self::STATUS_ACTIVE,
        self::STATUS_EXPIRED,
        self::STATUS_STOPPED,
    ];

    protected $fillable = [
        'code',
        'qualification_catalog_id',
        'qualification_code',
        'qualification_name',
        'qualification_type',
        'priority',
        'coefficient',
        'effective_from',
        'effective_to',
        'status',
        'change_reason',
        'note',
        'stop_reason',
        'stop_reason_detail',
        'created_by',
        'updated_by',
        'stopped_by',
        'stopped_at',
    ];

    protected $casts = [
        'priority' => 'integer',
        'coefficient' => 'decimal:2',
        'effective_from' => 'datetime',
        'effective_to' => 'datetime',
        'stopped_at' => 'datetime',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function stopper(): BelongsTo
    {
        return $this->belongsTo(User::class, 'stopped_by');
    }

    public function catalog(): BelongsTo
    {
        return $this->belongsTo(QualificationCatalog::class, 'qualification_catalog_id');
    }

    /**
     * @return array<int,string>
     */
    public static function qualificationCodes(): array
    {
        return QualificationCatalog::query()
            ->where('status', QualificationCatalog::STATUS_ACTIVE)
            ->orderBy('priority')
            ->pluck('code')
            ->all();
    }

    /**
     * @return array<string,mixed>|null
     */
    public static function qualificationByCode(string $code): ?array
    {
        $qualification = QualificationCatalog::query()
            ->where('code', $code)
            ->where('status', QualificationCatalog::STATUS_ACTIVE)
            ->first();

        return $qualification?->toPayrollOption();
    }
}
