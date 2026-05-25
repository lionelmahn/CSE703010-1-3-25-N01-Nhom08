<?php

namespace App\Services;

use App\Jobs\SendNotificationJob;
use App\Mail\NotificationMail;
use App\Models\AppNotification;
use App\Models\AppNotificationEvent;
use App\Models\AppNotificationTemplate;
use App\Models\Appointment;
use App\Models\OnlineBookingRequest;
use App\Models\Patient;
use App\Models\Service;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * UC10 - Dieu phoi tao/render/gui notification.
 *
 * KHONG bao gio doi trang thai cua appointment/online_booking_request. UC10
 * chi rang buoc DOI ngoai (gui email + ghi log) - khong tac dong nghiep vu
 * (IR8).
 *
 * Flow chung:
 *   1. dispatch(type, context) -> tao row pending, sinh dedup_key, render
 *      san subject/body khi co context day du.
 *   2. SendNotificationJob hoac dispatchDue command pick-up row pending va
 *      gui Mail bang Mail::to(...)->send(new NotificationMail(...)).
 */
class NotificationService
{
    /**
     * Cac type duoc cho phep gui thu cong (UC10 - send_manual).
     */
    public const MANUAL_DISPATCH_TYPES = [
        AppNotification::TYPE_APPOINTMENT_CONFIRMATION,
        AppNotification::TYPE_APPOINTMENT_RESCHEDULED,
        AppNotification::TYPE_APPOINTMENT_CANCELLED,
        AppNotification::TYPE_ALTERNATIVE_PROPOSED,
        AppNotification::TYPE_REQUEST_REJECTED,
        AppNotification::TYPE_REQUEST_RECEIVED,
        AppNotification::TYPE_REMINDER_24H,
    ];

