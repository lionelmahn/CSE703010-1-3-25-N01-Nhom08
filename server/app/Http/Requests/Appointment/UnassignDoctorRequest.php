<?php

namespace App\Http\Requests\Appointment;

use Illuminate\Foundation\Http\FormRequest;

/**
 * UC8 - Validate huy phan cong bac si (AC13, VR13).
 */
class UnassignDoctorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'min:5', 'max:500'],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'reason.required' => 'Vui long nhap ly do huy phan cong.',
            'reason.min' => 'Ly do huy phan cong phai co it nhat 5 ky tu.',
        ];
    }
}
