<?php

namespace App\Http\Requests\Payroll;

use App\Models\ExaminationServiceItem;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkStoreServiceComplexityRequest extends FormRequest
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
            'items' => ['required', 'array', 'min:1', 'max:200'],
            'items.*.service_id' => ['required', 'integer', 'exists:services,id'],
            'items.*.processing_level' => ['required', 'string', Rule::in(ExaminationServiceItem::ALL_LEVELS)],
            'items.*.coefficient' => ['required', 'numeric', 'min:0', 'max:0.5'],
            'items.*.effective_from' => ['required', 'date'],
            'items.*.effective_to' => ['nullable', 'date'],
            'items.*.change_reason' => ['nullable', 'string', 'max:100'],
            'items.*.note' => ['nullable', 'string', 'max:500'],
        ];
    }
}