    /**
     * Dispatch 1 notification cho event nghiep vu.
     *
     * @param array<string,mixed> $options
     *   - online_booking_request_id?: int
     *   - appointment_id?: int
     *   - patient_id?: int
     *   - recipient_name?: string
     *   - recipient_email?: string
     *   - source?: string (auto_event|auto_schedule|manual)
     *   - sent_by_user_id?: int
     *   - scheduled_send_at?: \Illuminate\Support\Carbon|null
     *   - context_override?: array
     *   - dedup_key?: string
     *   - dispatch_job?: bool (default true - push job ngay sau khi tao)
     *   - parent_notification_id?: int
     */
    public function dispatch(string $type, array $options = []): ?AppNotification
    {
        $template = $this->resolveTemplate($type);
        if (! $template) {
            Log::warning('uc10.dispatch_no_template', ['type' => $type]);
            return null;
        }

        $context = $this->buildContext($type, $options);

        // Snapshot recipient.
        $recipientEmail = $options['recipient_email']
            ?? $context['recipient_email']
            ?? null;
        $recipientName = $options['recipient_name']
            ?? $context['recipient_name']
            ?? 'Quy khach';

        $dedupKey = $options['dedup_key']
            ?? $this->buildDedupKey($type, $options);

        // VR8 / NT8 - dedup. Neu da co notification pending/sending/sent cho
        // dedup_key thi bo qua (tru reminder co the cho phep tao moi sau
        // cancel - day la edge case se xu ly o scheduleReminder).
        if ($dedupKey) {
            $existing = AppNotification::where('dedup_key', $dedupKey)
                ->whereIn('status', [
                    AppNotification::STATUS_PENDING,
                    AppNotification::STATUS_SENDING,
                    AppNotification::STATUS_SENT,
                ])
                ->first();
            if ($existing) {
                return $existing;
            }
        }

        $rendered = null;
        $errorCode = null;
        $errorMessage = null;
        $status = AppNotification::STATUS_PENDING;

        if (empty($recipientEmail)) {
            $status = AppNotification::STATUS_FAILED;
            $errorCode = 'MISSING_EMAIL';
            $errorMessage = 'Khong co dia chi email cua nguoi nhan.';
        } else {
            try {
                $this->validateRequiredVars($template, $context);
                $rendered = $this->renderTemplate($template, $context);
            } catch (ValidationException $e) {
                $status = AppNotification::STATUS_FAILED;
                $errorCode = 'MISSING_VARS';
                $errorMessage = implode('; ', array_map(
                    fn ($items) => is_array($items) ? implode(', ', $items) : (string) $items,
                    $e->errors()
                ));
            } catch (\Throwable $e) {
                $status = AppNotification::STATUS_FAILED;
                $errorCode = 'RENDER_ERROR';
                $errorMessage = $e->getMessage();
            }
        }

        $scheduledAt = $options['scheduled_send_at'] ?? null;

        $notification = DB::transaction(function () use (
            $type, $template, $context, $options, $recipientEmail, $recipientName,
            $dedupKey, $status, $rendered, $errorCode, $errorMessage, $scheduledAt
        ) {
            return AppNotification::create([
                'code' => AppNotification::generateCode(),
                'type' => $type,
                'channel' => AppNotification::CHANNEL_EMAIL,
                'status' => $status,
                'source' => $options['source'] ?? AppNotification::SOURCE_AUTO_EVENT,
                'online_booking_request_id' => $options['online_booking_request_id'] ?? null,
                'appointment_id' => $options['appointment_id'] ?? null,
                'patient_id' => $options['patient_id'] ?? null,
                'recipient_name' => $recipientName,
                'recipient_email' => $recipientEmail ?? '',
                'template_id' => $template->id,
                'template_code' => $template->code,
                'subject' => $rendered['subject'] ?? null,
                'body_html' => $rendered['body_html'] ?? null,
                'body_text' => $rendered['body_text'] ?? null,
                'render_context' => $context,
                'scheduled_send_at' => $scheduledAt,
                'sent_at' => null,
                'sent_by_user_id' => $options['sent_by_user_id'] ?? null,
                'error_code' => $errorCode,
                'error_message' => $errorMessage,
                'retry_count' => 0,
                'manual_resend_count' => 0,
                'parent_notification_id' => $options['parent_notification_id'] ?? null,
                'dedup_key' => $dedupKey,
            ]);
        });

        $this->createEvent($notification, $status === AppNotification::STATUS_FAILED
            ? AppNotificationEvent::EVENT_FAILED
            : ($scheduledAt ? AppNotificationEvent::EVENT_SCHEDULED : AppNotificationEvent::EVENT_QUEUED), [
            'actor_id' => $options['sent_by_user_id'] ?? null,
            'actor_name' => $options['actor_name'] ?? null,
            'error_code' => $errorCode,
            'error_message' => $errorMessage,
            'metadata' => ['source' => $notification->source],
        ]);

        // Gui ngay notification khong hen lich de khong phu thuoc queue worker
        // cho cac email xac nhan tuc thoi.
        $dispatchJob = $options['dispatch_job'] ?? true;
        if ($dispatchJob
            && $notification->status === AppNotification::STATUS_PENDING
            && empty($scheduledAt)
        ) {
            SendNotificationJob::dispatchSync($notification->id);
            $notification->refresh();
        }

        return $notification;
    }

    /**
     * Tao notification thu cong (A3) - UI le tan/admin goi qua API.
     *
     * @param array<string,mixed> $options - giong dispatch + bat buoc actor.
     */
    public function dispatchManual(string $type, User $actor, array $options = []): AppNotification
    {
        if (! in_array($type, self::MANUAL_DISPATCH_TYPES, true)) {
            throw ValidationException::withMessages([
                'type' => 'Loai thong bao khong duoc phep gui thu cong.',
            ]);
        }

        $options['source'] = AppNotification::SOURCE_MANUAL;
        $options['sent_by_user_id'] = $actor->id;
        $options['actor_name'] = $actor->name;
        // Manual gui thu cong - khong dedup voi cac dispatch tu dong.
        $options['dedup_key'] = $options['dedup_key'] ?? sprintf(
            'manual:%s:%s:%s',
            $type,
            $options['appointment_id'] ?? $options['online_booking_request_id'] ?? 'na',
            now()->format('YmdHis')
        );

        $notification = $this->dispatch($type, $options);
        if (! $notification) {
            throw ValidationException::withMessages([
                'type' => 'Khong tim thay mau email tuong ung.',
            ]);
        }
        return $notification;
    }

