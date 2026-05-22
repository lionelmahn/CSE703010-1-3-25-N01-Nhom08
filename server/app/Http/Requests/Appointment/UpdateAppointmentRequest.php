<?php

namespace App\Http\Requests\Appointment;

use Illuminate\Foundation\Http\FormRequest;

/**
 * UC7 - Update thong tin co ban cua lich hen (notes, services, branch).
 *
 * UC7 KHONG cho cap nhat ngay/gio (dung endpoint /reschedule), KHONG
 * gan/doi bac si (UC8), KHONG check-in (UC9).
 */
class UpdateAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'patient_id' => ['nullable', 'integer', 'exists:patients,id'],
            'service_ids' => ['nullable', 'array'],
            'service_ids.*' => ['string', 'max:50'],
            'branch_id' => ['nullable', 'string', 'max:64'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
