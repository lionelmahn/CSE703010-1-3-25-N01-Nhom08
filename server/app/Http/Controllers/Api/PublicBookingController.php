<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\TransformsBookingResponses;
use App\Http\Controllers\Controller;
use App\Http\Requests\OnlineBooking\StoreOnlineBookingRequest;
use App\Models\AppNotification;
use App\Models\Branch;
use App\Models\Service;
use App\Services\NotificationService;
use App\Services\OnlineBookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * UC6.1 - Endpoint public cho landing page.
 *
 * Cac route trong nhom nay khong yeu cau auth (khach truy cap landing chua
 * dang nhap). Token Sanctum khong duoc check.
 */
class PublicBookingController extends Controller
{
    use TransformsBookingResponses;

    public function __construct(
        private readonly OnlineBookingService $service,
        private readonly NotificationService $notifications,
    ) {
    }

    public function store(StoreOnlineBookingRequest $request): JsonResponse
    {
        $payload = $request->validated();

        // Frontend gui ca `note` lan `customer_note`. Bo qua phan `note`.
        if (isset($payload['note']) && empty($payload['customer_note'])) {
            $payload['customer_note'] = $payload['note'];
        }

        $created = $this->service->createFromPublicPayload(
            $payload,
            ip: $request->ip(),
            device: $request->userAgent(),
        );

        $notification = null;
        // UC10 - transaction nghiep vu da commit trong createFromPublicPayload().
        // Gui email tiep nhan ngay tai day; loi gui email khong rollback booking.
        try {
            $notification = $this->notifications->dispatchForOnlineBooking(
                AppNotification::TYPE_REQUEST_RECEIVED,
                $created,
            );
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json([
            'data' => $this->transformRequest($created),
            'code' => $created->code,
            'status' => $created->status,
            'submitted_at' => $created->submitted_at?->toIso8601String(),
            'email_sent' => $notification?->status === AppNotification::STATUS_SENT,
            'message' => 'Da tiep nhan yeu cau dat lich.',
        ], 201);
    }

    /**
     * UC6.1 - Cac catalog public.
     *
     * Frontend hien dung mock constants. De khong pha vo flow hien tai,
     * tra ve danh sach active. FE co the fallback ve mock neu rong.
     */
    public function services(Request $request): JsonResponse
    {
        $services = Service::query()
            ->where('status', 'active')
            ->where('visibility', 'public')
            ->orderBy('name')
            ->get(['id', 'service_code', 'name'])
            ->map(fn ($s) => [
                'id' => $s->service_code ?: (string) $s->id,
                'label' => $s->name,
                'active' => true,
            ]);

        return response()->json(['data' => $services]);
    }

    public function branches(Request $request): JsonResponse
    {
        $branches = Branch::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'code', 'name'])
            ->map(fn ($b) => [
                'id' => $b->code ?: (string) $b->id,
                'label' => $b->name,
                'active' => true,
            ]);

        return response()->json(['data' => $branches]);
    }

    public function timeSlots(Request $request): JsonResponse
    {
        // Catalog khung gio mac dinh - khop voi TIME_SLOTS frontend.
        // Bao gom ca slot "Nghi trua" de FE tu disable trong wizard.
        $slots = [
            ['id' => '08-09', 'label' => '08:00 - 09:00', 'start' => 480, 'end' => 540, 'break' => false],
            ['id' => '09-10', 'label' => '09:00 - 10:00', 'start' => 540, 'end' => 600, 'break' => false],
            ['id' => '10-11', 'label' => '10:00 - 11:00', 'start' => 600, 'end' => 660, 'break' => false],
            ['id' => '11-12', 'label' => '11:00 - 12:00', 'start' => 660, 'end' => 720, 'break' => false],
            ['id' => '12-13', 'label' => '12:00 - 13:00 (Nghi trua)', 'start' => 720, 'end' => 780, 'break' => true],
            ['id' => '13-14', 'label' => '13:00 - 14:00', 'start' => 780, 'end' => 840, 'break' => false],
            ['id' => '14-15', 'label' => '14:00 - 15:00', 'start' => 840, 'end' => 900, 'break' => false],
            ['id' => '15-16', 'label' => '15:00 - 16:00', 'start' => 900, 'end' => 960, 'break' => false],
            ['id' => '16-17', 'label' => '16:00 - 17:00', 'start' => 960, 'end' => 1020, 'break' => false],
            ['id' => '17-1730', 'label' => '17:00 - 17:30', 'start' => 1020, 'end' => 1050, 'break' => false],
        ];

        return response()->json(['data' => $slots]);
    }
}
