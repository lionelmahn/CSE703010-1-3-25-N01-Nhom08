<?php

namespace App\Console\Commands;

use App\Jobs\SendNotificationJob;
use App\Models\AppNotification;
use Illuminate\Console\Command;

/**
 * UC10 - Quet app_notifications pending co scheduled_send_at <= now va
 * dispatch SendNotificationJob.
 */
class DispatchDueNotifications extends Command
{
    protected $signature = 'notifications:dispatch-due {--limit=200 : Toi da bao nhieu notification quet 1 lan}';

    protected $description = 'UC10 - Dispatch SendNotificationJob cho cac notification pending da den han (cron moi 5 phut).';

    public function handle(): int
    {
        $limit = max(1, (int) $this->option('limit'));

        $candidates = AppNotification::where('status', AppNotification::STATUS_PENDING)
            ->where(function ($q) {
                $q->whereNull('scheduled_send_at')
                    ->orWhere('scheduled_send_at', '<=', now());
            })
            ->orderBy('scheduled_send_at')
            ->orderBy('id')
            ->limit($limit)
            ->get();

        $dispatched = 0;
        foreach ($candidates as $notification) {
            SendNotificationJob::dispatch($notification->id);
            $dispatched++;
        }

        $this->info(sprintf('Dispatched %d notification job(s).', $dispatched));
        return self::SUCCESS;
    }
}
