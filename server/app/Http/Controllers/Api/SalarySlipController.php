<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\PreviewSalarySlipRequest;
use App\Http\Requests\Payroll\StoreSalarySlipRequest;
use App\Services\SalarySlipService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * UC16 - Lap phieu luong cho mot bac si trong thang.
 */
class SalarySlipController extends Controller
{
    public function __construct(private readonly SalarySlipService $salarySlips)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['staff_id', 'period_year', 'period_month', 'status', 'per_page']);

        return response()->json($this->salarySlips->list($filters));
    }

    public function doctors(Request $request): JsonResponse
    {
        $filters = $request->only(['q', 'branch_id', 'period_month', 'period_year', 'limit']);

        return response()->json([
            'data' => $this->salarySlips->doctorOptions($filters),
        ]);
    }

    public function preview(PreviewSalarySlipRequest $request): JsonResponse
    {
        $data = $request->validated();

        return response()->json([
            'data' => $this->salarySlips->preview(
                (int) $data['staff_id'],
                (int) $data['period_month'],
                (int) $data['period_year'],
                $request->user()
            ),
        ]);
    }

    public function store(StoreSalarySlipRequest $request): JsonResponse
    {
        $slip = $this->salarySlips->createOrCalculate($request->validated(), $request->user());

        return response()->json(['data' => $slip], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(['data' => $this->salarySlips->find($id)]);
    }

    public function auditLogs(Request $request, int $id): JsonResponse
    {
        $filters = $request->only(['action', 'actor', 'from', 'to']);

        return response()->json(['data' => $this->salarySlips->auditLogs($id, $filters)]);
    }

    public function recalculate(Request $request, int $id): JsonResponse
    {
        return response()->json(['data' => $this->salarySlips->recalculate($id, $request->user())]);
    }

    public function finalize(Request $request, int $id): JsonResponse
    {
        return response()->json(['data' => $this->salarySlips->finalize($id, $request->user())]);
    }
}
