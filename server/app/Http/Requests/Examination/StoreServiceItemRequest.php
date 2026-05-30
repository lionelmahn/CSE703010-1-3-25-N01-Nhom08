<?php

namespace App\Http\Requests\Examination;

use App\Models\ExaminationServiceItem;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreServiceItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'service_id' => ['required', 'integer', 'exists:services,id'],
            'processing_level' => ['nullable', 'string', Rule::in(ExaminationServiceItem::ALL_LEVELS)],
            'quantity' => ['nullable', 'integer', 'min:1', 'max:99'],
            'tooth_codes' => ['nullable', 'array'],
            'tooth_codes.*' => ['string', 'regex:/^[1-4][1-8]$/'],
            'complexity_reason' => ['nullable', 'string', 'max:500'],
        ];
    }
}
