<?php

namespace App\Http\Requests\Payroll;

use Illuminate\Foundation\Http\FormRequest;

class StopShiftCoefficientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string,string>
     */
    public function rules(): array
    {
        return [
            'effective_to' => 'nullable|date',
            'reason' => 'required|string|max:100',
            'reason_detail' => 'nullable|string|max:255',
        ];
    }
}
