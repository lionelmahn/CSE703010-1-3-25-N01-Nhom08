<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * Benh nhan (DR12).
 *
 * UC6.1/6.2 dung cot email/is_active/last_visit_at; UC5 (Quan ly ho so benh
 * nhan) mo rong them id_number (CCCD), source, occupation, marital_status,
 * allergies, notes, status (active/inactive/merged), merged_into_id,
 * created_by/updated_by, cac timestamps deactivated_at/merged_at, va
 * force_create_reason de phuc vu BR cho phep tao ho so trung khi co quyen +
 * ly do.
 */
class Patient extends Model
{
    use HasFactory;

    public const STATUS_ACTIVE = 'active';

    public const STATUS_INACTIVE = 'inactive';

    public const STATUS_MERGED = 'merged';

    public const ALL_STATUSES = [
        self::STATUS_ACTIVE,
        self::STATUS_INACTIVE,
        self::STATUS_MERGED,
    ];

    protected $fillable = [
        'patient_code',
        'full_name',
        'phone',
        'email',
        'id_number',
        'source',
        'dob',
        'gender',
        'address',
        'occupation',
        'marital_status',
        'medical_history',
        'allergies',
        'notes',
        'loyalty_points',
        'total_debt',
        'is_active',
        'last_visit_at',
        'status',
        'merged_into_id',
        'deactivated_at',
        'deactivation_reason',
        'merged_at',
        'force_create_reason',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'dob' => 'date',
        'loyalty_points' => 'integer',
        'total_debt' => 'decimal:2',
        'is_active' => 'boolean',
        'last_visit_at' => 'datetime',
        'deactivated_at' => 'datetime',
        'merged_at' => 'datetime',
    ];

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function onlineBookingRequests(): HasMany
    {
        return $this->hasMany(OnlineBookingRequest::class);
    }

    public function histories(): HasMany
    {
        return $this->hasMany(PatientHistory::class)->orderByDesc('created_at');
    }

    public function mergedInto(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'merged_into_id');
    }

    public function mergedFrom(): HasMany
    {
        return $this->hasMany(Patient::class, 'merged_into_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function scopeActiveStatus(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeNotMerged(Builder $query): Builder
    {
        return $query->where('status', '!=', self::STATUS_MERGED);
    }

    /**
     * Phat sinh ma BN dang BN<YYYY><nnnnn>.
     */
    public static function generateCode(?int $seed = null): string
    {
        $prefix = 'BN'.now()->format('Y');

        if ($seed !== null) {
            return $prefix.str_pad((string) $seed, 5, '0', STR_PAD_LEFT);
        }

        $latest = static::query()
            ->where('patient_code', 'like', $prefix.'%')
            ->orderByDesc('patient_code')
            ->value('patient_code');

        if ($latest && preg_match('/^'.preg_quote($prefix, '/').'(\d{5})$/', $latest, $m)) {
            $next = ((int) $m[1]) + 1;
            if ($next > 99999) {
                $next = random_int(10000, 99999);
            }

            return $prefix.str_pad((string) $next, 5, '0', STR_PAD_LEFT);
        }

        return $prefix.str_pad((string) random_int(10000, 99999), 5, '0', STR_PAD_LEFT);
    }

    /**
     * Helper map gender frontend -> enum DB.
     */
    public static function normalizeGender(?string $value): string
    {
        $value = $value ? Str::lower(trim($value)) : '';

        return match ($value) {
            'male', 'nam' => 'Nam',
            'female', 'nu', 'nữ' => 'Nữ',
            default => 'Khác',
        };
    }

    public function age(): ?int
    {
        if (! $this->dob) {
            return null;
        }

        return Carbon::parse($this->dob)->diffInYears(now());
    }

    public function isMerged(): bool
    {
        return $this->status === self::STATUS_MERGED;
    }

    public function isActiveStatus(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }
}
