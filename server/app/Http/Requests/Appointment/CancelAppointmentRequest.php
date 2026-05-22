<?php

namespace App\Http\Requests\Appointment;

use Illuminate\Foundation\Http\FormRequest;

/**
 * UC7 - Huy lich hen (WF4, VR9, VR10, AC13, AC14, AC15).
 */
class CancelAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'min:3', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'reason.required' => 'Vui long nhap ly do huy lich hen.',
            'reason.min' => 'Ly do huy qua ngan.',
        ];
    }
}
