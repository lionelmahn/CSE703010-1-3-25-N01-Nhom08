<?php

namespace App\Services;

use App\Models\ExaminationServiceItem;
use App\Models\ExaminationSession;
use App\Models\Invoice;
use App\Models\InvoiceAdjustment;
use App\Models\InvoiceItem;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * UC13 - Business logic cho `invoices` + `invoice_items` + `invoice_adjustments`.
 *
 * Quy uoc tinh tien (su dung bccomp/bcadd/bcsub voi scale 2 de tranh sai
 * so float, R5):
 *   total = subtotal - discount_amount + surcharge_amount + SUM(positive adj) - SUM(negative adj)
 *   amount_due = total - amount_paid
 *
 * VR13: 1 invoice "main" / examination_id / status NOT IN cancelled.
 * Enforce trong createFromExamination().
 */
class InvoiceService
{
    public function __construct(
        private readonly AuditLogService $auditLog,
    ) {}

    /* =====================================================================
     * Auto-create from UC12 examination_sessions.
     * ===================================================================== */

    /**
     * Goi tu `ExaminationService::complete()` sau khi session chuyen
     * `cho_thanh_toan`. Idempotent: neu da co invoice main active thi
     * tra ve no.
     */
    public function createFromExamination(ExaminationSession $session, ?User $actor = null): Invoice
    {
        return DB::transaction(function () use ($session, $actor) {
            // Lock session de tranh race.
            $session = ExaminationSession::query()
                ->with('serviceItems', 'patient', 'appointment')
                ->lockForUpdate()
                ->findOrFail($session->id);

            if ($session->status !== ExaminationSession::STATUS_CHO_THANH_TOAN) {
                throw ValidationException::withMessages([
                    'status' => 'Phien kham phai o trang thai cho_thanh_toan (VR1).',
                ])->status(409);
            }

            $items = $session->serviceItems;
            if ($items->isEmpty()) {
                throw ValidationException::withMessages([
                    'items' => 'Phien kham chua co dich vu de tao hoa don (VR2).',
                ])->status(422);
            }

            // VR13 - 1 main invoice (not cancelled) / examination.
            $existing = Invoice::query()
                ->where('examination_id', $session->id)
                ->where('type', Invoice::TYPE_MAIN)
                ->where('status', '!=', Invoice::STATUS_CANCELLED)
                ->lockForUpdate()
                ->first();
            if ($existing) {
                return $existing;
            }

            $subtotal = (float) $items->sum('subtotal_snapshot');
            $now = Carbon::now();

            $invoice = new Invoice;
            $invoice->code = Invoice::generateCode($now);
            $invoice->examination_id = $session->id;
            $invoice->appointment_id = $session->appointment_id;
            $invoice->patient_id = $session->patient_id;
            $invoice->patient_name_snapshot = $session->patient?->full_name ?? '';
            $invoice->patient_phone_snapshot = $session->patient?->phone;
            $invoice->doctor_id = $session->doctor_id;
            $invoice->exam_date = $session->completed_at ?? $now;
            $invoice->branch_id = $session->appointment?->branch_id;
            $invoice->subtotal = $subtotal;
            $invoice->discount_amount = 0;
            $invoice->surcharge_amount = 0;
            $invoice->total = $subtotal;
            $invoice->amount_paid = 0;
            $invoice->amount_due = $subtotal;
            $invoice->status = Invoice::STATUS_PENDING;
            $invoice->type = Invoice::TYPE_MAIN;
            $invoice->created_by = $actor?->id;
            $invoice->save();

            foreach ($items as $item) {
                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'examination_service_item_id' => $item->id,
                    'service_id' => $item->service_id,
                    'service_code_snapshot' => $item->service_code_snapshot,
                    'service_name_snapshot' => $item->service_name_snapshot,
                    'tooth_codes' => $item->tooth_codes,
                    'processing_level' => $item->processing_level,
                    'complexity_coefficient' => $item->complexity_coefficient,
                    'unit_price_snapshot' => $item->unit_price_snapshot,
                    'quantity' => $item->quantity,
                    'line_total' => $item->subtotal_snapshot,
                ]);
            }

            $this->auditLog->log($actor, 'invoice.created', [
                'invoice_id' => $invoice->id,
                'invoice_code' => $invoice->code,
                'examination_id' => $session->id,
                'subtotal' => $subtotal,
                'item_count' => $items->count(),
            ]);

            return $invoice->fresh(['items']);
        });
    }

    /* =====================================================================
     * Recompute totals (subtotal stays from items; user mutates discount,
     * surcharge, adjustments).
     * ===================================================================== */

    public function recomputeTotals(Invoice $invoice): void
    {
        $adjPositive = (float) $invoice->adjustments()
            ->where('type', InvoiceAdjustment::TYPE_POSITIVE)
            ->sum('amount');
        $adjNegative = (float) $invoice->adjustments()
            ->where('type', InvoiceAdjustment::TYPE_NEGATIVE)
            ->sum('amount');

        $total = bcsub((string) $invoice->subtotal, (string) $invoice->discount_amount, 2);
        $total = bcadd($total, (string) $invoice->surcharge_amount, 2);
        $total = bcadd($total, (string) $adjPositive, 2);
        $total = bcsub($total, (string) $adjNegative, 2);

        // VR4: total >= 0.
        if (bccomp($total, '0', 2) < 0) {
            throw ValidationException::withMessages([
                'total' => 'Tong hoa don khong duoc am (VR4).',
            ])->status(422);
        }

        $invoice->total = (float) $total;
        $invoice->amount_due = (float) bcsub($total, (string) $invoice->amount_paid, 2);

        // Tinh status nay theo amount_paid / total.
        if (in_array($invoice->status, [Invoice::STATUS_CANCELLED, Invoice::STATUS_REFUNDED], true)) {
            return;
        }
        if (bccomp((string) $invoice->amount_paid, '0', 2) === 0) {
            $invoice->status = Invoice::STATUS_PENDING;
        } elseif (bccomp((string) $invoice->amount_due, '0', 2) <= 0) {
            $invoice->status = Invoice::STATUS_PAID;
        } else {
            $invoice->status = Invoice::STATUS_PARTIAL;
        }
    }

    /* =====================================================================
     * Discount / surcharge.
     * ===================================================================== */

    public function applyDiscount(int $invoiceId, array $payload, User $actor): Invoice
    {
        return DB::transaction(function () use ($invoiceId, $payload, $actor) {
            /** @var Invoice $invoice */
            $invoice = Invoice::query()->lockForUpdate()->findOrFail($invoiceId);
            $this->assertMutable($invoice);

            $amount = (float) ($payload['amount'] ?? 0);
            if ($amount < 0) {
                throw ValidationException::withMessages([
                    'amount' => 'Giam gia khong duoc am (VR6).',
                ]);
            }

            $reason = $this->sanitizeText($payload['reason'] ?? '');
            if ($amount > 0 && $reason === '') {
                throw ValidationException::withMessages([
                    'reason' => 'Vui long nhap ly do giam gia (VR5).',
                ]);
            }

            // VR4: discount khong vuot tong tien (truoc adjustments).
            if (bccomp((string) $amount, (string) $invoice->subtotal, 2) > 0) {
                throw ValidationException::withMessages([
                    'amount' => 'Giam gia khong duoc vuot tam tinh (VR4).',
                ]);
            }

            $before = [
                'discount_amount' => $invoice->discount_amount,
                'discount_reason' => $invoice->discount_reason,
            ];

            $invoice->discount_amount = $amount;
            $invoice->discount_reason = $reason !== '' ? $reason : null;
            $invoice->discount_note = $this->sanitizeText($payload['note'] ?? '') ?: null;
            $this->recomputeTotals($invoice);
            $invoice->save();

            $this->auditLog->log($actor, 'invoice.discount', [
                'invoice_id' => $invoice->id,
                'before' => $before,
                'after' => [
                    'discount_amount' => $invoice->discount_amount,
                    'discount_reason' => $invoice->discount_reason,
                ],
            ]);

            return $invoice->fresh(['items', 'payments', 'adjustments']);
        });
    }

    public function applySurcharge(int $invoiceId, array $payload, User $actor): Invoice
    {
        return DB::transaction(function () use ($invoiceId, $payload, $actor) {
            /** @var Invoice $invoice */
            $invoice = Invoice::query()->lockForUpdate()->findOrFail($invoiceId);
            $this->assertMutable($invoice);

            $amount = (float) ($payload['amount'] ?? 0);
            if ($amount < 0) {
                throw ValidationException::withMessages([
                    'amount' => 'Phu thu khong duoc am (VR6).',
                ]);
            }
            $reason = $this->sanitizeText($payload['reason'] ?? '');
            if ($amount > 0 && $reason === '') {
                throw ValidationException::withMessages([
                    'reason' => 'Vui long nhap ly do phu thu.',
                ]);
            }

            $before = [
                'surcharge_amount' => $invoice->surcharge_amount,
                'surcharge_reason' => $invoice->surcharge_reason,
            ];

            $invoice->surcharge_amount = $amount;
            $invoice->surcharge_reason = $reason !== '' ? $reason : null;
            $this->recomputeTotals($invoice);
            $invoice->save();

            $this->auditLog->log($actor, 'invoice.surcharge', [
                'invoice_id' => $invoice->id,
                'before' => $before,
                'after' => [
                    'surcharge_amount' => $invoice->surcharge_amount,
                    'surcharge_reason' => $invoice->surcharge_reason,
                ],
            ]);

            return $invoice->fresh(['items', 'payments', 'adjustments']);
        });
    }

    /* =====================================================================
     * Adjustments (positive / negative).
     * ===================================================================== */

    public function adjust(int $invoiceId, array $payload, User $actor): Invoice
    {
        return DB::transaction(function () use ($invoiceId, $payload, $actor) {
            /** @var Invoice $invoice */
            $invoice = Invoice::query()->lockForUpdate()->findOrFail($invoiceId);

            if (in_array($invoice->status, [Invoice::STATUS_CANCELLED, Invoice::STATUS_REFUNDED], true)) {
                throw ValidationException::withMessages([
                    'status' => 'Hoa don da huy / hoan tien khong the dieu chinh.',
                ])->status(409);
            }

            $type = $payload['type'] ?? null;
            if (! in_array($type, InvoiceAdjustment::ALL_TYPES, true)) {
                throw ValidationException::withMessages([
                    'type' => 'Loai dieu chinh khong hop le.',
                ]);
            }
            $amount = (float) ($payload['amount'] ?? 0);
            if ($amount <= 0) {
                throw ValidationException::withMessages([
                    'amount' => 'So tien dieu chinh phai > 0.',
                ]);
            }
            $reason = $this->sanitizeText($payload['reason'] ?? '');
            if ($reason === '') {
                throw ValidationException::withMessages([
                    'reason' => 'Vui long nhap ly do dieu chinh (VR10).',
                ]);
            }
            $note = $this->sanitizeText($payload['note'] ?? '') ?: null;

            InvoiceAdjustment::create([
                'invoice_id' => $invoice->id,
                'type' => $type,
                'amount' => $amount,
                'reason' => $reason,
                'note' => $note,
                'created_by' => $actor->id,
            ]);

            $invoice->adjusted_at = Carbon::now();
            $this->recomputeTotals($invoice);
            $invoice->save();

            $this->auditLog->log($actor, 'invoice.adjusted', [
                'invoice_id' => $invoice->id,
                'type' => $type,
                'amount' => $amount,
                'reason' => $reason,
            ]);

            return $invoice->fresh(['items', 'payments', 'adjustments']);
        });
    }

    /* =====================================================================
     * Cancel.
     * ===================================================================== */

    public function cancel(int $invoiceId, array $payload, User $actor): Invoice
    {
        return DB::transaction(function () use ($invoiceId, $payload, $actor) {
            /** @var Invoice $invoice */
            $invoice = Invoice::query()->lockForUpdate()->findOrFail($invoiceId);

            if ($invoice->status === Invoice::STATUS_CANCELLED) {
                return $invoice;
            }
            if ($invoice->status === Invoice::STATUS_REFUNDED) {
                throw ValidationException::withMessages([
                    'status' => 'Hoa don da hoan tien, khong the huy.',
                ])->status(409);
            }
            // R7: chan cancel khi da thu tien.
            if (bccomp((string) $invoice->amount_paid, '0', 2) > 0) {
                throw ValidationException::withMessages([
                    'amount_paid' => 'Vui long hoan tien truoc khi huy hoa don.',
                ])->status(422);
            }

            $reason = $this->sanitizeText($payload['reason'] ?? '');
            if ($reason === '') {
                throw ValidationException::withMessages([
                    'reason' => 'Vui long nhap ly do huy (VR10).',
                ]);
            }
            $note = $this->sanitizeText($payload['note'] ?? '') ?: null;

            $invoice->status = Invoice::STATUS_CANCELLED;
            $invoice->cancelled_at = Carbon::now();
            $invoice->cancelled_by = $actor->id;
            $invoice->cancelled_reason = $reason;
            $invoice->cancelled_note = $note;
            $invoice->save();

            // Unset is_paid (chi co the chua thu nen mac dinh la false roi,
            // nhung an toan).
            ExaminationServiceItem::where('examination_id', $invoice->examination_id)
                ->update(['is_paid' => false]);

            $this->auditLog->log($actor, 'invoice.cancelled', [
                'invoice_id' => $invoice->id,
                'reason' => $reason,
            ]);

            return $invoice->fresh(['items', 'payments', 'adjustments']);
        });
    }

    /* =====================================================================
     * Helpers.
     * ===================================================================== */

    /**
     * Cho phep mutate (discount / surcharge / payments / refund / adjust).
     * Cancelled / Refunded khong mutate (VR14).
     */
    public function assertMutable(Invoice $invoice): void
    {
        if (in_array($invoice->status, [Invoice::STATUS_CANCELLED, Invoice::STATUS_REFUNDED], true)) {
            throw ValidationException::withMessages([
                'status' => 'Hoa don da huy / hoan tien.',
            ])->status(409);
        }
    }

    public function sanitizeText(?string $text): string
    {
        if ($text === null) {
            return '';
        }

        return trim(strip_tags($text));
    }
}
