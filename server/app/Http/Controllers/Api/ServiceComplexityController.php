<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\BulkStoreServiceComplexityRequest;
use App\Http\Requests\Payroll\StopServiceComplexityRequest;
use App\Http\Requests\Payroll\StoreServiceComplexityRequest;
use App\Services\ServiceComplexityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceComplexityController extends Controller
{
    public function __construct(private readonly ServiceComplexityService $complexities)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only([
            'q', 'service_id', 'group_id', 'processing_level', 'status', 'from', 'to', 'per_page',
        ]);

        return response()->json($this->complexities->list($filters));
    }

    public function options(Request $request): JsonResponse
    {
        return response()->json($this->complexities->options($request->query('q')));
    }

    public function effectiveMatrix(Request $request): JsonResponse
    {
        return response()->json($this->complexities->effectiveMatrix($request->only(['date', 'service_id', 'group_id'])));
    }

    public function store(StoreServiceComplexityRequest $request): JsonResponse
    {
        $record = $this->complexities->create($request->validated(), $request->user());

        return response()->json($record, 201);
    }

    public function bulkStore(BulkStoreServiceComplexityRequest $request): JsonResponse
    {
        $records = $this->complexities->bulkCreate($request->validated()['items'], $request->user());

        return response()->json(['data' => $records], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json($this->complexities->find($id));
    }

    public function stop(StopServiceComplexityRequest $request, int $id): JsonResponse
    {
        $record = $this->complexities->stop($id, $request->validated(), $request->user());

        return response()->json($record);
    }

    public function auditLogs(Request $request, int $id): JsonResponse
    {
        $filters = $request->only(['action', 'actor', 'from', 'to']);

        return response()->json($this->complexities->auditLogs($id, $filters));
    }
}
