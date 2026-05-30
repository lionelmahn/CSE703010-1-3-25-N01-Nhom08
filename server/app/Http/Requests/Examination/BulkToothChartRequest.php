<?php

namespace App\Http\Requests\Examination;

use Illuminate\Foundation\Http\FormRequest;

class BulkToothChartRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'entries' => ['required', 'array', 'max:64'],
            'entries.*.tooth_fdi' => ['required', 'string', 'regex:/^[1-4][1-8]$/'],
            'entries.*.tooth_status_id' => ['nullable', 'integer', 'exists:tooth_statuses,id'],
            'entries.*.note' => ['nullable', 'string', 'max:255'],
        ];
    }
}
