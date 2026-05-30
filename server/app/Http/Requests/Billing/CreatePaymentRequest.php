<?php

namespace App\Http\Requests\Billing;

use App\Models\PaymentTransaction;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreatePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'payments' => ['required', 'array', 'min:1', 'max:5'],
            'payments.*.method' => ['required', Rule::in(PaymentTransaction::ALL_METHODS)],
            'payments.*.amount' => ['required', 'numeric', 'gt:0'],
            'payments.*.reference_code' => ['nullable', 'string', 'max:100'],
            'payments.*.note' => ['nullable', 'string', 'max:500'],
        ];
    }
}
