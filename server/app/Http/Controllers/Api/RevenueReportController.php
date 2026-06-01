<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reports\ExportReportRequest;
use App\Http\Requests\Reports\RevenueFilterRequest;
use App\Services\RevenueReportService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RevenueReportController extends Controller
{
    public function __construct(private readonly RevenueReportService $reports) {}

    public function options(): JsonResponse
    {
        return response()->json(['data' => $this->reports->options()]);
    }

    public function summary(RevenueFilterRequest $request): JsonResponse
    {
        return response()->json(['data' => $this->reports->summary($request->filters())]);
    }

    public function trend(RevenueFilterRequest $request): JsonResponse
    {
        return response()->json(['data' => $this->reports->trend($request->filters())]);
    }

    public function byBranch(RevenueFilterRequest $request): JsonResponse
    {
        return response()->json(['data' => $this->reports->byBranch($request->filters())]);
    }

    public function byDoctor(RevenueFilterRequest $request): JsonResponse
    {
        return response()->json(['data' => $this->reports->byDoctor($request->filters())]);
    }

    public function byService(RevenueFilterRequest $request): JsonResponse
    {
        return response()->json(['data' => $this->reports->byService($request->filters())]);
    }

    public function byMethod(RevenueFilterRequest $request): JsonResponse
    {
        return response()->json(['data' => $this->reports->byMethod($request->filters())]);
    }

    public function details(RevenueFilterRequest $request): JsonResponse
    {
        return response()->json(['data' => $this->reports->details($request->filters())]);
    }

    public function debtSummary(RevenueFilterRequest $request): JsonResponse
    {
        return response()->json(['data' => $this->reports->debtSummary($request->filters())]);
    }

    public function debtList(RevenueFilterRequest $request): JsonResponse
    {
        $paginator = $this->reports->debtList($request->filters());

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

    public function export(ExportReportRequest $request): StreamedResponse
    {
        $filters = $request->filters();
        $payload = $this->reports->exportPayload($filters);
        $this->reports->logExport($request->user(), $filters, count($payload['rows']));

        return response()->streamDownload(function () use ($payload) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, $payload['headers']);
            foreach ($payload['rows'] as $row) {
                fputcsv($out, $row);
            }
            fclose($out);
        }, $payload['filename'], [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