    public function dispatchForOnlineBooking(string $type, OnlineBookingRequest $request, array $options = []): ?AppNotification
    {
        $patient = $request->patient_id ? Patient::find($request->patient_id) : null;

        $merged = array_merge([
            'online_booking_request_id' => $request->id,
            'appointment_id' => $request->appointment_id,
            'patient_id' => $request->patient_id,
            'recipient_name' => $request->name,
            'recipient_email' => $request->email ?: ($patient?->email),
            'context_override' => array_merge(
                ['_request' => $request, '_patient' => $patient],
                $options['context_override'] ?? []
            ),
        ], $options);

        return $this->dispatch($type, $merged);
    }

    public function dispatchForAppointment(string $type, Appointment $appointment, array $options = []): ?AppNotification
    {
        $patient = $appointment->patient_id
            ? ($appointment->relationLoaded('patient') ? $appointment->patient : Patient::find($appointment->patient_id))
            : null;

        $request = $appointment->online_booking_request_id
            ? OnlineBookingRequest::find($appointment->online_booking_request_id)
            : null;

        $merged = array_merge([
            'appointment_id' => $appointment->id,
            'online_booking_request_id' => $appointment->online_booking_request_id,
            'patient_id' => $appointment->patient_id,
            'recipient_name' => $patient?->full_name ?? $request?->name ?? 'Quy khach',
            'recipient_email' => $patient?->email ?? $request?->email,
            'context_override' => array_merge(
                ['_appointment' => $appointment, '_patient' => $patient, '_request' => $request],
                $options['context_override'] ?? []
            ),
        ], $options);

        return $this->dispatch($type, $merged);
    }

    /**
     * UC10 - Resend notification failed. Tao hang moi voi parent_notification_id
     * tro ve hang goc. Hang goc giu nguyen status va tang manual_resend_count.
     */
    public function resend(AppNotification $notification, ?User $actor = null, array $options = []): AppNotification
    {
        if ($notification->status !== AppNotification::STATUS_FAILED) {
            throw ValidationException::withMessages([
                'status' => 'Chi co the gui lai thong bao da that bai. Voi thong bao da gui thanh cong, su dung chuc nang gui thu cong.',
            ]);
        }

        $notification->manual_resend_count = ($notification->manual_resend_count ?? 0) + 1;
        $notification->save();

        $this->createEvent($notification, AppNotificationEvent::EVENT_RESEND_REQUESTED, [
            'actor_id' => $actor?->id,
            'actor_name' => $actor?->name,
            'metadata' => ['attempt' => $notification->manual_resend_count],
        ]);

        $recipientEmail = $options['override_email'] ?? $notification->recipient_email;

        return $this->dispatch($notification->type, [
            'online_booking_request_id' => $notification->online_booking_request_id,
            'appointment_id' => $notification->appointment_id,
            'patient_id' => $notification->patient_id,
            'recipient_name' => $notification->recipient_name,
            'recipient_email' => $recipientEmail,
            'source' => AppNotification::SOURCE_MANUAL,
            'sent_by_user_id' => $actor?->id,
            'actor_name' => $actor?->name,
            'parent_notification_id' => $notification->id,
            'dedup_key' => sprintf('resend:%s:%d', $notification->code, $notification->manual_resend_count),
            'context_override' => $notification->render_context ?? [],
        ]) ?? throw ValidationException::withMessages([
            'type' => 'Khong the tao thong bao gui lai.',
        ]);
    }

