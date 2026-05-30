<?php

namespace App\Http\Requests\Examination;

use App\Models\ExaminationServiceItem;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateServiceItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'processing_level' => ['sometimes', 'string', Rule::in(ExaminationServiceItem::ALL_LEVELS)],
            'quantity' => ['sometimes', 'integer', 'min:1', 'max:99'],
            'tooth_codes' => ['sometimes', 'nullable', 'array'],
            'tooth_codes.*' => ['string', 'regex:/^[1-4][1-8]$/'],
            'complexity_reason' => ['sometimes', 'nullable', 'string', 'max:500'],
        ];
    }
}
