<?php

namespace App\Http\Requests\Reports;

use App\Models\Invoice;
use App\Models\PaymentTransaction;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class RevenueFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'doctor_id' => ['nullable', 'integer', 'exists:users,id'],
            'service_id' => ['nullable', 'integer', 'exists:services,id'],
            'service_group_id' => ['nullable', 'integer', 'exists:service_groups,id'],
            'method' => ['nullable', Rule::in(PaymentTransaction::ALL_METHODS)],
            'invoice_status' => ['nullable', Rule::in(Invoice::ALL_STATUSES)],
            'cashier_id' => ['nullable', 'integer', 'exists:users,id'],
            'granularity' => ['nullable', Rule::in(['day', 'week', 'month', 'year'])],
            'group_by' => ['nullable', Rule::in(['service', 'service_group'])],
            'dimension' => ['nullable', Rule::in([
                'overall',
                'branch',
                'doctor',
                'service',
                'service_group',
                'method',
                'day',
                'invoice_status',
            ])],
            'anchor' => ['nullable', 'string', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            try {
                $from = Carbon::parse($this->input('from'))->startOfDay();
                $to = Carbon::parse($this->input('to'))->endOfDay();
            } catch (\Throwable) {
                return;
            }

            if ($from->diffInDays($to) > 731) {
                $validator->errors()->add('to', 'Khoang thoi gian bao cao khong duoc vuot qua 2 nam.');
            }
        });
    }

    public function filters(): array
    {
        return $this->validated();
    }
}
