<?php

namespace App\Http\Requests\Payroll;

use Illuminate\Foundation\Http\FormRequest;

/**
 * UC17 - Lap/tinh lai phieu luong hang loat cho cac bac si da chon (A5).
 */
class BulkSalarySlipRequest extends FormRequest
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
            'staff_ids' => ['required', 'array', 'min:1', 'max:200'],
            'staff_ids.*' => ['integer', 'distinct', 'exists:staff,id'],
            'period_month' => ['required', 'integer', 'min:1', 'max:12'],
            'period_year' => ['required', 'integer', 'min:2000', 'max:2100'],
        ];
    }
}
