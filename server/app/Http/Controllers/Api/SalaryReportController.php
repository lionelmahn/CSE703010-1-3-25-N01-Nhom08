<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\BulkSalarySlipRequest;
use App\Http\Requests\Payroll\ExportSalaryReportRequest;
use App\Http\Requests\Payroll\SalaryReportFilterRequest;
use App\Services\SalaryReportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer as XlsxWriter;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * UC17 - Bao cao tien luong tat ca bac si trong mot thang.
 */
class SalaryReportController extends Controller
{
    public function __construct(private readonly SalaryReportService $reports)
    {
    }

    public function options(): JsonResponse
    {
        return response()->json(['data' => $this->reports->options()]);
    }

    public function summary(SalaryReportFilterRequest $request): JsonResponse
    {
        return response()->json([
            'data' => $this->reports->summary($request->periodMonth(), $request->periodYear(), $request->filters()),
        ]);
    }

    public function rows(SalaryReportFilterRequest $request): JsonResponse
    {
        return response()->json(
            $this->reports->rows($request->periodMonth(), $request->periodYear(), $request->filters())
        );
    }

    public function export(ExportSalaryReportRequest $request): Response|StreamedResponse|BinaryFileResponse
    {
        $month = $request->periodMonth();
        $year = $request->periodYear();
        $filters = $request->filters();
        $format = $filters['format'];

        $payload = $this->reports->exportPayload($month, $year, $filters);
        $this->reports->logExport($request->user(), $month, $year, $filters, $format, count($payload['rows']));

        return match ($format) {
            'xlsx' => $this->downloadXlsx($payload),
            'pdf' => $this->downloadPdf($payload),
            default => $this->downloadCsv($payload),
        };
    }

    public function bulkCreate(BulkSalarySlipRequest $request): JsonResponse
    {
        $data = $request->validated();

        return response()->json([
            'data' => $this->reports->bulkCreate(
                $data['staff_ids'],
                (int) $data['period_month'],
                (int) $data['period_year'],
                $request->user()
            ),
        ]);
    }

    public function bulkRecalculate(BulkSalarySlipRequest $request): JsonResponse
    {
        $data = $request->validated();

        return response()->json([
            'data' => $this->reports->bulkRecalculate(
                $data['staff_ids'],
                (int) $data['period_month'],
                (int) $data['period_year'],
                $request->user()
            ),
        ]);
    }

    /**
     * @param  array<string,mixed>  $payload
     */
    private function downloadCsv(array $payload): StreamedResponse
    {
        return response()->streamDownload(function () use ($payload) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, $payload['headers']);
            foreach ($payload['rows'] as $row) {
                fputcsv($out, $row);
            }
            fclose($out);
        }, $payload['basename'].'.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * @param  array<string,mixed>  $payload
     */
    private function downloadXlsx(array $payload): BinaryFileResponse
    {
        $tmp = tempnam(sys_get_temp_dir(), 'salary_xlsx');

        $writer = new XlsxWriter();
        $writer->openToFile($tmp);
        $writer->addRow(Row::fromValues($payload['headers']));
        foreach ($payload['rows'] as $row) {
            $writer->addRow(Row::fromValues($row));
        }
        $writer->close();

        return response()
            ->download($tmp, $payload['basename'].'.xlsx', [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ])
            ->deleteFileAfterSend(true);
    }

    /**
     * @param  array<string,mixed>  $payload
     */
    private function downloadPdf(array $payload): Response
    {
        $pdf = Pdf::loadView('reports.salary-monthly', [
            'period' => $payload['period'],
            'summary' => $payload['summary'],
            'headers' => $payload['headers'],
            'rows' => $payload['rows'],
        ])->setPaper('a4', 'landscape');

        return $pdf->download($payload['basename'].'.pdf');
    }
}
