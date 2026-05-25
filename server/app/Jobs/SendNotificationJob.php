<?php

namespace App\Jobs;

use App\Models\AppNotification;
use App\Models\Appointment;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * UC10 - Job gui 1 notification.
 *
 * Optimistic lock - chi gui notification dang pending. Voi reminder, re-check
 * trang thai appointment truoc khi gui de tranh gui reminder cho lich da huy.
 */
class SendNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    /**
     * Backoff (giay) cho 3 lan retry: 1 phut, 5 phut, 15 phut.
     *
     * @return array<int,int>
     */
    public function backoff(): array
    {
        return [60, 300, 900];
    }

    public function __construct(public int $notificationId)
    {
    }

    public function handle(NotificationService $service): void
    {
        /** @var AppNotification|null $notification */
        $notification = AppNotification::with('template')->find($this->notificationId);
        if (! $notification) {
            Log::warning('uc10.job.missing', ['id' => $this->notificationId]);
            return;
        }

        // Reminder - re-check trang thai appointment de tranh gui cho lich
        // cancelled/completed/no_show (VR7, AC10).
        if ($notification->type === AppNotification::TYPE_REMINDER_24H
            && $notification->appointment_id
        ) {
            $appointment = Appointment::find($notification->appointment_id);
            if (! $appointment || in_array($appointment->status, [
                Appointment::STATUS_CANCELLED,
                Appointment::STATUS_COMPLETED,
                Appointment::STATUS_NO_SHOW,
            ], true)) {
                $service->markCancelled($notification, null, 'appointment_not_active_at_send_time');
                return;
            }
        }

        if (! $service->markSending($notification)) {
            // Notification khong con o trang thai pending - bo qua.
            return;
        }

        $service->sendNow($notification);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('uc10.job.exhausted', [
            'id' => $this->notificationId,
            'error' => $exception->getMessage(),
        ]);

        $notification = AppNotification::find($this->notificationId);
        if ($notification && $notification->status === AppNotification::STATUS_SENDING) {
            $notification->status = AppNotification::STATUS_FAILED;
            $notification->error_code = 'JOB_EXHAUSTED';
            $notification->error_message = $exception->getMessage();
            $notification->save();
        }
    }
}
