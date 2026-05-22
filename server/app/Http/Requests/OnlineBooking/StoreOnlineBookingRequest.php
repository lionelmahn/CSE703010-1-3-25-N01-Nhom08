<?php

namespace App\Http\Requests\OnlineBooking;

use Illuminate\Foundation\Http\FormRequest;

/**
 * UC6.1 - Validate payload submit yeu cau dat lich tu landing page (public).
 *
 * Mirror cua frontend `buildBookingPayload` + VR1-VR12. Backend van re-check
 * de chong by-pass FE.
 */
class StoreOnlineBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Public endpoint.
    }

    /**
     * Frontend gui mix giua `full_name` / `name` va `preferred_time_slot` /
     * `preferred_time_slot_id`. Chuan hoa truoc khi validate de cap nhat
     * legacy payload van chap nhan duoc.
     */
    protected function prepareForValidation(): void
    {
        $name = $this->input('name') ?? $this->input('full_name');
        $timeSlot = $this->input('preferred_time_slot')
            ?? $this->input('preferred_time_slot_id');

        $this->merge([
            'name' => is_string($name) ? trim($name) : $name,
            'preferred_time_slot' => $timeSlot,
        ]);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:100'],
            'phone' => ['required', 'string', 'regex:/^(0|\+84)[0-9]{9,10}$/'],
            'email' => ['required', 'email:rfc', 'max:191'],
            'need' => ['nullable', 'string', 'in:general,examination,aesthetic,other'],
            'service_ids' => ['nullable', 'array', 'max:10'],
            'service_ids.*' => ['string', 'max:50'],
            'branch_id' => ['required', 'string', 'max:64'],
            'preferred_date' => ['required', 'date', 'after_or_equal:today', 'before_or_equal:'.now()->addDays(30)->toDateString()],
            'preferred_time_slot' => ['required', 'string', 'max:64'],
            'note' => ['nullable', 'string', 'max:500'],
            'customer_note' => ['nullable', 'string', 'max:500'],
            'accepted_terms' => ['required', 'accepted'],
            'captcha_token' => ['nullable', 'string'],
            'source' => ['nullable', 'string', 'max:64'],
            'device' => ['nullable', 'string', 'max:191'],
            'ip' => ['nullable', 'string', 'max:45'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Vui long nhap ho ten.',
            'phone.required' => 'Vui long nhap so dien thoai.',
            'phone.regex' => 'So dien thoai khong hop le (vd 0901234567).',
            'email.required' => 'Vui long nhap email.',
            'email.email' => 'Email khong hop le.',
            'branch_id.required' => 'Vui long chon chi nhanh.',
            'preferred_date.required' => 'Vui long chon ngay.',
            'preferred_date.after_or_equal' => 'Ngay khong duoc o qua khu.',
            'preferred_date.before_or_equal' => 'Chi cho phep dat lich trong vong 30 ngay toi.',
            'preferred_time_slot.required' => 'Vui long chon khung gio.',
            'accepted_terms.accepted' => 'Vui long dong y dieu khoan dich vu.',
        ];
    }
}
