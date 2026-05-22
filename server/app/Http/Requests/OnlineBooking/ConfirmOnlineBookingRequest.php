<?php

namespace App\Http\Requests\OnlineBooking;

use Illuminate\Foundation\Http\FormRequest;

/**
 * UC6.2 - Validate request "Xac nhan lich hen" (BR-04, VR2-VR4, VR8, VR11).
 *
 * Bat buoc da co `patient_id`, date + slot khong duoc rong. Service_ids
 * optional (le tan co the giu nguyen tu booking goc).
 */
class ConfirmOnlineBookingRequest extends FormRequest
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
            'service_ids' => ['nullable', 'array'],
            'service_ids.*' => ['string', 'max:50'],
            'branch_id' => ['nullable', 'string', 'max:64'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'patient_id.required' => 'Phai lien ket hoac tao moi ho so benh nhan truoc khi xac nhan.',
            'patient_id.exists' => 'Khong tim thay benh nhan.',
            'appointment_date.required' => 'Vui long chon ngay hen.',
            'appointment_date.after_or_equal' => 'Ngay hen khong duoc o qua khu.',
            'time_slot.required' => 'Vui long chon khung gio.',
        ];
    }
}
