<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Invoice;
use App\Models\InvoiceAdjustment;
use App\Models\PaymentTransaction;
use App\Models\Service;
use App\Models\ServiceGroup;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class RevenueReportService
{
    public function __construct(private readonly AuditLogService $auditLog) {}

    public function options(): array
    {
        return [
            'branches' => Branch::query()
                ->where('status', 'active')
                ->orderBy('name')
                ->get(['id', 'code', 'name']),
            'doctors' => User::query()
                ->whereHas('roles', fn ($q) => $q->where('slug', 'bac_si'))
                ->orderBy('name')
                ->get(['id', 'name', 'email']),
            'cashiers' => User::query()
                ->whereHas('roles', fn ($q) => $q->whereIn('slug', ['admin', 'le_tan', 'ke_toan']))
                ->orderBy('name')
                ->get(['id', 'name', 'email']),
            'service_groups' => ServiceGroup::query()
                ->orderBy('display_order')
                ->orderBy('name')
                ->get(['id', 'code', 'name']),
            'services' => Service::query()
                ->orderBy('name')
                ->get(['id', 'service_code', 'name', 'service_group_id']),
            'methods' => [
                ['value' => PaymentTransaction::METHOD_CASH, 'label' => 'Tiền mặt'],
                ['value' => PaymentTransaction::METHOD_BANK_TRANSFER, 'label' => 'Chuyển khoản'],
                ['value' => PaymentTransaction::METHOD_CARD, 'label' => 'Thẻ ngân hàng'],
            ],
            'invoice_statuses' => [
                ['value' => Invoice::STATUS_PENDING, 'label' => 'Chờ thanh toán'],
                ['value' => Invoice::STATUS_PARTIAL, 'label' => 'Thanh toán một phần'],
                ['value' => Invoice::STATUS_PAID, 'label' => 'Đã thanh toán'],
                ['value' => Invoice::STATUS_REFUNDED, 'label' => 'Đã hoàn tiền'],
                ['value' => Invoice::STATUS_CANCELLED, 'label' => 'Đã hủy'],
            ],
        ];
    }

    public function summary(array $filters): array
    {
        $period = $this->period($filters);
        $current = $this->summaryForPeriod($filters, $period);
        $previousPeriod = $this->previousPeriod($period);
        $previous = $this->summaryForPeriod($filters, $previousPeriod);

        $current['comparison'] = [
            'previous_total_revenue' => $previous['total_revenue'],
            'revenue_delta_percent' => $this->deltaPercent($current['total_revenue'], $previous['total_revenue']),
            'previous_invoice_count' => $previous['invoice_count'],
            'invoice_delta_percent' => $this->deltaPercent($current['invoice_count'], $previous['invoice_count']),
        ];

        return $current;
    }

    public function trend(array $filters): array
    {
        $period = $this->period($filters);
        $granularity = $filters['granularity'] ?? 'day';
        $buckets = $this->emptyBuckets($period, $granularity);

        $payments = $this->basePaymentQuery($filters, $period)
            ->select('pt.paid_at', 'pt.type', 'pt.amount')
            ->orderBy('pt.paid_at')
            ->get();

        foreach ($payments as $payment) {
            $key = $this->bucketKey(Carbon::parse($payment->paid_at), $granularity);
            if (! isset($buckets[$key])) {
                continue;
            }
            $amount = (float) $payment->amount;
            $buckets[$key]['revenue'] += $payment->type === PaymentTransaction::TYPE_REFUND ? -$amount : $amount;
            if ($payment->type === PaymentTransaction::TYPE_REFUND) {
                $buckets[$key]['refunds'] += $amount;
            } else {
                $buckets[$key]['gross_payments'] += $amount;
            }
        }

        $adjustments = $this->baseAdjustmentQuery($filters, $period)
            ->select('ia.created_at', 'ia.amount')
            ->orderBy('ia.created_at')
            ->get();

        foreach ($adjustments as $adjustment) {
            $key = $this->bucketKey(Carbon::parse($adjustment->created_at), $granularity);
            if (! isset($buckets[$key])) {
                continue;
            }
            $amount = (float) $adjustment->amount;
            $buckets[$key]['revenue'] -= $amount;
            $buckets[$key]['negative_adjustments'] += $amount;
        }

        return [
            'granularity' => $granularity,
            'series' => array_values($buckets),
        ];
    }

    public function byMethod(array $filters): array
    {
        $rows = $this->basePaymentQuery($filters)
            ->selectRaw('
                pt.method,
                SUM(CASE WHEN pt.type = ? THEN pt.amount ELSE -pt.amount END) as revenue,
                SUM(CASE WHEN pt.type = ? THEN pt.amount ELSE 0 END) as gross_payments,
                SUM(CASE WHEN pt.type = ? THEN pt.amount ELSE 0 END) as refunds,
                COUNT(DISTINCT i.id) as invoice_count,
                COUNT(pt.id) as transaction_count
            ', [
                PaymentTransaction::TYPE_PAYMENT,
                PaymentTransaction::TYPE_PAYMENT,
                PaymentTransaction::TYPE_REFUND,
            ])
            ->groupBy('pt.method')
            ->get();

        $total = (float) $rows->sum(fn ($row) => (float) $row->revenue);

        return [
            'total' => $total,
            'data' => $rows
                ->map(fn ($row) => [
                    'id' => $row->method,
                    'method' => $row->method,
                    'label' => $this->methodLabel($row->method),
                    'revenue' => round((float) $row->revenue, 2),
                    'gross_payments' => round((float) $row->gross_payments, 2),
                    'refunds' => round((float) $row->refunds, 2),
                    'invoice_count' => (int) $row->invoice_count,
                    'transaction_count' => (int) $row->transaction_count,
                    'percentage' => $this->percentage((float) $row->revenue, $total),
                ])
                ->sortByDesc('revenue')
                ->values()
                ->all(),
        ];
    }

    public function byBranch(array $filters): array
    {
        $payments = $this->basePaymentQuery($filters)
            ->leftJoin('branches as b', 'b.id', '=', 'i.branch_id')
            ->selectRaw("
                i.branch_id as id,
                COALESCE(b.name, 'Không xác định') as name,
                COALESCE(b.code, '') as code,
                SUM(CASE WHEN pt.type = ? THEN pt.amount ELSE -pt.amount END) as revenue,
                SUM(CASE WHEN pt.type = ? THEN pt.amount ELSE 0 END) as gross_payments,
                SUM(CASE WHEN pt.type = ? THEN pt.amount ELSE 0 END) as refunds,
                COUNT(DISTINCT i.id) as invoice_count,
                COUNT(pt.id) as transaction_count
            ", [
                PaymentTransaction::TYPE_PAYMENT,
                PaymentTransaction::TYPE_PAYMENT,
                PaymentTransaction::TYPE_REFUND,
            ])
            ->groupBy('i.branch_id', 'b.name', 'b.code')
            ->get();

        $adjustments = $this->baseAdjustmentQuery($filters)
            ->leftJoin('branches as b', 'b.id', '=', 'i.branch_id')
            ->selectRaw("
                i.branch_id as id,
                COALESCE(b.name, 'Không xác định') as name,
                COALESCE(b.code, '') as code,
                SUM(ia.amount) as negative_adjustments
            ")
            ->groupBy('i.branch_id', 'b.name', 'b.code')
            ->get();

        return $this->mergeDimensionRows($payments, $adjustments);
    }

    public function byDoctor(array $filters): array
    {
        $payments = $this->basePaymentQuery($filters)
            ->leftJoin('users as d', 'd.id', '=', 'i.doctor_id')
            ->selectRaw("
                i.doctor_id as id,
                COALESCE(d.name, 'Chưa gán bác sĩ') as name,
                '' as code,
                SUM(CASE WHEN pt.type = ? THEN pt.amount ELSE -pt.amount END) as revenue,
                SUM(CASE WHEN pt.type = ? THEN pt.amount ELSE 0 END) as gross_payments,
                SUM(CASE WHEN pt.type = ? THEN pt.amount ELSE 0 END) as refunds,
                COUNT(DISTINCT i.id) as invoice_count,
                COUNT(pt.id) as transaction_count
            ", [
                PaymentTransaction::TYPE_PAYMENT,
                PaymentTransaction::TYPE_PAYMENT,
                PaymentTransaction::TYPE_REFUND,
            ])
            ->groupBy('i.doctor_id', 'd.name')
            ->get();

        $adjustments = $this->baseAdjustmentQuery($filters)
            ->leftJoin('users as d', 'd.id', '=', 'i.doctor_id')
            ->selectRaw("
                i.doctor_id as id,
                COALESCE(d.name, 'Chưa gán bác sĩ') as name,
                '' as code,
                SUM(ia.amount) as negative_adjustments
            ")
            ->groupBy('i.doctor_id', 'd.name')
            ->get();

        return $this->mergeDimensionRows($payments, $adjustments);
    }

    public function byService(array $filters): array
    {
        $groupBy = $filters['group_by'] ?? 'service';
        $isGroup = $groupBy === 'service_group';
        $idExpr = $isGroup ? 'sg.id' : 's.id';
        $nameExpr = $isGroup ? "COALESCE(sg.name, 'Không xác định')" : 'COALESCE(s.name, ii.service_name_snapshot)';
        $codeExpr = $isGroup ? "COALESCE(sg.code, '')" : 'COALESCE(s.service_code, ii.service_code_snapshot)';

        $itemTotals = DB::table('invoice_items')
            ->selectRaw('invoice_id, SUM(line_total) as total_line')
            ->groupBy('invoice_id');

        $payments = $this->basePaymentQuery($filters)
            ->join('invoice_items as ii', 'ii.invoice_id', '=', 'i.id')
            ->joinSub($itemTotals, 'it', fn ($join) => $join->on('it.invoice_id', '=', 'i.id'))
            ->leftJoin('services as s', 's.id', '=', 'ii.service_id')
            ->leftJoin('service_groups as sg', 'sg.id', '=', 's.service_group_id');
        $this->applyItemFilters($payments, $filters);

        $paymentRows = $payments
            ->selectRaw("
                {$idExpr} as id,
                {$nameExpr} as name,
                {$codeExpr} as code,
                SUM(
                    CASE WHEN it.total_line > 0
                        THEN (CASE WHEN pt.type = ? THEN pt.amount ELSE -pt.amount END) * ii.line_total / it.total_line
                        ELSE 0
                    END
                ) as revenue,
                SUM(
                    CASE WHEN it.total_line > 0 AND pt.type = ?
                        THEN pt.amount * ii.line_total / it.total_line
                        ELSE 0
                    END
                ) as gross_payments,
                SUM(
                    CASE WHEN it.total_line > 0 AND pt.type = ?
                        THEN pt.amount * ii.line_total / it.total_line
                        ELSE 0
                    END
                ) as refunds,
                COUNT(DISTINCT i.id) as invoice_count,
                COUNT(DISTINCT ii.id) as item_count
            ", [
                PaymentTransaction::TYPE_PAYMENT,
                PaymentTransaction::TYPE_PAYMENT,
                PaymentTransaction::TYPE_REFUND,
            ])
            ->groupByRaw("{$idExpr}, {$nameExpr}, {$codeExpr}")
            ->get();

        $adjustments = $this->baseAdjustmentQuery($filters)
            ->join('invoice_items as ii', 'ii.invoice_id', '=', 'i.id')
            ->joinSub($itemTotals, 'it', fn ($join) => $join->on('it.invoice_id', '=', 'i.id'))
            ->leftJoin('services as s', 's.id', '=', 'ii.service_id')
            ->leftJoin('service_groups as sg', 'sg.id', '=', 's.service_group_id');
        $this->applyItemFilters($adjustments, $filters);

        $adjustmentRows = $adjustments
            ->selectRaw("
                {$idExpr} as id,
                {$nameExpr} as name,
                {$codeExpr} as code,
                SUM(CASE WHEN it.total_line > 0 THEN ia.amount * ii.line_total / it.total_line ELSE 0 END) as negative_adjustments
            ")
            ->groupByRaw("{$idExpr}, {$nameExpr}, {$codeExpr}")
            ->get();

        return $this->mergeDimensionRows($paymentRows, $adjustmentRows);
    }

    public function details(array $filters): array
    {
        $dimension = $filters['dimension'] ?? 'overall';
        $anchor = $filters['anchor'] ?? null;
        $perPage = max(1, min(100, (int) ($filters['per_page'] ?? 20)));

        $paymentQuery = $this->basePaymentQuery($filters);
        $this->applyDimensionFilter($paymentQuery, $dimension, $anchor, 'payment');

        $adjustmentQuery = $this->baseAdjustmentQuery($filters);
        $this->applyDimensionFilter($adjustmentQuery, $dimension, $anchor, 'adjustment');

        $paymentTotals = $this->paymentTotalsFromQuery($paymentQuery);
        $negativeAdjustments = (float) (clone $adjustmentQuery)->sum('ia.amount');
        $invoiceIds = collect((clone $paymentQuery)->select('i.id as invoice_id')->distinct()->pluck('invoice_id')->all())
            ->merge((clone $adjustmentQuery)->select('i.id as invoice_id')->distinct()->pluck('invoice_id')->all())
            ->unique()
            ->values()
            ->all();

        $invoicePaginator = Invoice::query()
            ->with(['patient:id,patient_code,full_name,phone', 'doctor:id,name', 'branch:id,name'])
            ->whereIn('id', $invoiceIds)
            ->orderByDesc('created_at')
            ->paginate($perPage);

        $paymentPaginator = (clone $paymentQuery)
            ->leftJoin('users as cashier', 'cashier.id', '=', 'pt.paid_by')
            ->select([
                'pt.id',
                'pt.code',
                'pt.invoice_id',
                'pt.type',
                'pt.method',
                'pt.amount',
                'pt.paid_at',
                'pt.reference_code',
                'cashier.name as cashier_name',
                'i.code as invoice_code',
                'i.patient_name_snapshot',
                'i.status as invoice_status',
            ])
            ->orderByDesc('pt.paid_at')
            ->paginate($perPage);

        return [
            'summary' => [
                'total_revenue' => round($paymentTotals['gross_payments'] - $paymentTotals['refunds'] - $negativeAdjustments, 2),
                'gross_payments' => $paymentTotals['gross_payments'],
                'refunds' => $paymentTotals['refunds'],
                'negative_adjustments' => round($negativeAdjustments, 2),
                'invoice_count' => count($invoiceIds),
                'transaction_count' => $paymentTotals['transaction_count'],
            ],
            'invoices' => $this->paginatorPayload($invoicePaginator),
            'payments' => $this->paginatorPayload($paymentPaginator),
        ];
    }

    public function debtSummary(array $filters): array
    {
        $query = $this->baseDebtQuery($filters);
        $rows = (clone $query)->get(['id', 'amount_due', 'created_at']);
        $totalDebt = (float) $rows->sum('amount_due');
        $now = Carbon::now();

        $buckets = [
            '0_30' => ['label' => '0-30 ngày', 'invoice_count' => 0, 'amount' => 0.0],
            '31_60' => ['label' => '31-60 ngày', 'invoice_count' => 0, 'amount' => 0.0],
            '61_90' => ['label' => '61-90 ngày', 'invoice_count' => 0, 'amount' => 0.0],
            'over_90' => ['label' => 'Trên 90 ngày', 'invoice_count' => 0, 'amount' => 0.0],
        ];

        foreach ($rows as $row) {
            $age = Carbon::parse($row->created_at)->diffInDays($now);
            $key = $age <= 30 ? '0_30' : ($age <= 60 ? '31_60' : ($age <= 90 ? '61_90' : 'over_90'));
            $buckets[$key]['invoice_count']++;
            $buckets[$key]['amount'] += (float) $row->amount_due;
        }

        $overdueThreshold = Carbon::now()->subDays(7);
        $overdueRows = (clone $query)->where('created_at', '<=', $overdueThreshold)->get(['amount_due']);

        return [
            'total_debt' => round($totalDebt, 2),
            'invoice_count' => $rows->count(),
            'overdue_debt' => round((float) $overdueRows->sum('amount_due'), 2),
            'overdue_invoice_count' => $overdueRows->count(),
            'buckets' => array_values(array_map(function ($bucket) use ($totalDebt) {
                $bucket['amount'] = round((float) $bucket['amount'], 2);
                $bucket['percentage'] = $this->percentage($bucket['amount'], $totalDebt);

                return $bucket;
            }, $buckets)),
        ];
    }

    public function debtList(array $filters): LengthAwarePaginator
    {
        $perPage = max(1, min(100, (int) ($filters['per_page'] ?? 20)));

        return $this->baseDebtQuery($filters)
            ->with(['patient:id,patient_code,full_name,phone', 'doctor:id,name', 'branch:id,name'])
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    public function exportPayload(array $filters): array
    {
        $type = $filters['type'];
        $headers = [];
        $rows = [];

        if ($type === 'overview') {
            $summary = $this->summary($filters);
            $headers = ['Chỉ số', 'Giá trị'];
            $rows = [
                ['Tổng doanh thu', $summary['total_revenue']],
                ['Tổng thu', $summary['gross_payments']],
                ['Hoàn tiền', $summary['refunds']],
                ['Điều chỉnh âm', $summary['negative_adjustments']],
                ['Số hóa đơn', $summary['invoice_count']],
                ['Số giao dịch', $summary['transaction_count']],
                ['Công nợ', $summary['outstanding_total']],
                ['Giá trị hóa đơn TB', $summary['average_invoice_value']],
                ['Tỷ lệ thu hồi nợ (%)', $summary['recovery_rate']],
            ];
        } elseif ($type === 'by-branch') {
            $headers = ['Chi nhánh', 'Mã', 'Doanh thu', 'Tổng thu', 'Hoàn tiền', 'Điều chỉnh âm', 'Số hóa đơn', 'Tỷ trọng (%)'];
            $rows = collect($this->byBranch($filters)['data'])->map(fn ($row) => [
                $row['name'], $row['code'], $row['revenue'], $row['gross_payments'], $row['refunds'],
                $row['negative_adjustments'], $row['invoice_count'], $row['percentage'],
            ])->all();
        } elseif ($type === 'by-doctor') {
            $headers = ['Bác sĩ', 'Doanh thu', 'Tổng thu', 'Hoàn tiền', 'Điều chỉnh âm', 'Số hóa đơn', 'Tỷ trọng (%)'];
            $rows = collect($this->byDoctor($filters)['data'])->map(fn ($row) => [
                $row['name'], $row['revenue'], $row['gross_payments'], $row['refunds'],
                $row['negative_adjustments'], $row['invoice_count'], $row['percentage'],
            ])->all();
        } elseif ($type === 'by-service') {
            $headers = ['Dịch vụ / nhóm', 'Mã', 'Doanh thu', 'Tổng thu', 'Hoàn tiền', 'Điều chỉnh âm', 'Số hóa đơn', 'Tỷ trọng (%)'];
            $rows = collect($this->byService($filters)['data'])->map(fn ($row) => [
                $row['name'], $row['code'], $row['revenue'], $row['gross_payments'], $row['refunds'],
                $row['negative_adjustments'], $row['invoice_count'], $row['percentage'],
            ])->all();
        } elseif ($type === 'debt') {
            $headers = ['Mã hóa đơn', 'Bệnh nhân', 'Trạng thái', 'Tổng tiền', 'Đã thu', 'Còn nợ', 'Ngày tạo'];
            $rows = $this->baseDebtQuery($filters)
                ->limit(50000)
                ->get()
                ->map(fn ($invoice) => [
                    $invoice->code,
                    $invoice->patient_name_snapshot,
                    $invoice->status,
                    $invoice->total,
                    $invoice->amount_paid,
                    $invoice->amount_due,
                    $invoice->created_at,
                ])
                ->all();
        } elseif ($type === 'invoice-details') {
            $headers = ['Mã hóa đơn', 'Bệnh nhân', 'Trạng thái', 'Tổng tiền', 'Đã thu', 'Còn nợ', 'Ngày khám', 'Ngày tạo'];
            $invoiceIds = $this->invoiceIdsForPeriod($filters);
            $rows = Invoice::query()
                ->whereIn('id', $invoiceIds)
                ->orderByDesc('created_at')
                ->limit(50000)
                ->get()
                ->map(fn ($invoice) => [
                    $invoice->code,
                    $invoice->patient_name_snapshot,
                    $invoice->status,
                    $invoice->total,
                    $invoice->amount_paid,
                    $invoice->amount_due,
                    $invoice->exam_date,
                    $invoice->created_at,
                ])
                ->all();
        } elseif ($type === 'payment-details') {
            $headers = ['Mã giao dịch', 'Mã hóa đơn', 'Bệnh nhân', 'Loại', 'Phương thức', 'Số tiền', 'Thời điểm thu', 'Người thu'];
            $rows = $this->basePaymentQuery($filters)
                ->leftJoin('users as cashier', 'cashier.id', '=', 'pt.paid_by')
                ->select([
                    'pt.code',
                    'i.code as invoice_code',
                    'i.patient_name_snapshot',
                    'pt.type',
                    'pt.method',
                    'pt.amount',
                    'pt.paid_at',
                    'cashier.name as cashier_name',
                ])
                ->orderByDesc('pt.paid_at')
                ->limit(50000)
                ->get()
                ->map(fn ($row) => [
                    $row->code,
                    $row->invoice_code,
                    $row->patient_name_snapshot,
                    $row->type,
                    $this->methodLabel($row->method),
                    $row->amount,
                    $row->paid_at,
                    $row->cashier_name,
                ])
                ->all();
        }

        return [
            'filename' => 'revenue-'.$type.'-'.now()->format('Ymd-His').'.csv',
            'headers' => $headers,
            'rows' => $rows,
        ];
    }

    public function logExport(?User $actor, array $filters, int $rowCount): void
    {
        $this->auditLog->log($actor, 'report.revenue.exported', [
            'type' => $filters['type'] ?? null,
            'format' => $filters['format'] ?? null,
            'from' => $filters['from'] ?? null,
            'to' => $filters['to'] ?? null,
            'filters' => $filters,
            'row_count' => $rowCount,
        ]);
    }

    private function summaryForPeriod(array $filters, array $period): array
    {
        $paymentTotals = $this->paymentTotals($filters, $period);
        $negativeAdjustments = $this->negativeAdjustmentTotal($filters, $period);
        $totalRevenue = $paymentTotals['gross_payments'] - $paymentTotals['refunds'] - $negativeAdjustments;
        $outstanding = $this->outstandingTotal($filters);
        $invoiceCount = $paymentTotals['invoice_count'];

        return [
            'period' => [
                'from' => $period['from']->toDateString(),
                'to' => $period['to']->toDateString(),
            ],
            'total_revenue' => round($totalRevenue, 2),
            'gross_payments' => $paymentTotals['gross_payments'],
            'refunds' => $paymentTotals['refunds'],
            'negative_adjustments' => round($negativeAdjustments, 2),
            'invoice_count' => $invoiceCount,
            'transaction_count' => $paymentTotals['transaction_count'],
            'outstanding_total' => round($outstanding, 2),
            'average_invoice_value' => $invoiceCount > 0 ? round($totalRevenue / $invoiceCount, 2) : 0,
            'recovery_rate' => ($totalRevenue + $outstanding) > 0
                ? round($totalRevenue / ($totalRevenue + $outstanding) * 100, 2)
                : 0,
        ];
    }

    private function paymentTotals(array $filters, ?array $period = null): array
    {
        return $this->paymentTotalsFromQuery($this->basePaymentQuery($filters, $period));
    }

    private function paymentTotalsFromQuery(QueryBuilder $query): array
    {
        $row = (clone $query)
            ->selectRaw('
                SUM(CASE WHEN pt.type = ? THEN pt.amount ELSE 0 END) as gross_payments,
                SUM(CASE WHEN pt.type = ? THEN pt.amount ELSE 0 END) as refunds,
                COUNT(DISTINCT i.id) as invoice_count,
                COUNT(pt.id) as transaction_count
            ', [PaymentTransaction::TYPE_PAYMENT, PaymentTransaction::TYPE_REFUND])
            ->first();

        return [
            'gross_payments' => round((float) ($row->gross_payments ?? 0), 2),
            'refunds' => round((float) ($row->refunds ?? 0), 2),
            'invoice_count' => (int) ($row->invoice_count ?? 0),
            'transaction_count' => (int) ($row->transaction_count ?? 0),
        ];
    }

    private function negativeAdjustmentTotal(array $filters, ?array $period = null): float
    {
        return round((float) $this->baseAdjustmentQuery($filters, $period)->sum('ia.amount'), 2);
    }

    private function outstandingTotal(array $filters): float
    {
        return (float) $this->baseDebtQuery($filters)->sum('amount_due');
    }

    private function basePaymentQuery(array $filters, ?array $period = null): QueryBuilder
    {
        $period ??= $this->period($filters);

        $query = DB::table('payment_transactions as pt')
            ->join('invoices as i', 'i.id', '=', 'pt.invoice_id')
            ->whereIn('pt.type', [PaymentTransaction::TYPE_PAYMENT, PaymentTransaction::TYPE_REFUND])
            ->whereNull('pt.voided_at')
            ->where('i.status', '!=', Invoice::STATUS_CANCELLED)
            ->whereBetween('pt.paid_at', [$period['from'], $period['to']]);

        $this->applyInvoiceFilters($query, $filters, 'i');

        if (! empty($filters['method'])) {
            $query->where('pt.method', $filters['method']);
        }
        if (! empty($filters['cashier_id'])) {
            $query->where('pt.paid_by', (int) $filters['cashier_id']);
        }

        return $query;
    }

    private function baseAdjustmentQuery(array $filters, ?array $period = null): QueryBuilder
    {
        $period ??= $this->period($filters);

        $query = DB::table('invoice_adjustments as ia')
            ->join('invoices as i', 'i.id', '=', 'ia.invoice_id')
            ->where('ia.type', InvoiceAdjustment::TYPE_NEGATIVE)
            ->where('i.status', '!=', Invoice::STATUS_CANCELLED)
            ->whereBetween('ia.created_at', [$period['from'], $period['to']]);

        $this->applyInvoiceFilters($query, $filters, 'i');

        if (! empty($filters['method']) || ! empty($filters['cashier_id'])) {
            $query->whereRaw('1 = 0');
        }

        return $query;
    }

    private function baseDebtQuery(array $filters)
    {
        $period = $this->period($filters);
        $query = Invoice::query()
            ->whereIn('status', Invoice::OPEN_STATUSES)
            ->where('amount_due', '>', 0)
            ->whereBetween('created_at', [$period['from'], $period['to']]);

        $this->applyInvoiceFilters($query, $filters, 'invoices');

        return $query;
    }

    private function applyInvoiceFilters($query, array $filters, string $invoiceAlias): void
    {
        if (! empty($filters['branch_id'])) {
            $query->where($invoiceAlias.'.branch_id', (int) $filters['branch_id']);
        }
        if (! empty($filters['doctor_id'])) {
            $query->where($invoiceAlias.'.doctor_id', (int) $filters['doctor_id']);
        }
        if (! empty($filters['invoice_status'])) {
            $query->where($invoiceAlias.'.status', $filters['invoice_status']);
        }
        if (! empty($filters['service_id']) || ! empty($filters['service_group_id'])) {
            $query->whereExists(function ($sub) use ($filters, $invoiceAlias) {
                $sub->selectRaw('1')
                    ->from('invoice_items as filter_ii')
                    ->whereColumn('filter_ii.invoice_id', $invoiceAlias.'.id');

                if (! empty($filters['service_id'])) {
                    $sub->where('filter_ii.service_id', (int) $filters['service_id']);
                }

                if (! empty($filters['service_group_id'])) {
                    $sub->join('services as filter_s', 'filter_s.id', '=', 'filter_ii.service_id')
                        ->where('filter_s.service_group_id', (int) $filters['service_group_id']);
                }
            });
        }
    }

    private function applyItemFilters(QueryBuilder $query, array $filters): void
    {
        if (! empty($filters['service_id'])) {
            $query->where('ii.service_id', (int) $filters['service_id']);
        }
        if (! empty($filters['service_group_id'])) {
            $query->where('s.service_group_id', (int) $filters['service_group_id']);
        }
    }

    private function applyDimensionFilter(QueryBuilder $query, string $dimension, ?string $anchor, string $kind): void
    {
        if ($dimension === 'branch' && $anchor !== null) {
            $anchor === 'none' ? $query->whereNull('i.branch_id') : $query->where('i.branch_id', (int) $anchor);
        } elseif ($dimension === 'doctor' && $anchor !== null) {
            $anchor === 'none' ? $query->whereNull('i.doctor_id') : $query->where('i.doctor_id', (int) $anchor);
        } elseif ($dimension === 'invoice_status' && $anchor !== null) {
            $query->where('i.status', $anchor);
        } elseif ($dimension === 'method' && $anchor !== null) {
            $kind === 'payment' ? $query->where('pt.method', $anchor) : $query->whereRaw('1 = 0');
        } elseif ($dimension === 'day' && $anchor !== null) {
            $column = $kind === 'payment' ? 'pt.paid_at' : 'ia.created_at';
            $query->whereDate($column, Carbon::parse($anchor)->toDateString());
        } elseif (in_array($dimension, ['service', 'service_group'], true) && $anchor !== null) {
            $query->whereExists(function ($sub) use ($dimension, $anchor) {
                $sub->selectRaw('1')
                    ->from('invoice_items as dim_ii')
                    ->whereColumn('dim_ii.invoice_id', 'i.id');

                if ($dimension === 'service') {
                    $anchor === 'none' ? $sub->whereNull('dim_ii.service_id') : $sub->where('dim_ii.service_id', (int) $anchor);
                } else {
                    $sub->join('services as dim_s', 'dim_s.id', '=', 'dim_ii.service_id');
                    $anchor === 'none' ? $sub->whereNull('dim_s.service_group_id') : $sub->where('dim_s.service_group_id', (int) $anchor);
                }
            });
        }
    }

    private function mergeDimensionRows(Collection $payments, Collection $adjustments): array
    {
        $items = [];

        foreach ($payments as $row) {
            $key = $this->dimensionKey($row->id);
            $items[$key] = [
                'id' => $row->id,
                'anchor' => $key,
                'name' => $row->name,
                'code' => $row->code ?? '',
                'revenue' => (float) $row->revenue,
                'gross_payments' => (float) $row->gross_payments,
                'refunds' => (float) $row->refunds,
                'negative_adjustments' => 0.0,
                'invoice_count' => (int) $row->invoice_count,
                'transaction_count' => (int) ($row->transaction_count ?? 0),
                'item_count' => (int) ($row->item_count ?? 0),
            ];
        }

        foreach ($adjustments as $row) {
            $key = $this->dimensionKey($row->id);
            $items[$key] ??= [
                'id' => $row->id,
                'anchor' => $key,
                'name' => $row->name,
                'code' => $row->code ?? '',
                'revenue' => 0.0,
                'gross_payments' => 0.0,
                'refunds' => 0.0,
                'negative_adjustments' => 0.0,
                'invoice_count' => 0,
                'transaction_count' => 0,
                'item_count' => 0,
            ];
            $items[$key]['negative_adjustments'] += (float) $row->negative_adjustments;
            $items[$key]['revenue'] -= (float) $row->negative_adjustments;
        }

        $total = array_sum(array_map(fn ($row) => (float) $row['revenue'], $items));

        $data = collect(array_values($items))
            ->map(function ($row) use ($total) {
                $row['revenue'] = round((float) $row['revenue'], 2);
                $row['gross_payments'] = round((float) $row['gross_payments'], 2);
                $row['refunds'] = round((float) $row['refunds'], 2);
                $row['negative_adjustments'] = round((float) $row['negative_adjustments'], 2);
                $row['percentage'] = $this->percentage($row['revenue'], $total);

                return $row;
            })
            ->sortByDesc('revenue')
            ->values()
            ->all();

        return [
            'total' => round($total, 2),
            'data' => $data,
        ];
    }

    private function invoiceIdsForPeriod(array $filters): array
    {
        return collect($this->basePaymentQuery($filters)->select('i.id as invoice_id')->distinct()->pluck('invoice_id')->all())
            ->merge($this->baseAdjustmentQuery($filters)->select('i.id as invoice_id')->distinct()->pluck('invoice_id')->all())
            ->unique()
            ->values()
            ->all();
    }

    private function paginatorPayload(LengthAwarePaginator $paginator): array
    {
        return [
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ];
    }

    private function emptyBuckets(array $period, string $granularity): array
    {
        $cursor = $this->bucketStart($period['from']->copy(), $granularity);
        $end = $this->bucketStart($period['to']->copy(), $granularity);
        $buckets = [];

        while ($cursor <= $end) {
            $key = $this->bucketKey($cursor, $granularity);
            $buckets[$key] = [
                'key' => $key,
                'label' => $this->bucketLabel($cursor, $granularity),
                'date' => $cursor->toDateString(),
                'revenue' => 0.0,
                'gross_payments' => 0.0,
                'refunds' => 0.0,
                'negative_adjustments' => 0.0,
            ];
            $cursor = match ($granularity) {
                'week' => $cursor->addWeek(),
                'month' => $cursor->addMonth(),
                'year' => $cursor->addYear(),
                default => $cursor->addDay(),
            };
        }

        return $buckets;
    }

    private function bucketStart(Carbon $date, string $granularity): Carbon
    {
        return match ($granularity) {
            'week' => $date->startOfWeek(),
            'month' => $date->startOfMonth(),
            'year' => $date->startOfYear(),
            default => $date->startOfDay(),
        };
    }

    private function bucketKey(Carbon $date, string $granularity): string
    {
        $start = $this->bucketStart($date->copy(), $granularity);

        return match ($granularity) {
            'week' => $start->format('o-\WW'),
            'month' => $start->format('Y-m'),
            'year' => $start->format('Y'),
            default => $start->toDateString(),
        };
    }

    private function bucketLabel(Carbon $date, string $granularity): string
    {
        return match ($granularity) {
            'week' => 'Tuần '.$date->format('W/Y'),
            'month' => $date->format('m/Y'),
            'year' => $date->format('Y'),
            default => $date->format('d/m'),
        };
    }

    private function period(array $filters): array
    {
        return [
            'from' => Carbon::parse($filters['from'])->startOfDay(),
            'to' => Carbon::parse($filters['to'])->endOfDay(),
        ];
    }

    private function previousPeriod(array $period): array
    {
        $days = $period['from']->diffInDays($period['to']) + 1;
        $to = $period['from']->copy()->subSecond();
        $from = $to->copy()->subDays($days - 1)->startOfDay();

        return ['from' => $from, 'to' => $to];
    }

    private function dimensionKey(mixed $id): string
    {
        return $id === null ? 'none' : (string) $id;
    }

    private function methodLabel(?string $method): string
    {
        return match ($method) {
            PaymentTransaction::METHOD_CASH => 'Tiền mặt',
            PaymentTransaction::METHOD_BANK_TRANSFER => 'Chuyển khoản',
            PaymentTransaction::METHOD_CARD => 'Thẻ ngân hàng',
            default => $method ?: 'Không xác định',
        };
    }

    private function percentage(float $value, float $total): float
    {
        return abs($total) > 0 ? round($value / $total * 100, 2) : 0.0;
    }

    private function deltaPercent(float|int $current, float|int $previous): ?float
    {
        if ((float) $previous === 0.0) {
            return (float) $current === 0.0 ? 0.0 : null;
        }

        return round(((float) $current - (float) $previous) / abs((float) $previous) * 100, 2);
    }
}
