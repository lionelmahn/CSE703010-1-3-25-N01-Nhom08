<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * UC6.1 + UC6.2 - Yeu cau dat lich online tu landing page.
 */
class OnlineBookingRequest extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'cho_xu_ly';
    public const STATUS_PROCESSING = 'dang_xu_ly';
    public const STATUS_PROPOSE_OTHER = 'de_xuat_lich_khac';
    public const STATUS_APPOINTMENT_CREATED = 'da_tao_lich_hen';
    public const STATUS_REJECTED = 'da_tu_choi';
    public const STATUS_CANCELED = 'da_huy';
    public const STATUS_EXPIRED = 'qua_han_xu_ly';

    public const ALL_STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_PROCESSING,
        self::STATUS_PROPOSE_OTHER,
        self::STATUS_APPOINTMENT_CREATED,
        self::STATUS_REJECTED,
        self::STATUS_CANCELED,
        self::STATUS_EXPIRED,
    ];

    public const EMAIL_STATUS_NONE = 'none';
    public const EMAIL_STATUS_SENT = 'sent';
    public const EMAIL_STATUS_FAILED = 'failed';
    public const EMAIL_STATUS_PENDING_RETRY = 'pending_retry';

    protected $fillable = [
        'code',
        'name',
        'phone',
        'email',
        'need',
        'service_ids',
        'branch_id',
        'preferred_date',
        'preferred_time_slot',
        'customer_note',
        'internal_note',
        'status',
        'patient_id',
        'appointment_id',
        'processed_by',
        'processed_at',
        'email_status',
        'source',
        'submitted_at',
        'device',
        'ip',
        'proposed_slots',
        'reject_reason',
    ];

    protected $casts = [
        'service_ids' => 'array',
        'proposed_slots' => 'array',
        'preferred_date' => 'date',
        'submitted_at' => 'datetime',
        'processed_at' => 'datetime',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function processor()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function histories()
    {
        return $this->hasMany(OnlineBookingRequestHistory::class, 'request_id')
            ->orderBy('created_at');
    }

    /**
     * Tao ma OLB<YYYY><nnnnnn> theo dem ngay.
     */
    public static function generateCode(): string
    {
        $prefix = 'OLB'.now()->format('Y');

        // Dem so request tao trong nam de tao seq increment.
        $count = static::where('code', 'like', $prefix.'%')->count() + 1;

        return $prefix.str_pad((string) $count, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Cac trang thai con xu ly duoc (VR1 / SR1-SR3).
     */
    public function isProcessable(): bool
    {
        return in_array($this->status, [
            self::STATUS_PENDING,
            self::STATUS_PROCESSING,
            self::STATUS_PROPOSE_OTHER,
        ], true);
    }

    public function isTerminal(): bool
    {
        return in_array($this->status, [
            self::STATUS_APPOINTMENT_CREATED,
            self::STATUS_CANCELED,
        ], true);
    }
}
