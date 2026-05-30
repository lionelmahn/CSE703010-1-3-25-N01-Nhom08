<?php

namespace App\Http\Requests\Appointment;

use App\Models\Appointment;
use Illuminate\Foundation\Http\FormRequest;

/**
 * UC11 - Validate check-in benh nhan (VR1-VR7, VR11, VR13).
 */
class CheckInAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'arrival_flag' => ['nullable', 'string', 'in:'.implode(',', Appointment::ALL_ARRIVAL_FLAGS)],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'arrival_flag.in' => 'Co thoi gian den khong hop le.',
            'note.max' => 'Ghi chu khong duoc qua 500 ky tu.',
        ];
    }
}
