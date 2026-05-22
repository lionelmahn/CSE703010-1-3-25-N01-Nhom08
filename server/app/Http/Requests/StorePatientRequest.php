<?php

namespace App\Http\Requests;

use App\Models\Patient;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * UC5 - Validation tao moi ho so benh nhan.
 *
 * Backend validation song hanh voi FE; reject neu thieu / sai dinh dang
 * (E1-E4). Kiem tra trung (E5) duoc xu ly trong service vi can fuzzy match.
 */
class StorePatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'full_name' => ['required', 'string', 'max:191'],
            'phone' => ['required', 'string', 'regex:/^(0|\+84)[0-9]{9,10}$/'],
            'email' => ['nullable', 'email', 'max:191'],
            'dob' => ['nullable', 'date', 'before:today'],
            'gender' => ['nullable', 'string', Rule::in(['Nam', 'Nữ', 'Khác', 'male', 'female', 'other'])],
            'id_number' => ['nullable', 'string', 'regex:/^[0-9]{9,12}$/'],
            'address' => ['nullable', 'string', 'max:500'],
            'occupation' => ['nullable', 'string', 'max:100'],
            'marital_status' => ['nullable', 'string', 'max:32'],
            'source' => ['required', 'string', 'max:64'],
            'medical_history' => ['nullable', 'string', 'max:2000'],
            'allergies' => ['nullable', 'string', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'force_create_reason' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'full_name.required' => 'Vui lòng nhập họ tên (E1).',
            'phone.required' => 'Vui lòng nhập số điện thoại (E1).',
            'phone.regex' => 'Số điện thoại không hợp lệ (E2).',
            'email.email' => 'Email không hợp lệ (E3).',
            'dob.before' => 'Ngày sinh phải trước ngày hiện tại (E4).',
            'id_number.regex' => 'CCCD/CMND chỉ gồm 9-12 chữ số.',
            'source.required' => 'Vui lòng chọn nguồn tiếp nhận.',
        ];
    }

    public function validatedPayload(): array
    {
        $payload = $this->validated();
        $payload['gender'] = Patient::normalizeGender($payload['gender'] ?? null);

        return $payload;
    }
}
