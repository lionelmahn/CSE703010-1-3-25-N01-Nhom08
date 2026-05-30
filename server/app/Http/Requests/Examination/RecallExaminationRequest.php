<?php

namespace App\Http\Requests\Examination;

use Illuminate\Foundation\Http\FormRequest;

class RecallExaminationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'recall_date' => ['nullable', 'date', 'after_or_equal:today'],
            'recall_note' => ['nullable', 'string', 'max:500'],
        ];
    }
}
