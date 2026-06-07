<?php

namespace App\Http\Requests\Payroll;

use App\Models\DoctorQualificationCoefficient;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDoctorQualificationCoefficientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string,mixed>
     */
    public function rules(): array
    {
        return [
            'qualification_code' => ['required', 'string', Rule::in(DoctorQualificationCoefficient::qualificationCodes())],
            'qualification_type' => ['required', 'string', Rule::in(DoctorQualificationCoefficient::TYPES)],
            'priority' => ['nullable', 'integer', 'min:1', 'max:99'],
            'coefficient' => ['required', 'numeric', 'min:1', 'max:3'],
            'effective_from' => ['required', 'date'],
            'effective_to' => ['nullable', 'date', 'after_or_equal:effective_from'],
            'change_reason' => ['nullable', 'string', 'max:100'],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }
}
