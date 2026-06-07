<?php

namespace App\Http\Requests\Payroll;

use App\Models\DoctorQualificationCoefficient;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkStoreDoctorQualificationCoefficientRequest extends FormRequest
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
            'items' => ['required', 'array', 'min:1', 'max:50'],
            'items.*.qualification_code' => ['required', 'string', Rule::in(DoctorQualificationCoefficient::qualificationCodes())],
            'items.*.qualification_type' => ['required', 'string', Rule::in(DoctorQualificationCoefficient::TYPES)],
            'items.*.priority' => ['nullable', 'integer', 'min:1', 'max:99'],
            'items.*.coefficient' => ['required', 'numeric', 'min:1', 'max:3'],
            'items.*.effective_from' => ['required', 'date'],
            'items.*.effective_to' => ['nullable', 'date'],
            'items.*.change_reason' => ['nullable', 'string', 'max:100'],
            'items.*.note' => ['nullable', 'string', 'max:500'],
        ];
    }
}
