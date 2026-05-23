<?php

namespace App\Http\Requests\Appointment;

use Illuminate\Foundation\Http\FormRequest;

/**
 * UC8 - Validate doi bac si cho lich hen (AC10, VR13).
 */
class ReassignDoctorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'doctor_id' => ['required', 'integer', 'exists:users,id'],
            'reason' => ['required', 'string', 'min:5', 'max:500'],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'doctor_id.required' => 'Vui long chon bac si moi.',
            'doctor_id.exists' => 'Khong tim thay bac si trong he thong.',
            'reason.required' => 'Vui long nhap ly do doi bac si.',
            'reason.min' => 'Ly do doi bac si phai co it nhat 5 ky tu.',
        ];
    }
}
