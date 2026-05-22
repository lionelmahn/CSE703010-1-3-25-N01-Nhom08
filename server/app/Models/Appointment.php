<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Lich hen chinh thuc tao tu UC6.2 hoac UC7.
 *
 * Status mac dinh `cho_phan_cong_bac_si` (BR-12, AC18) — phai sang UC7 de
 * gan bac si va xac nhan lich.
 */
class Appointment extends Model
{
    use HasFactory;

    public const STATUS_WAITING_DOCTOR_ASSIGNMENT = 'cho_phan_cong_bac_si';

    protected $fillable = [
        'code',
        'online_booking_request_id',
        'patient_id',
        'appointment_date',
        'time_slot',
        'service_ids',
        'branch_id',
        'status',
        'assigned_doctor_id',
        'created_by',
        'notes',
    ];

    protected $casts = [
        'appointment_date' => 'date',
        'service_ids' => 'array',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function bookingRequest()
    {
        return $this->belongsTo(OnlineBookingRequest::class, 'online_booking_request_id');
    }

    public function assignedDoctor()
    {
        return $this->belongsTo(User::class, 'assigned_doctor_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public static function generateCode(): string
    {
        $prefix = 'APT'.now()->format('Y');
        $count = static::where('code', 'like', $prefix.'%')->count() + 1;

        return $prefix.str_pad((string) $count, 6, '0', STR_PAD_LEFT);
    }
}
