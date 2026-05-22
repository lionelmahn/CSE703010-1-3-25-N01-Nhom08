<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * UC5 - Gop hai (hoac nhieu) ho so benh nhan trung.
 *
 * `primary_id` la ho so chinh duoc giu lai; `secondary_ids` la cac ho so se
 * chuyen sang trang thai "merged". Toan bo lich hen / yeu cau online se duoc
 * tro ve primary trong service.
 */
class MergePatientsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'primary_id' => ['required', 'integer', 'exists:patients,id'],
            'secondary_ids' => ['required', 'array', 'min:1', 'max:10'],
            'secondary_ids.*' => ['integer', 'exists:patients,id', 'different:primary_id'],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'primary_id.required' => 'Vui lòng chọn hồ sơ chính.',
            'secondary_ids.required' => 'Vui lòng chọn ít nhất một hồ sơ sẽ gộp vào.',
            'secondary_ids.*.different' => 'Hồ sơ phụ không được trùng với hồ sơ chính.',
        ];
    }
}
