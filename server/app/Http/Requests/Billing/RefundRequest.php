<?php

namespace App\Http\Requests\Billing;

use App\Models\PaymentTransaction;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RefundRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'method' => ['required', Rule::in(PaymentTransaction::ALL_METHODS)],
            'amount' => ['required', 'numeric', 'gt:0'],
            'reason' => ['required', 'string', 'max:255'],
            'reference_code' => ['nullable', 'string', 'max:100'],
            'account_info' => ['nullable', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
