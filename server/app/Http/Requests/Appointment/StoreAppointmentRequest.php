<?php

namespace App\Http\Requests\Appointment;

use App\Models\Appointment;
use Illuminate\Foundation\Http\FormRequest;

/**
 * UC7 - Validate tao moi lich hen tu UC7 (BR2, VR1-VR6, VR14).
 */
class StoreAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'patient_id' => ['required', 'integer', 'exists:patients,id'],
            'appointment_date' => ['required', 'date', 'after_or_equal:today'],
            'time_slot' => ['required', 'string', 'max:64'],
            'branch_id' => ['required', 'string', 'max:64'],
            'service_ids' => ['nullable', 'array'],
            'service_ids.*' => ['string', 'max:50'],
            'source' => ['nullable', 'string', 'in:'.implode(',', Appointment::ALL_SOURCES)],
            'notes' => ['nullable', 'string', 'max:1000'],
            // online_booking_request_id chi co khi tao tu UC6.2; UC7 truc tiep
            // van cho phep gan thu cong (vi du khi rebuild flow online).
            'online_booking_request_id' => ['nullable', 'integer', 'exists:online_booking_requests,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'patient_id.required' => 'Vui long chon ho so benh nhan.',
            'patient_id.exists' => 'Khong tim thay ho so benh nhan.',
            'appointment_date.required' => 'Vui long chon ngay hen.',
            'appointment_date.after_or_equal' => 'Ngay hen khong duoc o qua khu.',
            'time_slot.required' => 'Vui long chon khung gio hen.',
            'branch_id.required' => 'Vui long chon chi nhanh.',
        ];
    }
}
