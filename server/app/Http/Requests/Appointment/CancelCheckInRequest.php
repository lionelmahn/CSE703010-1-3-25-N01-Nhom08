<?php

namespace App\Http\Requests\Appointment;

use Illuminate\Foundation\Http\FormRequest;

/**
 * UC11 - Validate huy check-in (VR9, VR11, VR14).
 */
class CancelCheckInRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'min:3', 'max:191'],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'reason.required' => 'Vui long nhap ly do huy check-in.',
            'reason.min' => 'Ly do huy check-in qua ngan.',
            'reason.max' => 'Ly do huy check-in qua dai.',
            'note.max' => 'Ghi chu khong duoc qua 500 ky tu.',
        ];
    }
}
