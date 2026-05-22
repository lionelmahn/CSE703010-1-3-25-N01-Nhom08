<?php

namespace App\Http\Requests\OnlineBooking;

use Illuminate\Foundation\Http\FormRequest;

/**
 * UC6.2 - "Tu choi yeu cau" (VR5, AC22, ER-03, BR-07).
 *
 * Bat buoc co reason text de xuat hien tren email tu choi gui khach.
 */
class RejectOnlineBookingRequest extends FormRequest
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
            'reason.required' => 'Vui long nhap ly do tu choi.',
            'reason.min' => 'Ly do tu choi qua ngan.',
            'reason.max' => 'Ly do tu choi qua dai (toi da 500 ky tu).',
        ];
    }
}