    /**
     * UC10 - Lap lich nhac 24h. Idempotent - khong tao trung neu da co reminder
     * pending/sent/sending cho appointment.
     */
    public function scheduleReminder24h(Appointment $appointment): ?AppNotification
    {
        if (in_array($appointment->status, [
            Appointment::STATUS_CANCELLED,
            Appointment::STATUS_COMPLETED,
            Appointment::STATUS_NO_SHOW,
        ], true)) {
            return null;
        }

        $apptDateTime = $this->resolveAppointmentDateTime($appointment);
        if (! $apptDateTime) {
            return null;
        }

        $scheduledAt = $apptDateTime->copy()->subHours(24);
        if ($scheduledAt->lt(now())) {
            // Khong tao reminder qua khu - AC22 / WF2.
            return null;
        }

        // Kiem tra trung.
        $existing = AppNotification::where('appointment_id', $appointment->id)
            ->where('type', AppNotification::TYPE_REMINDER_24H)
            ->whereIn('status', [
                AppNotification::STATUS_PENDING,
                AppNotification::STATUS_SENDING,
                AppNotification::STATUS_SENT,
            ])
            ->first();
        if ($existing) {
            return $existing;
        }

        return $this->dispatchForAppointment(AppNotification::TYPE_REMINDER_24H, $appointment, [
            'source' => AppNotification::SOURCE_AUTO_SCHEDULE,
            'scheduled_send_at' => $scheduledAt,
            'dedup_key' => sprintf('reminder24h:appointment:%d', $appointment->id),
            'dispatch_job' => false,
        ]);
    }

    public function cancelPendingReminders(Appointment $appointment, ?User $actor = null): int
    {
        $pending = AppNotification::where('appointment_id', $appointment->id)
            ->where('type', AppNotification::TYPE_REMINDER_24H)
            ->where('status', AppNotification::STATUS_PENDING)
            ->get();

        foreach ($pending as $notification) {
            $notification->status = AppNotification::STATUS_CANCELLED;
            $notification->save();
            $this->createEvent($notification, AppNotificationEvent::EVENT_CANCELLED, [
                'actor_id' => $actor?->id,
                'actor_name' => $actor?->name,
                'metadata' => ['reason' => 'appointment_cancelled_or_changed'],
            ]);
        }

        return $pending->count();
    }

    /**
     * UC10 - Khi appointment doi lich:
     *   - Neu thoi gian moi >= now + 24h: update scheduled_send_at cua reminder
     *     pending hien co (giu hang goc, in-place).
     *   - Neu thoi gian moi < now + 24h: cancel reminder pending hien co.
     */
    public function rescheduleReminders(Appointment $appointment, ?Carbon $newDateTime = null, ?User $actor = null): void
    {
        $newDateTime = $newDateTime ?? $this->resolveAppointmentDateTime($appointment);
        if (! $newDateTime) {
            $this->cancelPendingReminders($appointment, $actor);
            return;
        }

        $pendingReminders = AppNotification::where('appointment_id', $appointment->id)
            ->where('type', AppNotification::TYPE_REMINDER_24H)
            ->where('status', AppNotification::STATUS_PENDING)
            ->get();

        $newScheduledAt = $newDateTime->copy()->subHours(24);

        if ($newScheduledAt->lt(now())) {
            // Thoi gian moi qua gan - cancel.
            $this->cancelPendingReminders($appointment, $actor);
            // Khong tao moi (chi tu dong cho window 24h+).
            return;
        }

        if ($pendingReminders->isEmpty()) {
            // Khong co reminder pending san - tao moi.
            $this->scheduleReminder24h($appointment);
            return;
        }

        foreach ($pendingReminders as $notification) {
            $oldScheduledAt = $notification->scheduled_send_at?->toIso8601String();
            $notification->scheduled_send_at = $newScheduledAt;
            $notification->save();

            $this->createEvent($notification, AppNotificationEvent::EVENT_RESCHEDULED, [
                'actor_id' => $actor?->id,
                'actor_name' => $actor?->name,
                'metadata' => [
                    'from' => $oldScheduledAt,
                    'to' => $newScheduledAt->toIso8601String(),
                ],
            ]);
        }
    }

    public function resolveTemplate(string $type): ?AppNotificationTemplate
    {
        return AppNotificationTemplate::where('type', $type)
            ->where('is_active', true)
            ->orderByDesc('updated_at')
            ->first();
    }

