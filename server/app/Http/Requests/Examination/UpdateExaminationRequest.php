<?php

namespace App\Http\Requests\Examination;

use Illuminate\Foundation\Http\FormRequest;

/**
 * UC12 - PATCH /api/examinations/{id} - auto-save form chuyen mon.
 *
 * Tat ca field deu optional - chap nhan partial updates. He so phuc tap +
 * dich vu khong duoc cap nhat qua endpoint nay (dung endpoint service item
 * rieng).
 */
class UpdateExaminationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'chief_complaint' => ['nullable', 'string', 'max:2000'],
            'symptoms' => ['nullable', 'string', 'max:2000'],
            'clinical_findings' => ['nullable', 'string', 'max:2000'],
            'diagnosis' => ['nullable', 'string', 'max:2000'],
            'clinical_notes' => ['nullable', 'string', 'max:2000'],
            'treatment_outcome' => ['nullable', 'string', 'max:2000'],
            'conclusion' => ['nullable', 'string', 'max:2000'],
            'recall_date' => ['nullable', 'date'],
            'recall_note' => ['nullable', 'string', 'max:500'],
            'completion_note' => ['nullable', 'string', 'max:2000'],
            'last_edit_reason' => ['nullable', 'string', 'max:500'],
            'last_updated_at' => ['nullable'],
        ];
    }
}
