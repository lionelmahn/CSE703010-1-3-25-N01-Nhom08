<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Lich hen chinh thuc (UC7).
 *
 * Tao tu UC6.2 (yeu cau online da xac nhan) hoac UC7 (le tan tao truc tiep).
 * Status mac dinh `cho_phan_cong_bac_si` (BR-12, AC10, WF1).
 *
 * UC7 chi xu ly cac transition WF1 (create), WF3 (reschedule), WF4 (cancel).
 * Cac transition WF2 (assign), WF5 (check-in), WF6 (start), WF7 (complete),
 * WF8 (no-show) thuoc UC8/UC9 va chi DOC du lieu o day.
 */
class Appointment extends Model
{
    use HasFactory;

    public const STATUS_WAITING_DOCTOR_ASSIGNMENT = 'cho_phan_cong_bac_si';

    public const STATUS_DOCTOR_ASSIGNED = 'da_phan_cong_bac_si';

    public const STATUS_CONFIRMED = 'da_xac_nhan';

    public const STATUS_CHECKED_IN = 'da_check_in';

    public const STATUS_IN_PROGRESS = 'dang_kham';

    public const STATUS_COMPLETED = 'hoan_tat';

    public const STATUS_CANCELLED = 'da_huy';

    public const STATUS_RESCHEDULED = 'doi_lich';

    public const STATUS_NO_SHOW = 'khong_den';

    public const ALL_STATUSES = [
        self::STATUS_WAITING_DOCTOR_ASSIGNMENT,
        self::STATUS_DOCTOR_ASSIGNED,
        self::STATUS_CONFIRMED,
        self::STATUS_CHECKED_IN,
        self::STATUS_IN_PROGRESS,
        self::STATUS_COMPLETED,
        self::STATUS_CANCELLED,
        self::STATUS_RESCHEDULED,
        self::STATUS_NO_SHOW,
    ];

    /**
     * Trang thai cho phep doi lich (VR13).
     */
    public const RESCHEDULE_ALLOWED_STATUSES = [
        self::STATUS_WAITING_DOCTOR_ASSIGNMENT,
        self::STATUS_DOCTOR_ASSIGNED,
        self::STATUS_CONFIRMED,
    ];

    /**
     * Trang thai cho phep huy (WF4) + VR10 chan huy lich `hoan_tat`.
     */
    public const CANCEL_ALLOWED_STATUSES = [
        self::STATUS_WAITING_DOCTOR_ASSIGNMENT,
        self::STATUS_DOCTOR_ASSIGNED,
        self::STATUS_CONFIRMED,
    ];

    /**
     * Trang thai cho phep sua thong tin co ban (note, services...). Khong
     * cho sua khi da check-in tro di (VR7).
     */
    public const EDIT_ALLOWED_STATUSES = [
        self::STATUS_WAITING_DOCTOR_ASSIGNMENT,
        self::STATUS_DOCTOR_ASSIGNED,
        self::STATUS_CONFIRMED,
    ];

    /**
     * UC8 - Trang thai cho phep phan cong bac si (SR1).
     */
    public const ASSIGN_ALLOWED_STATUSES = [
        self::STATUS_WAITING_DOCTOR_ASSIGNMENT,
    ];

    /**
     * UC8 - Trang thai cho phep doi bac si (AC9). Voi `da_check_in`,
     * service guard yeu cau them role admin (VR12 / SEC3).
     */
    public const REASSIGN_ALLOWED_STATUSES = [
        self::STATUS_DOCTOR_ASSIGNED,
        self::STATUS_CONFIRMED,
        self::STATUS_CHECKED_IN,
    ];

    /**
     * UC8 - Trang thai cho phep huy phan cong (AC12). Khong cho voi
     * `da_check_in` tro di (VR11).
     */
    public const UNASSIGN_ALLOWED_STATUSES = [
        self::STATUS_DOCTOR_ASSIGNED,
        self::STATUS_CONFIRMED,
    ];

    /**
     * UC11 - Trang thai cho phep check-in (SR1, SR2, SR3).
     */
    public const CHECK_IN_ALLOWED_STATUSES = [
        self::STATUS_WAITING_DOCTOR_ASSIGNMENT,
        self::STATUS_DOCTOR_ASSIGNED,
        self::STATUS_CONFIRMED,
    ];

    /**
     * UC11 - Trang thai cho phep huy check-in (SR4). Chi `da_check_in`,
     * khong cho khi da `dang_kham` (VR10).
     */
    public const CANCEL_CHECK_IN_ALLOWED_STATUSES = [
        self::STATUS_CHECKED_IN,
    ];

    /**
     * UC11 - Trang thai cho phep mark no-show (VR12, SR5).
     */
    public const NO_SHOW_ALLOWED_STATUSES = [
        self::STATUS_WAITING_DOCTOR_ASSIGNMENT,
        self::STATUS_DOCTOR_ASSIGNED,
        self::STATUS_CONFIRMED,
    ];

