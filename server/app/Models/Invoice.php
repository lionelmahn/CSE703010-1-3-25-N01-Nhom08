<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * UC13 - Hoa don thanh toan chi phi kham benh.
 *
 * Workflow status:
 *  pending -> partial (khi thu mot phan)
 *  pending|partial -> paid (khi thu du)
 *  pending|partial -> cancelled (sau khi refund neu da thu)
 *  paid -> refunded (refund full)
 *  paid -> partial (refund partial)
 *
 * VR13: Tai moi thoi diem chi co 1 invoice "main" cho cung `examination_id`
 * o status NOT IN cancelled - enforce trong InvoiceService::createFromExamination.
 *
 * Code format INV-YYYY-XXXXXX, sequence reset theo nam.
 */
class Invoice extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';

    public const STATUS_PARTIAL = 'partial';

    public const STATUS_PAID = 'paid';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_REFUNDED = 'refunded';

    public const ALL_STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_PARTIAL,
        self::STATUS_PAID,
        self::STATUS_CANCELLED,
        self::STATUS_REFUNDED,
    ];

    public const OPEN_STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_PARTIAL,
    ];

    public const TYPE_MAIN = 'main';

    public const TYPE_ADJUSTMENT = 'adjustment';

    protected $fillable = [
        'code',
        'examination_id',
        'appointment_id',
        'patient_id',
        'patient_name_snapshot',
        'patient_phone_snapshot',
        'doctor_id',
        'exam_date',
        'branch_id',
        'subtotal',
        'discount_amount',
        'discount_reason',
        'discount_note',
        'surcharge_amount',
        'surcharge_reason',
        'total',
        'amount_paid',
        'amount_due',
        'status',
        'type',
        'parent_invoice_id',
        'notes',
        'created_by',
        'cancelled_by',
        'cancelled_at',
        'cancelled_reason',
        'cancelled_note',
        'adjusted_at',
    ];

    protected $casts = [
        'exam_date' => 'datetime',
        'cancelled_at' => 'datetime',
        'adjusted_at' => 'datetime',
        'subtotal' => 'float',
        'discount_amount' => 'float',
        'surcharge_amount' => 'float',
        'total' => 'float',
        'amount_paid' => 'float',
        'amount_due' => 'float',
    ];

    public function examination(): BelongsTo
    {
        return $this->belongsTo(ExaminationSession::class, 'examination_id');
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class, 'appointment_id');
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(PaymentTransaction::class)->orderBy('paid_at');
    }

    public function adjustments(): HasMany
    {
        return $this->hasMany(InvoiceAdjustment::class)->orderByDesc('created_at');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'parent_invoice_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function canceller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    public function scopeOpen(Builder $q): Builder
    {
        return $q->whereIn('status', self::OPEN_STATUSES);
    }

    public function scopeForPatient(Builder $q, int $patientId): Builder
    {
        return $q->where('patient_id', $patientId);
    }

    public function isOpen(): bool
    {
        return in_array($this->status, self::OPEN_STATUSES, true);
    }

    public function isFullyPaid(): bool
    {
        return $this->status === self::STATUS_PAID;
    }

    /**
     * Sinh code INV-YYYY-XXXXXX. Goi trong transaction co lockForUpdate
     * o caller de tranh race.
     */
    public static function generateCode(?Carbon $now = null): string
    {
        $now = $now ?: Carbon::now();
        $year = $now->year;
        $prefix = "INV-{$year}-";
        $last = DB::table('invoices')
            ->where('code', 'like', "{$prefix}%")
            ->orderByDesc('id')
            ->lockForUpdate()
            ->value('code');

        $next = 1;
        if ($last && preg_match('/INV-\d{4}-(\d+)$/', $last, $m)) {
            $next = ((int) $m[1]) + 1;
        }

        return $prefix.str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }
}
