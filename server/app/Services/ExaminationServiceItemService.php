<?php

namespace App\Services;

use App\Models\ExaminationHistory;
use App\Models\ExaminationServiceItem;
use App\Models\ExaminationSession;
use App\Models\Service;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * UC12 - Quan ly dong dich vu cua mot phien kham.
 *
 * Service nay tach ra de gon ExaminationService. Moi mutate deu kiem tra:
 *  - VR5/VR8 (chan khi paid), VR9 (chan khi ky luong da chot),
 *    AC11/VR7 (ly do bat buoc khi he so > 0),
 *    gioi han 50 dong (xac nhan PO ngay 29/05).
 *  - He so phuc tap luon re-derive server-side tu UC17.
 *  - Snapshot service_code/name/unit_price/coefficient khi tao - khong bi
 *    anh huong khi cau hinh sau nay thay doi.
 */
class ExaminationServiceItemService
{
    public function __construct(
        private readonly ComplexityConfigService $complexity,
        private readonly ServicePriceService $servicePrice,
        private readonly AuditLogService $auditLog,
    ) {}

    /**
     * Them mot dong dich vu vao phien kham.
     *
     * @param  array<string,mixed>  $payload
     */
    public function addItem(int $examinationId, array $payload, User $actor): ExaminationServiceItem
    {
        return DB::transaction(function () use ($examinationId, $payload, $actor) {
            $session = ExaminationSession::query()->lockForUpdate()->findOrFail($examinationId);
            $this->assertEditable($session);

            if ($session->serviceItems()->count() >= $this->complexity->maxServiceItemsPerExamination()) {
                throw ValidationException::withMessages([
                    'service_items' => 'Da dat gioi han '.$this->complexity->maxServiceItemsPerExamination().' dong dich vu/phien.',
                ]);
            }

            $service = Service::query()->findOrFail((int) $payload['service_id']);
            if ($service->status !== Service::STATUS_ACTIVE) {
                throw ValidationException::withMessages([
                    'service_id' => 'Dich vu khong con hoat dong (AC7).',
                ]);
            }

            $level = $payload['processing_level'] ?? ExaminationServiceItem::LEVEL_THONG_THUONG;
            if (! $this->complexity->isValidLevel($level)) {
                throw ValidationException::withMessages([
                    'processing_level' => 'Muc xu ly khong hop le.',
                ]);
            }

            // He so re-derive server-side tu UC17. Khong nhan tu client.
            $complexitySnapshot = $this->complexity->snapshotFor($service->id, $level, $actor);
            $coefficient = $complexitySnapshot['coefficient'];
            $unitPrice = $this->servicePrice->priceAt($service->id) ?? (float) ($service->price ?? 0);
            $quantity = max(1, (int) ($payload['quantity'] ?? 1));
            $subtotal = ExaminationServiceItem::recalcSubtotal($unitPrice, $quantity, $coefficient);

            $complexityReason = isset($payload['complexity_reason'])
                ? trim(strip_tags((string) $payload['complexity_reason']))
                : null;

            if ($coefficient > 0 && ! $complexityReason) {
                throw ValidationException::withMessages([
                    'complexity_reason' => 'Bat buoc nhap ly do khi he so phuc tap > 0 (VR7/AC11).',
                ]);
            }

            $item = ExaminationServiceItem::create([
                'examination_id' => $session->id,
                'service_id' => $service->id,
                'service_code_snapshot' => $service->service_code ?? ('SV'.$service->id),
                'service_name_snapshot' => $service->name,
                'tooth_codes' => $this->normalizeToothCodes($payload['tooth_codes'] ?? null),
                'processing_level' => $level,
                'complexity_coefficient' => $coefficient,
                'service_complexity_coefficient_id' => $complexitySnapshot['config_id'],
                'complexity_reason' => $complexityReason,
                'unit_price_snapshot' => $unitPrice,
                'quantity' => $quantity,
                'subtotal_snapshot' => $subtotal,
                'performed_by' => $actor->id,
            ]);

            $session->touch();

            ExaminationHistory::create([
                'examination_id' => $session->id,
                'action' => 'add_service',
                'actor_id' => $actor->id,
                'actor_name' => $actor->name,
                'after' => [
                    'service_item_id' => $item->id,
                    'service_id' => $service->id,
                    'service_name' => $service->name,
                    'processing_level' => $level,
                    'complexity_coefficient' => $coefficient,
                    'service_complexity_coefficient_id' => $complexitySnapshot['config_id'],
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'subtotal' => $subtotal,
                ],
                'created_at' => Carbon::now(),
            ]);

            $this->auditLog->log($actor, 'examination.add_service', [
                'examination_id' => $session->id,
                'service_item_id' => $item->id,
                'service_id' => $service->id,
            ]);

            return $item;
        });
    }

