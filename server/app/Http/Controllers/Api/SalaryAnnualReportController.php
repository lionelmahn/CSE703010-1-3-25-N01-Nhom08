<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\ExportSalaryAnnualReportRequest;
use App\Http\Requests\Payroll\SalaryAnnualReportFilterRequest;
use App\Services\SalaryAnnualReportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer as XlsxWriter;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * UC18 - Bao cao tien luong cua mot bac si trong mot nam (doc tu UC16).
 *
 * Scoping theo tung bac si xu ly tai day (VR9 khong bieu dien duoc o middleware):
 * nguoi co quyen `...view` xem moi bac si; bac si chi co `...view_own` chi xem
 * chinh minh.
 */
class SalaryAnnualReportController extends Controller
{
    public function __construct(private readonly SalaryAnnualReportService $reports)
    {
    }

    public function options(): JsonResponse
    {
        return response()->json(['data' => $this->reports->options()]);
    }

    public function summary(SalaryAnnualReportFilterRequest $request): JsonResponse
    {
        $staffId = $this->resolveStaffId($request);
        $year = $request->year();

        $this->reports->logView($request->user(), $staffId, $year);

        return response()->json([
            'data' => $this->reports->summary($staffId, $year, $request->filters()),
        ]);
    }

    public function months(SalaryAnnualReportFilterRequest $request): JsonResponse
    {
        $staffId = $this->resolveStaffId($request);

        return response()->json([
            'data' => $this->reports->months($staffId, $request->year(), $request->filters()),
        ]);
    }

    public function export(ExportSalaryAnnualReportRequest $request): Response|StreamedResponse|BinaryFileResponse
    {
        $staffId = $this->resolveStaffId($request);
        $this->authorizeExport($request, $staffId);

        $year = $request->year();
        $filters = $request->filters();
        $format = $filters['format'];

        $payload = $this->reports->exportPayload($staffId, $year, $filters);
        $this->reports->logExport($request->user(), $staffId, $year, $filters, $format, count($payload['rows']));

        return match ($format) {
            'xlsx' => $this->downloadXlsx($payload),
            'pdf' => $this->downloadPdf($payload),
            default => $this->downloadCsv($payload),
        };
    }

    /**
     * Phan giai bac si duoc phep xem (VR1/VR9/E1).
     */
    private function resolveStaffId(SalaryAnnualReportFilterRequest $request): int
    {
        $user = $request->user();
        $requested = $request->staffId();
        $canViewAll = $user->hasRole('admin') || $user->hasPermissionTo('payroll.salary_report_annual.view');

        if ($canViewAll) {
            // VR1 - bat buoc chon bac si.
            if (! $requested) {
                abort(response()->json(['message' => 'Vui lòng chọn bác sĩ để xem báo cáo.'], 422));
            }
            $staffId = $requested;
        } else {
            // Self-view (VR9) - bac si chi xem cua chinh minh.
            $ownStaffId = $user->staff?->id;
            if (! $ownStaffId) {
                abort(response()->json(['message' => 'Tài khoản không gắn với hồ sơ bác sĩ.'], 403));
            }
            if ($requested && $requested !== $ownStaffId) {
                abort(response()->json(['message' => 'Bạn chỉ được xem báo cáo lương của chính mình.'], 403));
            }
            $staffId = $ownStaffId;
        }

        // E1 - bac si phai ton tai.
        if (! $this->reports->findDoctor($staffId)) {
            abort(response()->json(['message' => 'Không tìm thấy bác sĩ.'], 404));
        }

        return $staffId;
    }

    /**
     * Kiem tra quyen xuat bao cao (VR7).
     */
    private function authorizeExport(SalaryAnnualReportFilterRequest $request, int $staffId): void
    {
        $user = $request->user();

        if ($user->hasRole('admin') || $user->hasPermissionTo('payroll.salary_report_annual.export')) {
            return;
        }
        if ($user->hasPermissionTo('payroll.salary_report_annual.export_own') && $user->staff?->id === $staffId) {
            return;
        }

        abort(response()->json(['message' => 'Bạn không có quyền xuất báo cáo này.'], 403));
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
        $tmp = tempnam(sys_get_temp_dir(), 'salary_annual_xlsx');

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
        $pdf = Pdf::loadView('reports.salary-annual', [
            'year' => $payload['year'],
            'doctor' => $payload['doctor'],
            'summary' => $payload['summary'],
            'headers' => $payload['headers'],
            'rows' => $payload['rows'],
        ])->setPaper('a4', 'landscape');

        return $pdf->download($payload['basename'].'.pdf');
    }
}
