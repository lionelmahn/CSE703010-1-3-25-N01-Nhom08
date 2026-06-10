<?php

namespace App\Http\Requests\Payroll;

use Illuminate\Validation\Rule;

/**
 * UC18 - Yeu cau xuat bao cao luong nam (csv/xlsx/pdf).
 */
class ExportSalaryAnnualReportRequest extends SalaryAnnualReportFilterRequest
{
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'format' => ['required', Rule::in(['csv', 'xlsx', 'pdf'])],
        ]);
    }
}
