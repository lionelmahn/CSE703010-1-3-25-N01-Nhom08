<?php

namespace App\Http\Requests\Payroll;

use App\Models\SalarySlip;
use App\Services\SalaryReportService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * UC17 - Bo loc bao cao luong thang (VR1/VR2 - bat buoc thang/nam hop le).
 */
class SalaryReportFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string,mixed>
     */
    public function rules(): array
    {
        return [
            'period_month' => ['required', 'integer', 'min:1', 'max:12'],
            'period_year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'qualification_code' => ['nullable', 'string', 'exists:qualification_catalogs,code'],
            'status' => ['nullable', Rule::in(array_merge(
                SalarySlip::STATUSES,
                [SalaryReportService::STATUS_NOT_CREATED, 'all']
            ))],
            'q' => ['nullable', 'string', 'max:100'],
            'only_finalized' => ['nullable', 'boolean'],
            'only_missing' => ['nullable', 'boolean'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    /**
     * @return array<string,mixed>
     */
    public function filters(): array
    {
        return $this->validated();
    }

    public function periodMonth(): int
    {
        return (int) $this->validated()['period_month'];
    }

    public function periodYear(): int
    {
        return (int) $this->validated()['period_year'];
    }
}