    /**
     * Build render context cho template tu cac model lien quan.
     *
     * @param array<string,mixed> $options
     * @return array<string,mixed>
     */
    public function buildContext(string $type, array $options): array
    {
        $context = [
            'clinic_name' => config('clinic.name'),
            'clinic_logo_url' => config('clinic.logo_url'),
            'clinic_hotline' => config('clinic.hotline'),
            'clinic_email' => config('clinic.email'),
            'clinic_website' => config('clinic.website'),
            'clinic_address' => config('clinic.address'),
        ];

        $override = $options['context_override'] ?? [];
        /** @var \App\Models\OnlineBookingRequest|null $request */
        $request = $override['_request'] ?? null;
        /** @var \App\Models\Appointment|null $appointment */
        $appointment = $override['_appointment'] ?? null;
        /** @var \App\Models\Patient|null $patient */
        $patient = $override['_patient'] ?? null;

        if (! $request && ! empty($options['online_booking_request_id'])) {
            $request = OnlineBookingRequest::find($options['online_booking_request_id']);
        }
        if (! $appointment && ! empty($options['appointment_id'])) {
            $appointment = Appointment::find($options['appointment_id']);
        }
        if (! $patient && ! empty($options['patient_id'])) {
            $patient = Patient::find($options['patient_id']);
        }

        if ($request) {
            $context['request_code'] = $request->code;
            $context['recipient_name'] = $context['recipient_name'] ?? $request->name;
            $context['recipient_email'] = $context['recipient_email'] ?? $request->email;
            $context['recipient_phone'] = $request->phone;
            $context['preferred_date'] = $request->preferred_date?->format('d/m/Y');
            $context['preferred_time_slot'] = $request->preferred_time_slot;
            $context['proposed_slots'] = $request->proposed_slots ?? [];
            $context['reject_reason'] = $request->reject_reason;
            // KHONG truyen internal_note (VR11 - khong leak).
        }

        if ($appointment) {
            $context['appointment_code'] = $appointment->code;
            $context['appointment_date'] = $appointment->appointment_date?->format('d/m/Y');
            $context['appointment_time_slot'] = $appointment->time_slot;
            $context['reschedule_reason'] = $appointment->reschedule_reason;
            $context['cancel_reason'] = $appointment->cancel_reason;
            $context['services_list'] = $this->resolveServicesList($appointment->service_ids ?? []);
            $context['branch_id'] = $appointment->branch_id;
        }

        if ($patient) {
            $context['recipient_name'] = $context['recipient_name'] ?? $patient->full_name;
            $context['recipient_email'] = $context['recipient_email'] ?? $patient->email;
            $context['recipient_phone'] = $context['recipient_phone'] ?? $patient->phone;
            $context['patient_code'] = $patient->patient_code;
        }

        // Merge override (loai bo cac key noi bo _*).
        foreach ($override as $k => $v) {
            if (Str::startsWith($k, '_')) {
                continue;
            }
            $context[$k] = $v;
        }

        // Sanitize note - chi giu plain text.
        foreach (['message_body', 'reschedule_reason', 'cancel_reason', 'reject_reason'] as $field) {
            if (isset($context[$field]) && is_string($context[$field])) {
                $context[$field] = $this->sanitizeUserText($context[$field]);
            }
        }

        // Bao dam khong leak internal_note kim ky.
        unset($context['internal_note']);

        return $context;
    }

    /**
     * Render template + boc layout clinic. Tra ve [subject, body_html, body_text].
     */
    public function renderTemplate(AppNotificationTemplate $template, array $context): array
    {
        return [
            'subject' => $this->renderString($template->subject, $context),
            'body_html' => $this->renderString($template->body_html, $context),
            'body_text' => $template->body_text
                ? $this->renderString($template->body_text, $context)
                : null,
        ];
    }

    /**
     * @throws ValidationException neu thieu bien bat buoc.
     */
    public function validateRequiredVars(AppNotificationTemplate $template, array $context): void
    {
        $required = $template->required_vars ?? [];
        $missing = [];
        foreach ($required as $key) {
            if (! array_key_exists($key, $context) || $context[$key] === null || $context[$key] === '') {
                $missing[] = $key;
            }
        }
        if (! empty($missing)) {
            throw ValidationException::withMessages([
                'render_context' => 'Thieu bien bat buoc: '.implode(', ', $missing),
            ]);
        }
    }

