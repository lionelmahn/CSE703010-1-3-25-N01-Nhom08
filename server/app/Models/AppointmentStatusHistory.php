<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * UC7 - Lich su trang thai/action cua mot Appointment.
 *
 * Khong su dung `updated_at` (chi luu thoi diem action xay ra).
 */
class AppointmentStatusHistory extends Model
{
    public const UPDATED_AT = null;

    public const ACTION_CREATED = 'created';
    public const ACTION_UPDATED = 'updated';
    public const ACTION_RESCHEDULED = 'rescheduled';
    public const ACTION_CANCELLED = 'cancelled';
    public const ACTION_STATUS_CHANGED = 'status_changed';

    // UC8 - dieu phoi bac si.
    public const ACTION_ASSIGNED = 'assigned';
    public const ACTION_REASSIGNED = 'reassigned';
    public const ACTION_UNASSIGNED = 'unassigned';

    public const DISPATCH_ACTIONS = [
        self::ACTION_ASSIGNED,
        self::ACTION_REASSIGNED,
        self::ACTION_UNASSIGNED,
    ];

    // UC11 - tiep nhan / check-in.
    public const ACTION_CHECKED_IN = 'checked_in';
    public const ACTION_CHECK_IN_CANCELLED = 'check_in_cancelled';
    public const ACTION_NO_SHOW = 'no_show';

    public const CHECK_IN_ACTIONS = [
        self::ACTION_CHECKED_IN,
        self::ACTION_CHECK_IN_CANCELLED,
        self::ACTION_NO_SHOW,
    ];

    protected $fillable = [
        'appointment_id',
        'action',
        'from_status',
        'to_status',
        'reason',
        'metadata',
        'actor_id',
        'actor_name',
        'created_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