    public const ARRIVAL_EARLY = 'early';
    public const ARRIVAL_ON_TIME = 'on_time';
    public const ARRIVAL_LATE = 'late';
    public const ARRIVAL_VERY_LATE = 'very_late';

    public const ALL_ARRIVAL_FLAGS = [
        self::ARRIVAL_EARLY,
        self::ARRIVAL_ON_TIME,
        self::ARRIVAL_LATE,
        self::ARRIVAL_VERY_LATE,
    ];

    public const SOURCE_ONLINE = 'online';
    public const SOURCE_WALK_IN = 'tai_quay';
    public const SOURCE_PHONE = 'dien_thoai';
    public const SOURCE_FOLLOW_UP = 'tai_kham';

    public const ALL_SOURCES = [
        self::SOURCE_ONLINE,
        self::SOURCE_WALK_IN,
        self::SOURCE_PHONE,
        self::SOURCE_FOLLOW_UP,
    ];

    protected $fillable = [
        'code',
        'online_booking_request_id',
        'patient_id',
        'appointment_date',
        'time_slot',
        'source',
        'service_ids',
        'branch_id',
        'status',
        'assigned_doctor_id',
        'created_by',
        'updated_by',
        'notes',
        'reschedule_reason',
        'cancel_reason',
        'cancelled_at',
        'rescheduled_at',
        // UC11 - check-in.
        'checked_in_at',
        'checked_in_by',
        'arrival_flag',
        'pre_checkin_status',
        'no_show_at',
        'no_show_by',
        'no_show_reason',
        'check_in_cancelled_at',
        'check_in_cancelled_by',
    ];

    protected $casts = [
        'appointment_date' => 'date',
        'service_ids' => 'array',
        'cancelled_at' => 'datetime',
        'rescheduled_at' => 'datetime',
        // UC11.
        'checked_in_at' => 'datetime',
        'no_show_at' => 'datetime',
        'check_in_cancelled_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function bookingRequest(): BelongsTo
    {
        return $this->belongsTo(OnlineBookingRequest::class, 'online_booking_request_id');
    }

    public function assignedDoctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_doctor_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function histories(): HasMany
    {
        return $this->hasMany(AppointmentStatusHistory::class)->orderBy('created_at');
    }

    public function checkedInBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'checked_in_by');
    }

    public function noShowBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'no_show_by');
    }

    public function checkInCancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'check_in_cancelled_by');
    }

    public function queueEntries(): HasMany
    {
        return $this->hasMany(AppointmentQueueEntry::class)->orderByDesc('entered_at');
    }

    /**
     * UC10 - Toan bo thong bao (auto + manual) gan voi lich hen nay.
     */
    public function appNotifications(): HasMany
    {
        return $this->hasMany(AppNotification::class, 'appointment_id')
            ->orderByDesc('created_at');
    }

    public static function generateCode(): string
    {
        $prefix = 'APT'.now()->format('Y');
        $count = static::where('code', 'like', $prefix.'%')->count() + 1;

        return $prefix.str_pad((string) $count, 6, '0', STR_PAD_LEFT);
    }

    public function scopeActiveForSlot(Builder $query): Builder
    {
        return $query->whereNotIn('status', [
            self::STATUS_CANCELLED,
            self::STATUS_COMPLETED,
            self::STATUS_NO_SHOW,
        ]);
    }

    public function canBeRescheduled(): bool
    {
        return in_array($this->status, self::RESCHEDULE_ALLOWED_STATUSES, true);
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, self::CANCEL_ALLOWED_STATUSES, true);
    }

    public function canBeEdited(): bool
    {
        return in_array($this->status, self::EDIT_ALLOWED_STATUSES, true);
    }

    public function canAssignDoctor(): bool
    {
        return in_array($this->status, self::ASSIGN_ALLOWED_STATUSES, true);
    }

    public function canReassignDoctor(): bool
    {
        return in_array($this->status, self::REASSIGN_ALLOWED_STATUSES, true)
            && $this->assigned_doctor_id !== null;
    }

    public function canUnassignDoctor(): bool
    {
        return in_array($this->status, self::UNASSIGN_ALLOWED_STATUSES, true)
            && $this->assigned_doctor_id !== null;
    }

    public function canBeCheckedIn(): bool
    {
        return in_array($this->status, self::CHECK_IN_ALLOWED_STATUSES, true);
    }

    public function canCancelCheckIn(): bool
    {
        return in_array($this->status, self::CANCEL_CHECK_IN_ALLOWED_STATUSES, true);
    }

    public function canMarkNoShow(): bool
    {
        return in_array($this->status, self::NO_SHOW_ALLOWED_STATUSES, true);
    }
}
