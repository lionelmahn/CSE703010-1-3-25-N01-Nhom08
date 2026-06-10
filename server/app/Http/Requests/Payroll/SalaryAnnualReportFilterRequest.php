<?php

namespace App\Http\Requests\Payroll;

use App\Models\SalarySlip;
use App\Services\SalaryAnnualReportService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * UC18 - Bo loc bao cao luong nam cua mot bac si.
 *
 * `staff_id` la nullable o tang validate: voi nguoi xem-moi-bac-si controller
 * se bat buoc (VR1); voi bac si tu xem (self-view) controller tu dien staff_id
 * cua chinh ho (VR9). `year` bat buoc + hop le (VR2/VR3).
 */
class SalaryAnnualReportFilterRequest extends FormRequest
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
            'staff_id' => ['nullable', 'integer', 'exists:staff,id'],
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'status' => ['nullable', Rule::in(array_merge(
                SalarySlip::STATUSES,
                [
                    SalaryAnnualReportService::STATUS_NOT_CREATED,
                    SalaryAnnualReportService::STATUS_NO_SHIFTS,
                    'all',
                ]
            ))],
        ];
    }

    /**
     * @return array<string,mixed>
     */
    public function filters(): array
    {
        return $this->validated();
    }

    public function staffId(): ?int
    {
        $value = $this->validated()['staff_id'] ?? null;

        return $value !== null ? (int) $value : null;
    }

    public function year(): int
    {
        return (int) $this->validated()['year'];
    }
}
