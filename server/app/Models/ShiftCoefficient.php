<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShiftCoefficient extends Model
{
    public const DAY_TYPE_WEEKDAY = 'weekday';
    public const DAY_TYPE_SATURDAY = 'saturday';
    public const DAY_TYPE_SUNDAY = 'sunday';
    public const DAY_TYPE_HOLIDAY = 'holiday';

    public const SHIFT_TYPE_MORNING = WorkShiftTemplate::CODE_MORNING;
    public const SHIFT_TYPE_AFTERNOON = WorkShiftTemplate::CODE_AFTERNOON;
    public const SHIFT_TYPE_EVENING = WorkShiftTemplate::CODE_EVENING;
    public const SHIFT_TYPE_CUSTOM = WorkShiftTemplate::CODE_CUSTOM;

    public const STATUS_UPCOMING = 'upcoming';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_EXPIRED = 'expired';
    public const STATUS_STOPPED = 'stopped';

    public const STATUSES = [
        self::STATUS_UPCOMING,
        self::STATUS_ACTIVE,
        self::STATUS_EXPIRED,
        self::STATUS_STOPPED,
    ];

    public const DAY_TYPES = [
        self::DAY_TYPE_WEEKDAY,
        self::DAY_TYPE_SATURDAY,
        self::DAY_TYPE_SUNDAY,
        self::DAY_TYPE_HOLIDAY,
    ];

    public const SHIFT_TYPES = [
        self::SHIFT_TYPE_MORNING,
        self::SHIFT_TYPE_AFTERNOON,
        self::SHIFT_TYPE_EVENING,
        self::SHIFT_TYPE_CUSTOM,
    ];

    protected $fillable = [
        'code',
        'name',
        'day_type',
        'shift_type',
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
}
