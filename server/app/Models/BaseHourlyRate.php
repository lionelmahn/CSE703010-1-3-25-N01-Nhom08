<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BaseHourlyRate extends Model
{
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

    protected $table = 'base_hourly_rates';

    protected $fillable = [
        'hourly_rate',
        'currency',
        'effective_from',
        'effective_to',
        'status',
        'note',
        'stop_reason',
        'stop_reason_detail',
        'created_by',
        'updated_by',
        'stopped_by',
        'stopped_at',
    ];

    protected $casts = [
        'hourly_rate' => 'decimal:2',
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
