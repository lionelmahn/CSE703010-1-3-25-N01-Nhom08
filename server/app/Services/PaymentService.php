<?php

namespace App\Services;

use App\Models\ExaminationServiceItem;
use App\Models\ExaminationSession;
use App\Models\Invoice;
use App\Models\PaymentTransaction;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * UC13 - Ghi nhan thanh toan (mot hoac nhieu phuong thuc cung luc).
 *
 * Quy trinh atomic (R1):
 *  1. Lock invoice + insert N rows payment_transactions.
 *  2. Update amount_paid / amount_due / status.
 *  3. Neu status -> paid: lock + chuyen examination_sessions.status =
 *     hoan_tat, set is_paid=true cho tat ca examination_service_items,
 *     ghi examination_histories action='paid'.
 *  4. Ghi audit_logs.
 */
class PaymentService
{
    public function __construct(
        private readonly AuditLogService $auditLog,
        private readonly InvoiceService $invoices,
        private readonly ExaminationService $examinations,
    ) {}

    /**
     * @param  array<int,array<string,mixed>>  $rows
     */
    public function createPayments(int $invoiceId, array $rows, User $actor): Invoice
    {
        if (empty($rows)) {
            throw ValidationException::withMessages([
                'payments' => 'Vui long nhap it nhat 1 dong thanh toan.',
            ]);
        }

        return DB::transaction(function () use ($invoiceId, $rows, $actor) {
            /** @var Invoice $invoice */
            $invoice = Invoice::query()->lockForUpdate()->findOrFail($invoiceId);
            $this->invoices->assertMutable($invoice);

            $now = Carbon::now();
            $totalNewBcStr = '0';
            $normalized = [];

            foreach ($rows as $i => $row) {
                $method = $row['method'] ?? null;
                if (! in_array($method, PaymentTransaction::ALL_METHODS, true)) {
                    throw ValidationException::withMessages([
                        "payments.$i.method" => 'Phuong thuc thanh toan khong hop le.',
                    ]);
                }
                $amount = (float) ($row['amount'] ?? 0);
                if ($amount <= 0) {
                    throw ValidationException::withMessages([
                        "payments.$i.amount" => 'So tien phai > 0 (VR6).',
                    ]);
                }
                $reference = trim((string) ($row['reference_code'] ?? ''));
                if (in_array($method, PaymentTransaction::METHODS_REQUIRE_REF, true) && $reference === '') {
                    throw ValidationException::withMessages([
                        "payments.$i.reference_code" => 'Vui long nhap so tham chieu giao dich (VR8).',
                    ]);
                }

                $normalized[] = [
                    'method' => $method,
                    'amount' => $amount,
                    'reference_code' => $reference !== '' ? $reference : null,
                    'note' => trim(strip_tags((string) ($row['note'] ?? ''))) ?: null,
                ];
                $totalNewBcStr = bcadd($totalNewBcStr, (string) $amount, 2);
            }

            // VR7: tong khong vuot amount_due.
            if (bccomp($totalNewBcStr, (string) $invoice->amount_due, 2) > 0) {
                throw ValidationException::withMessages([
                    'payments' => 'Tong tien thu vuot so phai thu ('.$invoice->amount_due.' VND).',
                ])->status(422);
            }

            $insertedCodes = [];
            foreach ($normalized as $row) {
                $code = PaymentTransaction::generateCode($now);
                PaymentTransaction::create([
                    'code' => $code,
                    'invoice_id' => $invoice->id,
                    'type' => PaymentTransaction::TYPE_PAYMENT,
                    'method' => $row['method'],
                    'amount' => $row['amount'],
                    'reference_code' => $row['reference_code'],
                    'note' => $row['note'],
                    'paid_by' => $actor->id,
                    'paid_at' => $now,
                ]);
                $insertedCodes[] = $code;
            }

            // Tinh lai amount_paid / amount_due / status.
            $newPaid = bcadd((string) $invoice->amount_paid, $totalNewBcStr, 2);
            $invoice->amount_paid = (float) $newPaid;
            $this->invoices->recomputeTotals($invoice);
            $invoice->save();

            // Sync UC12 neu fully paid.
            if ($invoice->status === Invoice::STATUS_PAID) {
                $this->syncExaminationOnFullyPaid($invoice, $actor, $now);
            }

            $this->auditLog->log($actor, 'invoice.payments.created', [
                'invoice_id' => $invoice->id,
                'count' => count($normalized),
                'total' => (float) $totalNewBcStr,
                'codes' => $insertedCodes,
                'final_status' => $invoice->status,
            ]);

            return $invoice->fresh(['items', 'payments', 'adjustments']);
        });
    }

    /**
     * Khi invoice fully paid: chuyen session sang hoan_tat, set is_paid
     * cho tat ca service items, ghi examination_histories.
     */
    private function syncExaminationOnFullyPaid(Invoice $invoice, User $actor, Carbon $now): void
    {
        /** @var ExaminationSession|null $session */
        $session = ExaminationSession::query()
            ->lockForUpdate()
            ->find($invoice->examination_id);

        if ($session && $session->status === ExaminationSession::STATUS_CHO_THANH_TOAN) {
            $session->status = ExaminationSession::STATUS_HOAN_TAT;
            $session->save();

            $this->examinations->writeHistory(
                $session,
                'paid',
                $actor,
                ['status' => ExaminationSession::STATUS_CHO_THANH_TOAN],
                ['status' => ExaminationSession::STATUS_HOAN_TAT, 'invoice_id' => $invoice->id],
            );
        }

        ExaminationServiceItem::where('examination_id', $invoice->examination_id)
            ->update(['is_paid' => true]);
    }
}
