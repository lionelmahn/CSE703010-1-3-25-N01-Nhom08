<?php

namespace App\Http\Requests\Payroll;

use Illuminate\Foundation\Http\FormRequest;

class StoreHourlyRateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string,string>
     */
    public function rules(): array
    {
        return [
            'hourly_rate' => 'required|numeric|min:0.01|max:10000000',
            'currency' => 'required|string|in:VND',
            'effective_from' => 'required|date',
            'effective_to' => 'nullable|date|after_or_equal:effective_from',
            'note' => 'nullable|string|max:500',
        ];
    }
}
