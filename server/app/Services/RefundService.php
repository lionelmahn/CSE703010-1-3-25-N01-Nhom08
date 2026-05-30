<?php

namespace App\Services;

use App\Models\ExaminationServiceItem;
use App\Models\Invoice;
use App\Models\PaymentTransaction;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * UC13 - Hoan tien. Tao 1 row payment_transactions(type=refund). Sau khi
 * hoan tat:
 *  - amount_paid giam.
 *  - Neu amount_paid = 0 AND tung paid => status = refunded.
 *  - Neu amount_paid > 0 => status = partial.
 *  - Neu hoan 100% => is_paid items reset ve false.
 *
 * Khong rollback session.status (Q19 - giu hoan_tat).
 */
class RefundService
{
    public function __construct(
        private readonly AuditLogService $auditLog,
        private readonly InvoiceService $invoices,
    ) {}

    public function refund(int $invoiceId, array $payload, User $actor): Invoice
    {
        return DB::transaction(function () use ($invoiceId, $payload, $actor) {
            /** @var Invoice $invoice */
            $invoice = Invoice::query()->lockForUpdate()->findOrFail($invoiceId);

            if ($invoice->status === Invoice::STATUS_CANCELLED) {
                throw ValidationException::withMessages([
                    'status' => 'Hoa don da huy, khong the hoan tien.',
                ])->status(409);
            }
            if (bccomp((string) $invoice->amount_paid, '0', 2) === 0) {
                throw ValidationException::withMessages([
                    'amount_paid' => 'Hoa don chua co khoan thu, khong the hoan tien.',
                ])->status(422);
            }

            $method = $payload['method'] ?? null;
            if (! in_array($method, PaymentTransaction::ALL_METHODS, true)) {
                throw ValidationException::withMessages([
                    'method' => 'Phuong thuc hoan tien khong hop le.',
                ]);
            }
            $amount = (float) ($payload['amount'] ?? 0);
            if ($amount <= 0) {
                throw ValidationException::withMessages([
                    'amount' => 'So tien hoan phai > 0.',
                ]);
            }
            if (bccomp((string) $amount, (string) $invoice->amount_paid, 2) > 0) {
                throw ValidationException::withMessages([
                    'amount' => 'So tien hoan vuot khoan da thu ('.$invoice->amount_paid.' VND).',
                ])->status(422);
            }
            $reason = $this->sanitizeText($payload['reason'] ?? '');
            if ($reason === '') {
                throw ValidationException::withMessages([
                    'reason' => 'Vui long nhap ly do hoan tien (VR10).',
                ]);
            }

            $reference = trim((string) ($payload['reference_code'] ?? ''));
            if (in_array($method, PaymentTransaction::METHODS_REQUIRE_REF, true) && $reference === '') {
                throw ValidationException::withMessages([
                    'reference_code' => 'Vui long nhap so tham chieu giao dich (VR8).',
                ]);
            }
            $accountInfo = $this->sanitizeText($payload['account_info'] ?? '') ?: null;

            $now = Carbon::now();
            PaymentTransaction::create([
                'code' => PaymentTransaction::generateCode($now),
                'invoice_id' => $invoice->id,
                'type' => PaymentTransaction::TYPE_REFUND,
                'method' => $method,
                'amount' => $amount,
                'reference_code' => $reference !== '' ? $reference : null,
                'note' => $reason.($payload['note'] ?? '') ? $reason."\n".$this->sanitizeText($payload['note'] ?? '') : $reason,
                'paid_by' => $actor->id,
                'paid_at' => $now,
                'account_info' => $accountInfo,
            ]);

            $wasFullyPaid = $invoice->status === Invoice::STATUS_PAID;
            $newPaid = bcsub((string) $invoice->amount_paid, (string) $amount, 2);
            $invoice->amount_paid = (float) $newPaid;

            $this->invoices->recomputeTotals($invoice);

            // Neu sau hoan, amount_paid = 0 va truoc do tung paid => refunded.
            if (bccomp((string) $invoice->amount_paid, '0', 2) === 0 && $wasFullyPaid) {
                $invoice->status = Invoice::STATUS_REFUNDED;
                // Reset is_paid items khi hoan 100%.
                ExaminationServiceItem::where('examination_id', $invoice->examination_id)
                    ->update(['is_paid' => false]);
            }
            $invoice->save();

            $this->auditLog->log($actor, 'invoice.refund', [
                'invoice_id' => $invoice->id,
                'amount' => $amount,
                'method' => $method,
                'reason' => $reason,
                'final_status' => $invoice->status,
            ]);

            return $invoice->fresh(['items', 'payments', 'adjustments']);
        });
    }

    private function sanitizeText(?string $text): string
    {
        if ($text === null) {
            return '';
        }

        return trim(strip_tags($text));
    }
}
