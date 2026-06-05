<?php

namespace App\Http\Requests\Payroll;

use App\Models\ShiftCoefficient;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreShiftCoefficientRequest extends FormRequest
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
            'name' => 'required|string|max:150',
            'day_type' => ['required', 'string', Rule::in(ShiftCoefficient::DAY_TYPES)],
            'shift_type' => ['required', 'string', Rule::in(ShiftCoefficient::SHIFT_TYPES)],
            'coefficient' => 'required|numeric|min:1|max:2',
            'effective_from' => 'required|date',
            'effective_to' => 'nullable|date|after_or_equal:effective_from',
            'change_reason' => 'nullable|string|max:100',
            'note' => 'nullable|string|max:500',
        ];
    }
}
