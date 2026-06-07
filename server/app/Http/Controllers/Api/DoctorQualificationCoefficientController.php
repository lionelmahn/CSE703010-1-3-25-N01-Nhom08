<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\BulkStoreDoctorQualificationCoefficientRequest;
use App\Http\Requests\Payroll\StopDoctorQualificationCoefficientRequest;
use App\Http\Requests\Payroll\StoreDoctorQualificationCoefficientRequest;
use App\Services\DoctorQualificationCoefficientService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DoctorQualificationCoefficientController extends Controller
{
    public function __construct(private readonly DoctorQualificationCoefficientService $coefficients)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['q', 'type', 'qualification_type', 'status', 'from', 'to', 'per_page']);

        return response()->json($this->coefficients->list($filters));
    }

    public function options(): JsonResponse
    {
        return response()->json($this->coefficients->options());
    }

    public function effectiveMatrix(Request $request): JsonResponse
    {
        return response()->json($this->coefficients->effectiveMatrix($request->query('date')));
    }

    public function store(StoreDoctorQualificationCoefficientRequest $request): JsonResponse
    {
        $record = $this->coefficients->create($request->validated(), $request->user());

        return response()->json($record, 201);
    }

    public function bulkStore(BulkStoreDoctorQualificationCoefficientRequest $request): JsonResponse
    {
        $records = $this->coefficients->bulkCreate($request->validated()['items'], $request->user());

        return response()->json(['data' => $records], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json($this->coefficients->find($id));
    }

    public function stop(StopDoctorQualificationCoefficientRequest $request, int $id): JsonResponse
    {
        $record = $this->coefficients->stop($id, $request->validated(), $request->user());

        return response()->json($record);
    }

    public function auditLogs(Request $request, int $id): JsonResponse
    {
        $filters = $request->only(['action', 'actor', 'from', 'to']);

        return response()->json($this->coefficients->auditLogs($id, $filters));
    }
}
