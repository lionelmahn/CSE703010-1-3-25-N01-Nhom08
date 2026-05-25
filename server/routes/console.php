<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('professional-profiles:expire')->dailyAt('01:00');

// UC10 - Quet appointment va tao reminder_24h pending.
Schedule::command('notifications:schedule-reminders')->everyTenMinutes();

// UC10 - Day cac notification pending da den scheduled_send_at vao queue.
Schedule::command('notifications:dispatch-due')->everyFiveMinutes();
