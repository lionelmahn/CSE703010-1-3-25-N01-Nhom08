<?php

namespace App\Http\Requests;

use App\Models\Patient;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * UC5 - Validation cap nhat ho so benh nhan.
 *
 * Tat ca cac field deu optional, nhung neu xuat hien thi phai dung dinh dang
 * theo VR. Patient code khong cho sua (BR: ma duy nhat sinh tu he thong).
 */
class UpdatePatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'full_name' => ['sometimes', 'string', 'max:191'],
            'phone' => ['sometimes', 'string', 'regex:/^(0|\+84)[0-9]{9,10}$/'],
            'email' => ['nullable', 'email', 'max:191'],
            'dob' => ['nullable', 'date', 'before:today'],
            'gender' => ['nullable', 'string', Rule::in(['Nam', 'Nữ', 'Khác', 'male', 'female', 'other'])],
            'id_number' => ['nullable', 'string', 'regex:/^[0-9]{9,12}$/'],
            'address' => ['nullable', 'string', 'max:500'],
            'occupation' => ['nullable', 'string', 'max:100'],
            'marital_status' => ['nullable', 'string', 'max:32'],
            'source' => ['nullable', 'string', 'max:64'],
            'medical_history' => ['nullable', 'string', 'max:2000'],
            'allergies' => ['nullable', 'string', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'force_create_reason' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.regex' => 'Số điện thoại không hợp lệ (E2).',
            'email.email' => 'Email không hợp lệ (E3).',
            'dob.before' => 'Ngày sinh phải trước ngày hiện tại (E4).',
            'id_number.regex' => 'CCCD/CMND chỉ gồm 9-12 chữ số.',
        ];
    }

    public function validatedPayload(): array
    {
        $payload = $this->validated();
        if (array_key_exists('gender', $payload)) {
            $payload['gender'] = Patient::normalizeGender($payload['gender']);
        }

        return $payload;
    }
}
