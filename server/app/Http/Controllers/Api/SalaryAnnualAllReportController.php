<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\ExportSalaryAnnualAllReportRequest;
use App\Http\Requests\Payroll\SalaryAnnualAllReportFilterRequest;
use App\Services\SalaryAnnualAllReportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer as XlsxWriter;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * UC19 - Bao cao tien luong tat ca bac si trong mot nam (doc tu UC16).
 *
 * Bao cao tong hop cap cao nhat: drill-down sang UC18 (click bac si), UC17
 * (click thang), UC16 (click o B.si+thang). Chi Ke toan/Admin xem (bac si KHONG
 * duoc xem) - quyen kiem o middleware nen controller chi nhan/tra du lieu.
 */
class SalaryAnnualAllReportController extends Controller
{
    public function __construct(private readonly SalaryAnnualAllReportService $reports)
    {
    }

    public function options(): JsonResponse
    {
        return response()->json(['data' => $this->reports->options()]);
    }

    public function summary(SalaryAnnualAllReportFilterRequest $request): JsonResponse
    {
        $year = $request->year();
        $this->reports->logView($request->user(), $year);

        return response()->json([
            'data' => $this->reports->summary($year, $request->filters()),
        ]);
    }

    public function doctors(SalaryAnnualAllReportFilterRequest $request): JsonResponse
    {
        $result = $this->reports->doctorRows($request->year(), $request->filters());

        return response()->json([
            'data' => $result['data'],
            'meta' => $result['meta'],
        ]);
    }

    public function months(SalaryAnnualAllReportFilterRequest $request): JsonResponse
    {
        return response()->json([
            'data' => $this->reports->monthRows($request->year(), $request->filters()),
        ]);
    }

    public function matrix(SalaryAnnualAllReportFilterRequest $request): JsonResponse
    {
        $result = $this->reports->matrix($request->year(), $request->filters());

        return response()->json([
            'data' => [
                'doctors' => $result['doctors'],
                'cells' => $result['cells'],
                'month_totals' => $result['month_totals'],
            ],
            'meta' => $result['meta'],
        ]);
    }

    public function export(ExportSalaryAnnualAllReportRequest $request): Response|StreamedResponse|BinaryFileResponse
    {
        $year = $request->year();
        $filters = $request->filters();
        $format = $filters['format'];

        $payload = $this->reports->exportPayload($year, $filters);
        $this->reports->logExport($request->user(), $year, $filters, $format, count($payload['rows']));

        return match ($format) {
            'xlsx' => $this->downloadXlsx($payload),
            'pdf' => $this->downloadPdf($payload),
            default => $this->downloadCsv($payload),
        };
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
        $tmp = tempnam(sys_get_temp_dir(), 'salary_annual_all_xlsx');

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
        $pdf = Pdf::loadView('reports.salary-annual-all', [
            'year' => $payload['year'],
            'view' => $payload['view'],
            'summary' => $payload['summary'],
            'headers' => $payload['headers'],
            'rows' => $payload['rows'],
        ])->setPaper('a4', 'landscape');

        return $pdf->download($payload['basename'].'.pdf');
    }
}
