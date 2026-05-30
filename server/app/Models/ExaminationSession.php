<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * UC12 - Phien kham (ho so benh an) cua mot lich hen da check-in.
 *
 * Khac biet voi UC11: UC11 tao `queue_entry` (bucket=ready) khi check-in;
 * UC12 tao `examination_session` khi bac si bat dau ghi nhan. Mot
 * appointment chi co duy nhat 1 examination_session "song" (status khac
 * `da_huy`) — VR12. Mat code: BA-YYYY-XXXXXX (sequence per year).
 */
class ExaminationSession extends Model
{
    use HasFactory;

    // SR1-SR7 status enum.
    public const STATUS_CHO_KHAM = 'cho_kham';

    public const STATUS_DANG_KHAM = 'dang_kham';

    public const STATUS_NHAP = 'nhap';

    public const STATUS_CHO_THANH_TOAN = 'cho_thanh_toan';

    public const STATUS_HOAN_TAT = 'hoan_tat';

    public const STATUS_DA_KHOA = 'da_khoa';

    public const STATUS_DA_HUY = 'da_huy';

    public const ALL_STATUSES = [
        self::STATUS_CHO_KHAM,
        self::STATUS_DANG_KHAM,
        self::STATUS_NHAP,
        self::STATUS_CHO_THANH_TOAN,
        self::STATUS_HOAN_TAT,
        self::STATUS_DA_KHOA,
        self::STATUS_DA_HUY,
    ];

    /**
     * Status cho phep cac thao tac chinh sua chuyen mon (form, dich vu,
     * dental chart). SR2/SR3.
     */
    public const EDITABLE_STATUSES = [
        self::STATUS_DANG_KHAM,
        self::STATUS_NHAP,
    ];

    /**
     * Status duoc coi la "phien dang hoat dong" - block tao moi cho cung
     * appointment_id (VR12).
     */
    public const ACTIVE_STATUSES = [
        self::STATUS_CHO_KHAM,
        self::STATUS_DANG_KHAM,
        self::STATUS_NHAP,
        self::STATUS_CHO_THANH_TOAN,
        self::STATUS_HOAN_TAT,
        self::STATUS_DA_KHOA,
    ];

    protected $fillable = [
        'code',
        'patient_id',
        'appointment_id',
        'queue_entry_id',
        'doctor_id',
        'work_schedule_id',
        'unlinked_shift',
        'status',
        'started_at',
        'completed_at',
        'chief_complaint',
        'symptoms',
        'clinical_findings',
        'diagnosis',
        'clinical_notes',
        'treatment_outcome',
        'conclusion',
        'recall_date',
        'recall_note',
        'completion_note',
        'lock_reason',
        'locked_at',
        'locked_by',
        'last_edit_reason',
        'created_by',
        'updated_by',
        'completed_by',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'locked_at' => 'datetime',
        'recall_date' => 'date',
        'unlinked_shift' => 'boolean',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function queueEntry(): BelongsTo
    {
        return $this->belongsTo(AppointmentQueueEntry::class, 'queue_entry_id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function workSchedule(): BelongsTo
    {
        return $this->belongsTo(WorkSchedule::class, 'work_schedule_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function completer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    public function locker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'locked_by');
    }

    public function serviceItems(): HasMany
    {
        return $this->hasMany(ExaminationServiceItem::class, 'examination_id');
    }

    public function toothChart(): HasMany
    {
        return $this->hasMany(ExaminationToothChart::class, 'examination_id');
    }

    public function histories(): HasMany
    {
        return $this->hasMany(ExaminationHistory::class, 'examination_id')
            ->orderByDesc('created_at');
    }

    public function scopeForDoctor(Builder $q, int $doctorId): Builder
    {
        return $q->where('doctor_id', $doctorId);
    }

    public function scopeActive(Builder $q): Builder
    {
        return $q->whereIn('status', self::ACTIVE_STATUSES);
    }

    public function isEditable(): bool
    {
        return in_array($this->status, self::EDITABLE_STATUSES, true);
    }

    public function isLocked(): bool
    {
        return $this->status === self::STATUS_DA_KHOA;
    }

    /**
     * Sinh code BA-YYYY-XXXXXX. Sequence reset moi nam. Goi trong transaction
     * `lockForUpdate` o caller de tranh race.
     */
    public static function generateCode(?Carbon $when = null): string
    {
        $when ??= Carbon::now();
        $year = $when->format('Y');
        $prefix = 'BA-'.$year.'-';
        $count = static::where('code', 'like', $prefix.'%')->count() + 1;

        return $prefix.str_pad((string) $count, 6, '0', STR_PAD_LEFT);
    }
}
