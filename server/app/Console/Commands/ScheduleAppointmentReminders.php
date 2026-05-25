<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use App\Services\NotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

/**
 * UC10 - Quet appointment du dieu kien va tao reminder_24h pending.
 *
 * Idempotent - khong tao trung. Khong tao reminder cho cancelled/completed/
 * no_show (VR7). Khong tao neu appointment < 24h tu hien tai (AC22).
 */
class ScheduleAppointmentReminders extends Command
{
    protected $signature = 'notifications:schedule-reminders {--lookahead-hours=48 : Quet appointment trong cua so (gio)} {--dry-run : Khong tao notification, chi bao cao}';

    protected $description = 'UC10 - Tao reminder_24h cho appointment du dieu kien (cron moi 10-15 phut).';

    public function handle(NotificationService $service): int
    {
        $lookaheadHours = max(24, (int) $this->option('lookahead-hours'));
        $dryRun = (bool) $this->option('dry-run');

        $from = now();
        $to = now()->addHours($lookaheadHours);

        $appointments = Appointment::whereIn('status', [
                Appointment::STATUS_WAITING_DOCTOR_ASSIGNMENT,
                Appointment::STATUS_DOCTOR_ASSIGNED,
                Appointment::STATUS_CONFIRMED,
            ])
            ->whereBetween('appointment_date', [$from->toDateString(), $to->toDateString()])
            ->orderBy('appointment_date')
            ->get();

        $created = 0;
        $skipped = 0;

        foreach ($appointments as $appointment) {
            if ($dryRun) {
                $this->info(sprintf('[dry-run] would consider %s @ %s %s', $appointment->code, $appointment->appointment_date?->toDateString(), $appointment->time_slot));
                continue;
            }
            $notif = $service->scheduleReminder24h($appointment);
            if ($notif) {
                $created++;
                $this->line(sprintf('Reminder %s scheduled for %s', $notif->code, $appointment->code));
            } else {
                $skipped++;
            }
        }

        $this->info(sprintf('Done. created=%d skipped=%d total_candidates=%d', $created, $skipped, $appointments->count()));
        return self::SUCCESS;
    }
}
