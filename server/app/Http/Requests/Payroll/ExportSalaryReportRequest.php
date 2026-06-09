<?php

namespace App\Http\Requests\Payroll;

use Illuminate\Validation\Rule;

/**
 * UC17 - Yeu cau xuat bao cao luong thang (csv/xlsx/pdf).
 */
class ExportSalaryReportRequest extends SalaryReportFilterRequest
{
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'format' => ['required', Rule::in(['csv', 'xlsx', 'pdf'])],
        ]);
    }
}
