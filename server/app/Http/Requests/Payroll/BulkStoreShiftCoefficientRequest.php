<?php

namespace App\Http\Requests\Payroll;

use App\Models\ShiftCoefficient;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkStoreShiftCoefficientRequest extends FormRequest
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
            'items' => 'required|array|min:1|max:50',
            'items.*.name' => 'required|string|max:150',
            'items.*.day_type' => ['required', 'string', Rule::in(ShiftCoefficient::DAY_TYPES)],
            'items.*.shift_type' => ['required', 'string', Rule::in(ShiftCoefficient::SHIFT_TYPES)],
            'items.*.coefficient' => 'required|numeric|min:1|max:2',
            'items.*.effective_from' => 'required|date',
            'items.*.effective_to' => 'nullable|date',
            'items.*.change_reason' => 'nullable|string|max:100',
            'items.*.note' => 'nullable|string|max:500',
        ];
    }
}
