<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Invoice;
use App\Models\PaymentTransaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;

/**
 * UC13 - Truy van queue, KPI dashboard, audit timeline.
 */
class BillingQueueService
{
    public const OVERDUE_DAYS = 7;

    /**
     * Tab counts:
     *  - pending: pending + partial (chua thu du).
     *  - partial: chi partial.
     *  - overdue: pending|partial >= N ngay.
     *  - paid: paid + refunded.
     */
    public function tabCounts(?User $actor): array
    {
        $base = $this->scope($actor);

        $rows = (clone $base)->selectRaw('status, count(*) as c')->groupBy('status')->pluck('c', 'status');

        $overdueThreshold = Carbon::now()->subDays(self::OVERDUE_DAYS);
        $overdue = (clone $base)->whereIn('status', Invoice::OPEN_STATUSES)
            ->where('created_at', '<=', $overdueThreshold)
            ->count();

        return [
            'pending' => (int) ($rows[Invoice::STATUS_PENDING] ?? 0) + (int) ($rows[Invoice::STATUS_PARTIAL] ?? 0),
            'partial' => (int) ($rows[Invoice::STATUS_PARTIAL] ?? 0),
            'overdue' => $overdue,
            'paid' => (int) ($rows[Invoice::STATUS_PAID] ?? 0) + (int) ($rows[Invoice::STATUS_REFUNDED] ?? 0),
            'cancelled' => (int) ($rows[Invoice::STATUS_CANCELLED] ?? 0),
        ];
    }

    public function queue(array $filters, ?User $actor): LengthAwarePaginator
    {
        $perPage = max(1, min(100, (int) ($filters['per_page'] ?? 20)));
        $tab = $filters['tab'] ?? 'pending';

        $query = $this->scope($actor)
            ->with([
                'patient:id,patient_code,full_name,phone,dob,gender',
                'doctor:id,name,email',
                'examination:id,code,status,started_at,completed_at',
            ]);

        if ($tab === 'pending') {
            $query->whereIn('status', Invoice::OPEN_STATUSES);
        } elseif ($tab === 'partial') {
            $query->where('status', Invoice::STATUS_PARTIAL);
        } elseif ($tab === 'overdue') {
            $query->whereIn('status', Invoice::OPEN_STATUSES)
                ->where('created_at', '<=', Carbon::now()->subDays(self::OVERDUE_DAYS));
        } elseif ($tab === 'paid') {
            $query->whereIn('status', [Invoice::STATUS_PAID, Invoice::STATUS_REFUNDED]);
        } elseif ($tab === 'cancelled') {
            $query->where('status', Invoice::STATUS_CANCELLED);
        }

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(function (Builder $q) use ($term) {
                $q->where('code', 'like', $term)
                    ->orWhere('patient_name_snapshot', 'like', $term)
                    ->orWhere('patient_phone_snapshot', 'like', $term)
                    ->orWhereHas('patient', function (Builder $pq) use ($term) {
                        $pq->where('patient_code', 'like', $term)
                            ->orWhere('full_name', 'like', $term)
                            ->orWhere('phone', 'like', $term);
                    });
            });
        }

        if (! empty($filters['from'])) {
            $query->whereDate('exam_date', '>=', Carbon::parse($filters['from'])->toDateString());
        }
        if (! empty($filters['to'])) {
            $query->whereDate('exam_date', '<=', Carbon::parse($filters['to'])->toDateString());
        }

        if (! empty($filters['examinationId']) && (int) $filters['examinationId'] > 0) {
            $query->where('examination_id', (int) $filters['examinationId']);
        }

        return $query->orderByDesc('created_at')->paginate($perPage);
    }

    public function dashboard(?User $actor): array
    {
        $today = Carbon::today();
        $startOfDay = $today->copy()->startOfDay();
        $endOfDay = $today->copy()->endOfDay();

        $invoicesToday = $this->scope($actor)
            ->whereBetween('created_at', [$startOfDay, $endOfDay])->count();

        $paidToday = PaymentTransaction::query()
            ->where('type', PaymentTransaction::TYPE_PAYMENT)
            ->whereNull('voided_at')
            ->whereBetween('paid_at', [$startOfDay, $endOfDay])
            ->sum('amount');

        $refundsToday = PaymentTransaction::query()
            ->where('type', PaymentTransaction::TYPE_REFUND)
            ->whereNull('voided_at')
            ->whereBetween('paid_at', [$startOfDay, $endOfDay])
            ->sum('amount');

        $openInvoices = $this->scope($actor)
            ->whereIn('status', Invoice::OPEN_STATUSES)
            ->sum('amount_due');

        $methodBreakdown = PaymentTransaction::query()
            ->where('type', PaymentTransaction::TYPE_PAYMENT)
            ->whereNull('voided_at')
            ->whereBetween('paid_at', [$startOfDay, $endOfDay])
            ->selectRaw('method, sum(amount) as total')
            ->groupBy('method')
            ->pluck('total', 'method');

        return [
            'invoices_today' => $invoicesToday,
            'revenue_today' => (float) $paidToday,
            'refunds_today' => (float) $refundsToday,
            'net_today' => (float) ($paidToday - $refundsToday),
            'outstanding_total' => (float) $openInvoices,
            'method_breakdown' => [
                'cash' => (float) ($methodBreakdown[PaymentTransaction::METHOD_CASH] ?? 0),
                'bank_transfer' => (float) ($methodBreakdown[PaymentTransaction::METHOD_BANK_TRANSFER] ?? 0),
                'card' => (float) ($methodBreakdown[PaymentTransaction::METHOD_CARD] ?? 0),
            ],
            'tabs' => $this->tabCounts($actor),
        ];
    }

    public function auditLogs(array $filters): LengthAwarePaginator
    {
        $perPage = max(1, min(100, (int) ($filters['per_page'] ?? 20)));

        $query = AuditLog::query()
            ->where(function (Builder $q) {
                $q->where('action', 'like', 'invoice.%')
                    ->orWhere('action', 'like', 'payment.%')
                    ->orWhere('action', 'like', 'invoice.payments.%');
            });

        if (! empty($filters['from'])) {
            $query->whereDate('created_at', '>=', Carbon::parse($filters['from'])->toDateString());
        }
        if (! empty($filters['to'])) {
            $query->whereDate('created_at', '<=', Carbon::parse($filters['to'])->toDateString());
        }
        if (! empty($filters['action'])) {
            $query->where('action', $filters['action']);
        }
        if (! empty($filters['actor_id'])) {
            $query->where('admin_id', (int) $filters['actor_id']);
        }

        return $query->orderByDesc('created_at')->paginate($perPage);
    }

    /**
     * Doctor chi thay invoice cua benh nhan minh, nhung mac dinh doctor
     * khong co invoices.view. Le tan / Ke toan / Admin thay all (Q16:
     * branch scoping defer Phase 2).
     */
    private function scope(?User $actor): Builder
    {
        return Invoice::query();
    }
}
