<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * UC16 - Phieu luong cua mot bac si trong mot thang.
 *
 * La nguon du lieu goc cho cac bao cao luong UC17-UC19. Doctor = `staff`
 * (role_slug='bac_si'); phien kham lien ket qua `staff.user_id`.
 */
class SalarySlip extends Model
{
    public const STATUS_DRAFT = 'draft';
    public const STATUS_CALCULATED = 'calculated';
    public const STATUS_NEEDS_RECALCULATE = 'needs_recalculate';
    public const STATUS_FINALIZED = 'finalized';

    public const STATUSES = [
        self::STATUS_DRAFT,
        self::STATUS_CALCULATED,
        self::STATUS_NEEDS_RECALCULATE,
        self::STATUS_FINALIZED,
    ];

    public const TYPE_MAIN = 'main';

    protected $fillable = [
        'code',
        'staff_id',
        'period_month',
        'period_year',
        'slip_type',
        'doctor_name_snapshot',
        'qualification_code_snapshot',
        'qualification_name_snapshot',
        'doctor_coefficient_snapshot',
        'hourly_rate_snapshot',
        'total_shifts',
        'total_shift_hours',
        'total_converted_hours',
        'total_patient_coefficient',
        'total_amount',
        'status',
        'calculation_snapshot',
        'note',
        'created_by',
        'calculated_at',
        'finalized_by',
        'finalized_at',
    ];

    protected $casts = [
        'period_month' => 'integer',
        'period_year' => 'integer',
        'doctor_coefficient_snapshot' => 'float',
        'hourly_rate_snapshot' => 'float',
        'total_shifts' => 'integer',
        'total_shift_hours' => 'float',
        'total_converted_hours' => 'float',
        'total_patient_coefficient' => 'float',
        'total_amount' => 'float',
        'calculation_snapshot' => 'array',
        'calculated_at' => 'datetime',
        'finalized_at' => 'datetime',
    ];

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }

    public function details(): HasMany
    {
        return $this->hasMany(SalarySlipDetail::class)->orderBy('work_date')->orderBy('start_time');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function finalizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'finalized_by');
    }

    public function isFinalized(): bool
    {
        return $this->status === self::STATUS_FINALIZED;
    }
}
