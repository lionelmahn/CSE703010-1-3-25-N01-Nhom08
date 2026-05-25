<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Notification\PreviewNotificationTemplateRequest;
use App\Http\Requests\Notification\UpdateNotificationTemplateRequest;
use App\Models\AppNotificationTemplate;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * UC10 - REST API quan ly mau email he thong.
 */
class NotificationTemplateController extends Controller
{
    public function __construct(private readonly NotificationService $service)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = AppNotificationTemplate::query();

        if ($request->filled('q')) {
            $term = '%'.$request->input('q').'%';
            $query->where(function ($q) use ($term) {
                $q->where('code', 'like', $term)
                    ->orWhere('name', 'like', $term)
                    ->orWhere('subject', 'like', $term);
            });
        }
        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $templates = $query->orderBy('type')->get();

        return response()->json([
            'data' => $templates->map(fn ($t) => $this->transform($t))->all(),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $template = AppNotificationTemplate::with('updater:id,name')->findOrFail($id);
        return response()->json([
            'data' => $this->transform($template, includeBody: true),
        ]);
    }

    public function update(int $id, UpdateNotificationTemplateRequest $request): JsonResponse
    {
        $template = AppNotificationTemplate::findOrFail($id);
        $data = $request->validated();

        $template->fill($data);
        $template->updated_by = $request->user()->id;
        $template->version = ($template->version ?? 1) + 1;
        $template->save();

        return response()->json([
            'data' => $this->transform($template->fresh('updater'), includeBody: true),
            'message' => 'Da cap nhat mau email.',
        ]);
    }

    public function toggle(int $id, Request $request): JsonResponse
    {
        $template = AppNotificationTemplate::findOrFail($id);
        $template->is_active = $request->boolean('is_active', ! $template->is_active);
        $template->updated_by = $request->user()->id;
        $template->save();

        return response()->json([
            'data' => $this->transform($template->fresh()),
            'message' => $template->is_active ? 'Da bat mau email.' : 'Da tat mau email.',
        ]);
    }

    public function preview(int $id, PreviewNotificationTemplateRequest $request): JsonResponse
    {
        $template = AppNotificationTemplate::findOrFail($id);
        $vars = $request->input('vars', []);

        // Merge cac bien clinic mac dinh.
        $context = array_merge([
            'clinic_name' => config('clinic.name'),
            'clinic_logo_url' => config('clinic.logo_url'),
            'clinic_hotline' => config('clinic.hotline'),
            'clinic_email' => config('clinic.email'),
            'clinic_website' => config('clinic.website'),
            'clinic_address' => config('clinic.address'),
        ], is_array($vars) ? $vars : []);

        $rendered = $this->service->renderTemplate($template, $context);
        return response()->json([
            'data' => [
                'subject' => $rendered['subject'],
                'body_html' => $rendered['body_html'],
                'body_text' => $rendered['body_text'],
                'context' => $context,
            ],
        ]);
    }

    /**
     * @return array<string,mixed>
     */
    private function transform(AppNotificationTemplate $t, bool $includeBody = false): array
    {
        $data = [
            'id' => $t->id,
            'code' => $t->code,
            'type' => $t->type,
            'name' => $t->name,
            'subject' => $t->subject,
            'required_vars' => $t->required_vars ?? [],
            'is_active' => (bool) $t->is_active,
            'version' => $t->version,
            'updated_by' => $t->updated_by,
            'updated_by_name' => $t->relationLoaded('updater') ? $t->updater?->name : null,
            'updated_at' => $t->updated_at?->toIso8601String(),
            'created_at' => $t->created_at?->toIso8601String(),
        ];
        if ($includeBody) {
            $data['body_html'] = $t->body_html;
            $data['body_text'] = $t->body_text;
        }
        return $data;
    }
}
