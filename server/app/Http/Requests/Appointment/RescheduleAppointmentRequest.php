<?php

namespace App\Http\Requests\Appointment;

use Illuminate\Foundation\Http\FormRequest;

/**
 * UC7 - Doi lich hen (WF3, VR8, AC11, AC12, AC22).
 *
 * Bat buoc nhap ly do (VR8). Backend kiem tra trang thai cho phep doi
 * lich trong service (`Appointment::canBeRescheduled`).
 */
class RescheduleAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'appointment_date' => ['required', 'date', 'after_or_equal:today'],
            'time_slot' => ['required', 'string', 'max:64'],
            'branch_id' => ['nullable', 'string', 'max:64'],
            'reason' => ['required', 'string', 'min:3', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'reason.required' => 'Vui long nhap ly do doi lich.',
            'reason.min' => 'Ly do doi lich qua ngan.',
            'appointment_date.required' => 'Vui long chon ngay hen moi.',
            'appointment_date.after_or_equal' => 'Ngay hen moi khong duoc o qua khu.',
            'time_slot.required' => 'Vui long chon khung gio moi.',
        ];
    }
}