    /**
     * Sanitize plain text input (note) - loai bo HTML/script de tranh XSS qua
     * email da render. Chi giu lai ky tu hop le.
     */
    public function sanitizeUserText(string $text): string
    {
        // Strip HTML tags + truncate de phong DoS.
        $clean = strip_tags($text);
        // Loai bo cac directive Blade nguy hiem neu user nhap.
        $clean = preg_replace('/@(php|verbatim|inject|include|extends|component|section|yield)\b/i', '', $clean) ?? $clean;
        return Str::limit(trim($clean), 2000, '...');
    }

    public function createEvent(AppNotification $notification, string $event, array $options = []): AppNotificationEvent
    {
        return AppNotificationEvent::create([
            'notification_id' => $notification->id,
            'event' => $event,
            'actor_id' => $options['actor_id'] ?? null,
            'actor_name' => $options['actor_name'] ?? null,
            'error_code' => $options['error_code'] ?? null,
            'error_message' => $options['error_message'] ?? null,
            'metadata' => $options['metadata'] ?? null,
            'created_at' => now(),
        ]);
    }

    public function markSending(AppNotification $notification): bool
    {
        // Optimistic lock - chi chuyen tu pending -> sending.
        $affected = AppNotification::where('id', $notification->id)
            ->where('status', AppNotification::STATUS_PENDING)
            ->update(['status' => AppNotification::STATUS_SENDING, 'updated_at' => now()]);

        if ($affected > 0) {
            $notification->refresh();
            $this->createEvent($notification, AppNotificationEvent::EVENT_SENDING);
            return true;
        }
        return false;
    }

    public function markSent(AppNotification $notification): void
    {
        $notification->status = AppNotification::STATUS_SENT;
        $notification->sent_at = now();
        $notification->error_code = null;
        $notification->error_message = null;
        $notification->save();

        $this->createEvent($notification, AppNotificationEvent::EVENT_SENT);
    }

    public function markFailed(AppNotification $notification, string $errorCode, string $errorMessage, bool $incrementRetry = true): void
    {
        $notification->status = AppNotification::STATUS_FAILED;
        $notification->error_code = Str::limit($errorCode, 64, '');
        $notification->error_message = $errorMessage;
        if ($incrementRetry) {
            $notification->retry_count = ($notification->retry_count ?? 0) + 1;
        }
        $notification->save();

        $this->createEvent($notification, AppNotificationEvent::EVENT_FAILED, [
            'error_code' => $errorCode,
            'error_message' => $errorMessage,
        ]);
    }

    public function markCancelled(AppNotification $notification, ?User $actor = null, ?string $reason = null): void
    {
        if (! in_array($notification->status, [
            AppNotification::STATUS_PENDING,
            AppNotification::STATUS_FAILED,
        ], true)) {
            throw ValidationException::withMessages([
                'status' => 'Chi co the huy thong bao o trang thai cho gui hoac that bai.',
            ]);
        }

        $notification->status = AppNotification::STATUS_CANCELLED;
        $notification->save();

        $this->createEvent($notification, AppNotificationEvent::EVENT_CANCELLED, [
            'actor_id' => $actor?->id,
            'actor_name' => $actor?->name,
            'metadata' => ['reason' => $reason],
        ]);
    }

    /**
     * Render 1 chuoi Blade voi context. Tu dong chuyen {{var}} thanh {{ $var }}.
     */
    private function renderString(?string $tpl, array $context): string
    {
        if ($tpl === null || $tpl === '') {
            return '';
        }
        // Chuyen {{var_name}} thanh {{ $var_name ?? '' }} de admin co the type
        // syntax mustache-style. Chap nhan A-Za-z0-9_ va dot.
        $normalized = preg_replace_callback(
            '/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/',
            fn ($m) => '{{ $'.$m[1]." ?? '' }}",
            $tpl
        ) ?? $tpl;

        // Tu dong sanitize cac directive nguy hiem.
        $normalized = preg_replace('/@(php|inject|include|extends)\b/i', '', $normalized) ?? $normalized;

        try {
            return Blade::render($normalized, $context);
        } catch (\Throwable $e) {
            Log::warning('uc10.render_failed', [
                'error' => $e->getMessage(),
                'template_excerpt' => Str::limit($tpl, 120),
            ]);
            // Fallback - chi sub mustache.
            return preg_replace_callback(
                '/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/',
                fn ($m) => (string) ($context[$m[1]] ?? ''),
                $tpl
            ) ?? $tpl;
        }
    }

