<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * UC16 - Chi tiet tinh luong cua mot ca lam trong phieu luong.
 *
 * Cong thuc (DR9, DR12):
 *   converted_hours = shift_hours * (shift_coefficient + total_patient_coefficient)
 *   shift_amount    = converted_hours * doctor_coefficient * hourly_rate
 */
class SalarySlipDetail extends Model
{
    protected $fillable = [
        'salary_slip_id',
        'work_schedule_id',
        'work_date',
        'shift_template_code',
        'shift_name',
        'start_time',
        'end_time',
        'shift_hours',
        'day_type',
        'shift_type',
        'shift_coefficient',
        'total_patient_coefficient',
        'converted_hours',
        'doctor_coefficient',
        'hourly_rate',
        'shift_amount',
        'examination_breakdown',
    ];

    protected $casts = [
        'work_date' => 'date',
        'shift_hours' => 'float',
        'shift_coefficient' => 'float',
        'total_patient_coefficient' => 'float',
        'converted_hours' => 'float',
        'doctor_coefficient' => 'float',
        'hourly_rate' => 'float',
        'shift_amount' => 'float',
        'examination_breakdown' => 'array',
    ];

    public function slip(): BelongsTo
    {
        return $this->belongsTo(SalarySlip::class, 'salary_slip_id');
    }

    public function workSchedule(): BelongsTo
    {
        return $this->belongsTo(WorkSchedule::class, 'work_schedule_id');
    }
}
