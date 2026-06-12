<?php

namespace App\Http\Requests\Payroll;

use App\Models\SalarySlip;
use App\Services\SalaryAnnualAllReportService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * UC19 - Bo loc bao cao luong nam toan bo bac si.
 *
 * `year` bat buoc + hop le (DR227 - khong xem duoc neu thieu nam). Cac bo loc
 * chi nhanh/hoc ham/trang thai/tim kiem deu khong bat buoc (DR228-230).
 */
class SalaryAnnualAllReportFilterRequest extends FormRequest
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
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'qualification_code' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', Rule::in(array_merge(
                SalarySlip::STATUSES,
                [
                    SalaryAnnualAllReportService::STATUS_NOT_CREATED,
                    SalaryAnnualAllReportService::STATUS_NO_SHIFTS,
                    'all',
                ]
            ))],
            'q' => ['nullable', 'string', 'max:100'],
            'view' => ['nullable', Rule::in(['doctor', 'month', 'matrix'])],
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

    public function year(): int
    {
        return (int) $this->validated()['year'];
    }
}
