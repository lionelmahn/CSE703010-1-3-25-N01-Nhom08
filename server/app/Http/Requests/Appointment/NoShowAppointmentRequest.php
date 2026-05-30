<?php

namespace App\Http\Requests\Appointment;

use Illuminate\Foundation\Http\FormRequest;

/**
 * UC11 - Validate mark no-show (VR9 lien quan, VR12).
 */
class NoShowAppointmentRequest extends FormRequest
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
            'reason.required' => 'Vui long chon ly do khong den.',
            'reason.min' => 'Ly do khong den qua ngan.',
            'reason.max' => 'Ly do khong den qua dai.',
            'note.max' => 'Ghi chu khong duoc qua 500 ky tu.',
        ];
    }
}
