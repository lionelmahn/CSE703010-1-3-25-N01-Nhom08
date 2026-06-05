<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\BulkStoreShiftCoefficientRequest;
use App\Http\Requests\Payroll\StopShiftCoefficientRequest;
use App\Http\Requests\Payroll\StoreShiftCoefficientRequest;
use App\Services\ShiftCoefficientService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShiftCoefficientController extends Controller
{
    public function __construct(private readonly ShiftCoefficientService $shiftCoefficients)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['status', 'day_type', 'shift_type', 'from', 'to', 'per_page']);

        return response()->json($this->shiftCoefficients->list($filters));
    }

    public function effectiveMatrix(Request $request): JsonResponse
    {
        return response()->json($this->shiftCoefficients->effectiveMatrix($request->query('date')));
    }

    public function store(StoreShiftCoefficientRequest $request): JsonResponse
    {
        $record = $this->shiftCoefficients->create($request->validated(), $request->user());

        return response()->json($record, 201);
    }

    public function bulkStore(BulkStoreShiftCoefficientRequest $request): JsonResponse
    {
        $records = $this->shiftCoefficients->bulkCreate($request->validated()['items'], $request->user());

        return response()->json(['data' => $records], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json($this->shiftCoefficients->find($id));
    }

    public function stop(StopShiftCoefficientRequest $request, int $id): JsonResponse
    {
        $record = $this->shiftCoefficients->stop($id, $request->validated(), $request->user());

        return response()->json($record);
    }

    public function auditLogs(Request $request, int $id): JsonResponse
    {
        $filters = $request->only(['action', 'actor', 'from', 'to']);

        return response()->json($this->shiftCoefficients->auditLogs($id, $filters));
    }
}
