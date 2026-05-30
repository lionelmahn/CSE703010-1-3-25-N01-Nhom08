<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BillingQueueService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * UC13 - REST API cho hang doi thanh toan + dashboard + audit timeline.
 *
 * Endpoints o day chi xuat thong tin tong hop. Detail invoice nam o
 * InvoiceController.
 */
class BillingController extends Controller
{
    public function __construct(private readonly BillingQueueService $queue) {}

    public function queue(Request $request): JsonResponse
    {
        $paginator = $this->queue->queue($request->only([
            'q', 'tab', 'from', 'to', 'per_page', 'page', 'examinationId',
        ]), $request->user());

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
            'counts' => $this->queue->tabCounts($request->user()),
        ]);
    }

    public function dashboard(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->queue->dashboard($request->user())]);
    }

    public function auditLogs(Request $request): JsonResponse
    {
        $paginator = $this->queue->auditLogs($request->only([
            'from', 'to', 'action', 'actor_id', 'per_page', 'page',
        ]));

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }
}
