<?php

namespace App\Http\Requests\Appointment;

use Illuminate\Foundation\Http\FormRequest;

/**
 * UC8 - Validate phan cong bac si cho lich hen (SR1, VR3-VR7).
 */
class AssignDoctorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'doctor_id' => ['required', 'integer', 'exists:users,id'],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'doctor_id.required' => 'Vui long chon bac si phu trach.',
            'doctor_id.exists' => 'Khong tim thay bac si trong he thong.',
        ];
    }
}
