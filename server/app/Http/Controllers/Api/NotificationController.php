<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Notification\ResendNotificationRequest;
use App\Http\Requests\Notification\SendManualNotificationRequest;
use App\Models\AppNotification;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * UC10 - REST API quan ly notification (UC10/AC20, AC15, A3, AC11).
 *
 * Controller chi dieu phoi - logic chi nh nam o NotificationService.
 */
class NotificationController extends Controller
{
    public function __construct(private readonly NotificationService $service)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only([
            'status', 'type', 'channel', 'source',
            'appointment_id', 'online_booking_request_id', 'patient_id',
            'date_from', 'date_to', 'q',
            'page', 'per_page',
            'sort_by', 'sort_dir',
        ]);

        $query = AppNotification::query()
            ->with(['template:id,code,name', 'sentByUser:id,name']);

        if (! empty($filters['status']) && $filters['status'] !== 'all') {
            // Cho phep status la CSV (vd "failed,pending").
            $statuses = array_filter(array_map('trim', explode(',', (string) $filters['status'])));
            if (! empty($statuses)) {
                $query->whereIn('status', $statuses);
            }
        }
        if (! empty($filters['type']) && $filters['type'] !== 'all') {
            $query->where('type', $filters['type']);
        }
        if (! empty($filters['channel']) && $filters['channel'] !== 'all') {
            $query->where('channel', $filters['channel']);
        }
        if (! empty($filters['source']) && $filters['source'] !== 'all') {
            $query->where('source', $filters['source']);
        }
        if (! empty($filters['appointment_id'])) {
            $query->where('appointment_id', $filters['appointment_id']);
        }
        if (! empty($filters['online_booking_request_id'])) {
            $query->where('online_booking_request_id', $filters['online_booking_request_id']);
        }
        if (! empty($filters['patient_id'])) {
            $query->where('patient_id', $filters['patient_id']);
        }
        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }
        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }
        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(function ($q) use ($term) {
                $q->where('code', 'like', $term)
                    ->orWhere('recipient_email', 'like', $term)
                    ->orWhere('recipient_name', 'like', $term)
                    ->orWhere('subject', 'like', $term);
            });
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDir = strtolower($filters['sort_dir'] ?? 'desc') === 'asc' ? 'asc' : 'desc';
        $allowedSort = ['created_at', 'scheduled_send_at', 'sent_at', 'status', 'type'];
        if (! in_array($sortBy, $allowedSort, true)) {
            $sortBy = 'created_at';
        }
        $query->orderBy($sortBy, $sortDir);

        $perPage = max(1, min(100, (int) ($filters['per_page'] ?? 20)));
        $paginator = $query->paginate($perPage);

        return response()->json([
            'data' => collect($paginator->items())->map(fn ($n) => $this->transform($n))->all(),
            'meta' => [
                'total' => $paginator->total(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
            ],
        ]);
    }

    public function counts(Request $request): JsonResponse
    {
        $query = AppNotification::query();
        foreach (['type', 'channel', 'source', 'appointment_id', 'online_booking_request_id', 'patient_id'] as $f) {
            $val = $request->input($f);
            if ($val !== null && $val !== '' && $val !== 'all') {
                $query->where($f, $val);
            }
        }

        $rows = (clone $query)
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $defaults = array_fill_keys(AppNotification::ALL_STATUSES, 0);
        $defaults['total'] = (clone $query)->count();

        return response()->json([
            'data' => array_merge($defaults, $rows),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $notification = AppNotification::with(['template', 'sentByUser:id,name', 'parent:id,code,status', 'children:id,code,status,created_at', 'events.actor:id,name'])
            ->findOrFail($id);

        return response()->json([
            'data' => $this->transform($notification, includeBody: true),
        ]);
    }

    public function resend(int $id, ResendNotificationRequest $request): JsonResponse
    {
        $notification = AppNotification::findOrFail($id);
        $created = $this->service->resend(
            $notification,
            $request->user(),
            $request->validated(),
        );

        return response()->json([
            'data' => $this->transform($created->fresh(['template', 'sentByUser']), includeBody: true),
            'message' => 'Da tao thong bao gui lai.',
        ]);
    }

    public function store(SendManualNotificationRequest $request): JsonResponse
    {
        $data = $request->validated();

        $options = [
            'appointment_id' => $data['appointment_id'] ?? null,
            'online_booking_request_id' => $data['online_booking_request_id'] ?? null,
            'recipient_email' => $data['recipient_email'] ?? null,
            'context_override' => [],
        ];

        if (! empty($data['note'])) {
            $options['context_override']['message_body'] = $data['note'];
        }

        $notification = $this->service->dispatchManual($data['type'], $request->user(), $options);

        return response()->json([
            'data' => $this->transform($notification->fresh(['template', 'sentByUser']), includeBody: true),
            'message' => 'Da tao thong bao gui thu cong.',
        ], 201);
    }

    public function cancel(int $id, Request $request): JsonResponse
    {
        $notification = AppNotification::findOrFail($id);
        $reason = $request->input('reason');
        $this->service->markCancelled($notification, $request->user(), $reason);

        return response()->json([
            'data' => $this->transform($notification->fresh()),
            'message' => 'Da huy thong bao.',
        ]);
    }

    /**
     * @return array<string,mixed>
     */
    private function transform(AppNotification $n, bool $includeBody = false): array
    {
        $data = [
            'id' => $n->id,
            'code' => $n->code,
            'type' => $n->type,
            'channel' => $n->channel,
            'status' => $n->status,
            'source' => $n->source,
            'online_booking_request_id' => $n->online_booking_request_id,
            'appointment_id' => $n->appointment_id,
            'patient_id' => $n->patient_id,
            'recipient_name' => $n->recipient_name,
            'recipient_email' => $n->recipient_email,
            'template_id' => $n->template_id,
            'template_code' => $n->template_code,
            'subject' => $n->subject,
            'scheduled_send_at' => $n->scheduled_send_at?->toIso8601String(),
            'sent_at' => $n->sent_at?->toIso8601String(),
            'sent_by_user_id' => $n->sent_by_user_id,
            'sent_by_user_name' => $n->sentByUser?->name,
            'error_code' => $n->error_code,
            'error_message' => $n->error_message,
            'retry_count' => $n->retry_count,
            'manual_resend_count' => $n->manual_resend_count,
            'parent_notification_id' => $n->parent_notification_id,
            'dedup_key' => $n->dedup_key,
            'created_at' => $n->created_at?->toIso8601String(),
            'updated_at' => $n->updated_at?->toIso8601String(),
        ];

        if ($includeBody) {
            $data['body_html'] = $n->body_html;
            $data['body_text'] = $n->body_text;
            $data['render_context'] = $n->render_context;
            if ($n->relationLoaded('events')) {
                $data['events'] = $n->events->map(fn ($e) => [
                    'id' => $e->id,
                    'event' => $e->event,
                    'actor_id' => $e->actor_id,
                    'actor_name' => $e->actor_name ?? $e->actor?->name,
                    'error_code' => $e->error_code,
                    'error_message' => $e->error_message,
                    'metadata' => $e->metadata,
                    'created_at' => $e->created_at?->toIso8601String(),
                ])->all();
            }
            if ($n->relationLoaded('parent') && $n->parent) {
                $data['parent'] = [
                    'id' => $n->parent->id,
                    'code' => $n->parent->code,
                    'status' => $n->parent->status,
                ];
            }
            if ($n->relationLoaded('children')) {
                $data['children'] = $n->children->map(fn ($c) => [
                    'id' => $c->id,
                    'code' => $c->code,
                    'status' => $c->status,
                    'created_at' => $c->created_at?->toIso8601String(),
                ])->all();
            }
        }

        return $data;
    }
}
