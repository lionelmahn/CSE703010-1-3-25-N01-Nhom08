<?php

namespace App\Http\Requests\Billing;

use App\Models\InvoiceAdjustment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdjustInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(InvoiceAdjustment::ALL_TYPES)],
            'amount' => ['required', 'numeric', 'gt:0'],
            'reason' => ['required', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
