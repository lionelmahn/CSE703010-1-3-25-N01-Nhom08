<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceComplexityCoefficient extends Model
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

    protected $fillable = [
        'code',
        'service_id',
        'processing_level',
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

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

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

    public function serviceItems(): HasMany
    {
        return $this->hasMany(ExaminationServiceItem::class, 'service_complexity_coefficient_id');
    }
}