    private function resolveAppointmentDateTime(Appointment $appointment): ?Carbon
    {
        if (! $appointment->appointment_date || ! $appointment->time_slot) {
            return null;
        }
        // time_slot format: "08-09", "13-14", "17-1730"... Lay token dau lam gio.
        $token = explode('-', $appointment->time_slot)[0];
        $hour = (int) substr($token, 0, 2);
        $minute = strlen($token) > 2 ? (int) substr($token, 2) : 0;
        try {
            return Carbon::parse($appointment->appointment_date->toDateString())
                ->setTime($hour, $minute);
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function buildDedupKey(string $type, array $options): ?string
    {
        if (! empty($options['appointment_id'])) {
            return sprintf('%s:appointment:%d', $type, $options['appointment_id']);
        }
        if (! empty($options['online_booking_request_id'])) {
            return sprintf('%s:request:%d', $type, $options['online_booking_request_id']);
        }
        return null;
    }

    /**
     * @param array<int,mixed> $serviceIds
     */
    private function resolveServicesList(array $serviceIds): string
    {
        if (empty($serviceIds)) {
            return '';
        }
        try {
            return Service::whereIn('id', $serviceIds)
                ->orWhereIn('service_code', $serviceIds)
                ->pluck('name')
                ->filter()
                ->implode(', ');
        } catch (\Throwable $e) {
            return '';
        }
    }

    /**
     * UC10 - Gui thuc te (dung trong job/command). Tra ve true/false.
     */
    public function sendNow(AppNotification $notification): bool
    {
        if ($notification->channel !== AppNotification::CHANNEL_EMAIL) {
            $this->markFailed($notification, 'UNSUPPORTED_CHANNEL', 'Sprint nay chi ho tro email.', false);
            return false;
        }

        if (empty($notification->recipient_email)) {
            $this->markFailed($notification, 'MISSING_EMAIL', 'Khong co dia chi email cua nguoi nhan.', false);
            return false;
        }

        // Re-render neu chua co (truong hop dispatch khi context con thieu).
        $subject = $notification->subject;
        $bodyHtml = $notification->body_html;
        $bodyText = $notification->body_text;

        if (empty($subject) || empty($bodyHtml)) {
            $template = $notification->template ?? $this->resolveTemplate($notification->type);
            if (! $template) {
                $this->markFailed($notification, 'TEMPLATE_NOT_FOUND', 'Mau email khong ton tai hoac da bi vo hieu.', false);
                return false;
            }
            try {
                $rendered = $this->renderTemplate($template, $notification->render_context ?? []);
                $subject = $rendered['subject'];
                $bodyHtml = $rendered['body_html'];
                $bodyText = $rendered['body_text'];

                $notification->subject = $subject;
                $notification->body_html = $bodyHtml;
                $notification->body_text = $bodyText;
                $notification->save();
            } catch (\Throwable $e) {
                $this->markFailed($notification, 'RENDER_ERROR', $e->getMessage(), false);
                return false;
            }
        }

        try {
            $mail = new NotificationMail($subject ?? '(no subject)', $bodyHtml ?? '', $bodyText);
            Mail::to($notification->recipient_email, $notification->recipient_name)->send($mail);
            $this->markSent($notification);
            return true;
        } catch (\Throwable $e) {
            Log::warning('uc10.send_failed', [
                'notification_code' => $notification->code,
                'error' => $e->getMessage(),
            ]);
            $this->markFailed($notification, 'SEND_ERROR', $e->getMessage(), true);
            return false;
        }
    }
}