    /**
     * Sua dong dich vu (qty / processing_level / tooth_codes / lý do phuc tap).
     *
     * @param  array<string,mixed>  $payload
     */
    public function updateItem(int $examinationId, int $itemId, array $payload, User $actor): ExaminationServiceItem
    {
        return DB::transaction(function () use ($examinationId, $itemId, $payload, $actor) {
            $session = ExaminationSession::query()->lockForUpdate()->findOrFail($examinationId);
            $this->assertEditable($session);

            /** @var ExaminationServiceItem $item */
            $item = $session->serviceItems()
                ->where('id', $itemId)
                ->lockForUpdate()
                ->firstOrFail();

            // VR8 - khong sua khi da paid.
            if ($item->is_paid) {
                throw ValidationException::withMessages([
                    'service_item' => 'Dich vu da thanh toan khong duoc chinh sua (VR8/AC14).',
                ])->status(409);
            }

            // VR9 - chan khi ky luong da chot.
            if ($this->complexity->isPayrollPeriodLocked()) {
                throw ValidationException::withMessages([
                    'service_item' => 'Ky luong da chot - khong duoc chinh sua he so / dich vu (VR9/AC15).',
                ])->status(409);
            }

            $before = $item->only([
                'service_id', 'processing_level', 'complexity_coefficient',
                'service_complexity_coefficient_id', 'complexity_reason',
                'quantity', 'tooth_codes', 'subtotal_snapshot',
            ]);

            if (array_key_exists('processing_level', $payload)) {
                $level = $payload['processing_level'];
                if (! $this->complexity->isValidLevel($level)) {
                    throw ValidationException::withMessages([
                        'processing_level' => 'Muc xu ly khong hop le.',
                    ]);
                }
                $item->processing_level = $level;
                // Re-derive coefficient theo level moi (snapshot khi day vao DB).
                $complexitySnapshot = $this->complexity->snapshotFor($item->service_id, $level, $actor);
                $item->complexity_coefficient = $complexitySnapshot['coefficient'];
                $item->service_complexity_coefficient_id = $complexitySnapshot['config_id'];
            }

            if (array_key_exists('quantity', $payload)) {
                $item->quantity = max(1, (int) $payload['quantity']);
            }

            if (array_key_exists('tooth_codes', $payload)) {
                $item->tooth_codes = $this->normalizeToothCodes($payload['tooth_codes']);
            }

            if (array_key_exists('complexity_reason', $payload)) {
                $item->complexity_reason = $payload['complexity_reason'] !== null
                    ? trim(strip_tags((string) $payload['complexity_reason']))
                    : null;
            }

            if ((float) $item->complexity_coefficient > 0 && blank($item->complexity_reason)) {
                throw ValidationException::withMessages([
                    'complexity_reason' => 'Bat buoc nhap ly do khi he so phuc tap > 0 (VR7/AC11).',
                ]);
            }

            $item->subtotal_snapshot = ExaminationServiceItem::recalcSubtotal(
                (float) $item->unit_price_snapshot,
                (int) $item->quantity,
                (float) $item->complexity_coefficient,
            );
            $item->save();

            $session->touch();

            ExaminationHistory::create([
                'examination_id' => $session->id,
                'action' => 'update_service',
                'actor_id' => $actor->id,
                'actor_name' => $actor->name,
                'before' => $before,
                'after' => $item->only(array_keys($before)),
                'created_at' => Carbon::now(),
            ]);

            return $item->fresh();
        });
    }

    public function removeItem(int $examinationId, int $itemId, User $actor): void
    {
        DB::transaction(function () use ($examinationId, $itemId, $actor) {
            $session = ExaminationSession::query()->lockForUpdate()->findOrFail($examinationId);
            $this->assertEditable($session);

            /** @var ExaminationServiceItem $item */
            $item = $session->serviceItems()
                ->where('id', $itemId)
                ->lockForUpdate()
                ->firstOrFail();

            if ($item->is_paid) {
                throw ValidationException::withMessages([
                    'service_item' => 'Dich vu da thanh toan khong duoc xoa (VR8/AC14).',
                ])->status(409);
            }

            $before = $item->only(['service_id', 'service_name_snapshot', 'processing_level', 'quantity', 'subtotal_snapshot']);
            $item->delete();
            $session->touch();

            ExaminationHistory::create([
                'examination_id' => $session->id,
                'action' => 'remove_service',
                'actor_id' => $actor->id,
                'actor_name' => $actor->name,
                'before' => $before,
                'created_at' => Carbon::now(),
            ]);

            $this->auditLog->log($actor, 'examination.remove_service', [
                'examination_id' => $session->id,
                'service_item_id' => $itemId,
            ]);
        });
    }

    private function assertEditable(ExaminationSession $session): void
    {
        if (! $session->isEditable()) {
            throw ValidationException::withMessages([
                'status' => 'Phien khong o trang thai cho phep them/sua dich vu (SR).',
            ])->status(409);
        }
    }

    /**
     * Normalize danh sach tooth_codes - luon array<string> FDI (11..48) hoac null.
     *
     * @param  mixed  $value
     * @return list<string>|null
     */
    private function normalizeToothCodes($value): ?array
    {
        if ($value === null || $value === '' || $value === []) {
            return null;
        }
        $values = is_array($value) ? $value : [$value];
        $result = [];
        foreach ($values as $v) {
            $v = is_string($v) ? trim($v) : (string) $v;
            if ($v !== '' && preg_match('/^[1-4][1-8]$/', $v)) {
                $result[] = $v;
            }
        }

        return $result ?: null;
    }
}
