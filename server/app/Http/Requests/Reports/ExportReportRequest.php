<?php

namespace App\Http\Requests\Reports;

use Illuminate\Validation\Rule;

class ExportReportRequest extends RevenueFilterRequest
{
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'type' => ['required', Rule::in([
                'overview',
                'by-branch',
                'by-doctor',
                'by-service',
                'debt',
                'invoice-details',
                'payment-details',
            ])],
            'format' => ['required', Rule::in(['csv', 'xlsx'])],
        ]);
    }
}
