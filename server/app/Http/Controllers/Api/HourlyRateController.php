<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\StopHourlyRateRequest;
use App\Http\Requests\Payroll\StoreHourlyRateRequest;
use App\Services\HourlyRateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HourlyRateController extends Controller
{
    public function __construct(private readonly HourlyRateService $hourlyRates)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['status', 'from', 'to', 'per_page']);

        return response()->json($this->hourlyRates->list($filters));
    }

    public function current(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->hourlyRates->current($request->query('date')),
        ]);
    }

    public function store(StoreHourlyRateRequest $request): JsonResponse
    {
        $record = $this->hourlyRates->create($request->validated(), $request->user());

        return response()->json($record, 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json($this->hourlyRates->find($id));
    }

    public function stop(StopHourlyRateRequest $request, int $id): JsonResponse
    {
        $record = $this->hourlyRates->stop($id, $request->validated(), $request->user());

        return response()->json($record);
    }

    public function auditLogs(Request $request, int $id): JsonResponse
    {
        $filters = $request->only(['action', 'actor', 'from', 'to']);

        return response()->json($this->hourlyRates->auditLogs($id, $filters));
    }
}
