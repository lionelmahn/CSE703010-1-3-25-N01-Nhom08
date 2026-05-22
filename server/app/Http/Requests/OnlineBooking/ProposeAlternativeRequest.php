<?php

namespace App\Http\Requests\OnlineBooking;

use Illuminate\Foundation\Http\FormRequest;

/**
 * UC6.2 - "De xuat lich khac" (VR6, AC22, ER-02).
 *
 * Bat buoc co tu 1 den 3 khung gio de xuat. Moi khung phai co `date` + `time_slot`.
 */
class ProposeAlternativeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'proposed_slots' => ['required', 'array', 'min:1', 'max:3'],
            'proposed_slots.*.date' => ['required', 'date', 'after_or_equal:today'],
            'proposed_slots.*.time_slot' => ['required', 'string', 'max:64'],
            'message' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'proposed_slots.required' => 'Vui long de xuat it nhat mot khung gio.',
            'proposed_slots.max' => 'Toi da chi de xuat 3 khung gio.',
            'proposed_slots.*.date.after_or_equal' => 'Ngay de xuat khong duoc o qua khu.',
        ];
    }
}
