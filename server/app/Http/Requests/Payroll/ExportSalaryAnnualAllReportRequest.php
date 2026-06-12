<?php

namespace App\Http\Requests\Payroll;

use Illuminate\Validation\Rule;

/**
 * UC19 - Yeu cau xuat bao cao luong nam toan bo bac si (csv/xlsx/pdf).
 */
class ExportSalaryAnnualAllReportRequest extends SalaryAnnualAllReportFilterRequest
{
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'format' => ['required', Rule::in(['csv', 'xlsx', 'pdf'])],
        ]);
    }
}
