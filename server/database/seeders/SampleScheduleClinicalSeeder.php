<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\ExaminationServiceItem;
use App\Models\ExaminationSession;
use App\Models\Patient;
use App\Models\Service;
use App\Models\Staff;
use App\Models\User;
use App\Models\WorkSchedule;
use App\Models\WorkShiftTemplate;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Du lieu mau lich lam viec + lam sang (mau "SMP").
 *
 * - Tao ca lam viec cho MOI bac si trong thang truoc + thang hien tai (T2-T7),
 *   co shift_template_id de UC15.2 resolve dung he so ca.
 * - Tao phien kham HOAN TAT da GAN ca (work_schedule_id) + dich vu co he so
 *   phuc tap > 0 => UC16 tinh ra luong khac 0 cho tat ca bac si.
 *
 * Idempotent: ca lam updateOrCreate theo (staff_id, work_date); du lieu lam sang
 * xoa theo tien to ma (BA-SMP-%, SMP-APT-%) roi tao lai.
 */
class SampleScheduleClinicalSeeder extends Seeder
{
    public function run(): void
    {
        $tz = 'Asia/Ho_Chi_Minh';
        $today = Carbon::now($tz)->startOfDay();
        $prevStart = $today->copy()->subMonthNoOverflow()->startOfMonth();
        $prevEnd = $prevStart->copy()->endOfMonth();
        $curStart = $today->copy()->startOfMonth();
        $curEnd = $today->copy()->endOfMonth();

        $doctors = Staff::query()
            ->where('role_slug', 'bac_si')
            ->where('status', 'working')
            ->whereNotNull('user_id')
            ->with('branch:id,code')
            ->get();
        if ($doctors->isEmpty()) {
            return;
        }

        $admin = User::where('username', 'admin')->first();
        $templates = WorkShiftTemplate::whereIn('code', ['morning', 'afternoon', 'evening'])
            ->get()->keyBy('code');
        $rotation = ['morning', 'afternoon', 'evening'];

        $services = Service::query()->where('status', Service::STATUS_ACTIVE)->orderBy('id')->limit(10)->get();
        if ($services->isEmpty()) {
            return;
        }

        $year = now()->format('Y');
        $patients = Patient::query()
            ->where('patient_code', 'like', 'BN'.$year.'1%')
            ->orderBy('id')
            ->get();
        if ($patients->isEmpty()) {
            $patients = Patient::query()->orderBy('id')->limit(50)->get();
        }

        $this->clearOldClinical();

        DB::transaction(function () use ($doctors, $prevStart, $prevEnd, $curStart, $curEnd, $today, $admin, $templates, $rotation, $services, $patients) {
            $levels = [
                ['level' => ExaminationServiceItem::LEVEL_KHO, 'coef' => 0.20],
                ['level' => ExaminationServiceItem::LEVEL_PHUC_TAP, 'coef' => 0.40],
                ['level' => ExaminationServiceItem::LEVEL_RAT_PHUC_TAP, 'coef' => 0.50],
            ];
            $patientIdx = 0;

            foreach ($doctors as $di => $doctor) {
                $branchCode = $doctor->branch?->code ?? 'PK1-HN';
                $doctorUserId = $doctor->user_id;

                // Tao ca lam cho ca 2 thang (T2-T7).
                $schedules = [];
                foreach ([[$prevStart, $prevEnd], [$curStart, $curEnd]] as [$from, $to]) {
                    $cursor = $from->copy();
                    while ($cursor->lte($to)) {
                        if ($cursor->isoWeekday() <= 6) { // T2..T7
                            $tplCode = $rotation[($cursor->day + $di) % count($rotation)];
                            $tpl = $templates[$tplCode] ?? null;
                            if ($tpl) {
                                $schedule = WorkSchedule::updateOrCreate(
                                    ['staff_id' => $doctor->id, 'work_date' => $cursor->toDateString()],
                                    [
                                        'branch_id' => $doctor->branch_id,
                                        'shift_template_id' => $tpl->id,
                                        'start_time' => $tpl->start_time,
                                        'end_time' => $tpl->end_time,
                                        'work_role' => 'doctor_treatment',
                                        'room' => 'P-'.str_pad((string) (($di % 9) + 1), 2, '0', STR_PAD_LEFT),
                                        'status' => WorkSchedule::STATUS_CONFIRMED,
                                        'notes' => 'Ca lam mau SMP.',
                                        'created_by' => $admin?->id,
                                        'updated_by' => $admin?->id,
                                    ]
                                );
                                $schedules[$cursor->toDateString()] = $schedule;
                            }
                        }
                        $cursor->addDay();
                    }
                }

                // Tao phien kham hoan tat da gan ca (chi ngay <= hom nay).
                foreach ($schedules as $dateStr => $schedule) {
                    $date = Carbon::parse($dateStr);
                    if ($date->gt($today)) {
                        continue;
                    }
                    // Thang truoc: lam ~1/2 so ngay; thang hien tai: ~1/3 ngay.
                    $inPrev = $date->lt($curStart);
                    if ($inPrev ? ($date->day % 2 !== 0) : ($date->day % 3 !== 0)) {
                        continue;
                    }

                    $patient = $patients[$patientIdx % $patients->count()];
                    $patientIdx++;
                    $service = $services[($di + $date->day) % $services->count()];
                    $lvl = $levels[($di + $date->day) % count($levels)];

                    $startAt = $date->copy()->setTimeFromTimeString($schedule->start_time);
                    $endAt = $date->copy()->setTimeFromTimeString($schedule->end_time);

                    $apt = Appointment::create([
                        'code' => 'SMP-APT-'.$doctor->id.'-'.$date->format('Ymd'),
                        'patient_id' => $patient->id,
                        'appointment_date' => $date->toDateString(),
                        'time_slot' => substr($schedule->start_time, 0, 5).' - '.substr($schedule->end_time, 0, 5),
                        'source' => Appointment::SOURCE_ONLINE,
                        'service_ids' => [(string) $service->id],
                        'branch_id' => $branchCode,
                        'status' => Appointment::STATUS_COMPLETED,
                        'assigned_doctor_id' => $doctorUserId,
                        'created_by' => $admin?->id,
                        'updated_by' => $admin?->id,
                        'notes' => 'Lich hen mau SMP.',
                    ]);

                    $session = ExaminationSession::create([
                        'code' => 'BA-SMP-'.$doctor->id.'-'.$date->format('Ymd'),
                        'patient_id' => $patient->id,
                        'appointment_id' => $apt->id,
                        'doctor_id' => $doctorUserId,
                        'work_schedule_id' => $schedule->id,
                        'unlinked_shift' => false,
                        'status' => ExaminationSession::STATUS_HOAN_TAT,
                        'started_at' => $startAt,
                        'completed_at' => $endAt,
                        'completed_by' => $doctorUserId,
                        'chief_complaint' => 'Kham va dieu tr: '.$service->name.'.',
                        'diagnosis' => 'Chan doan mau SMP.',
                        'conclusion' => 'Hoan tat dieu tri.',
                        'created_by' => $admin?->id,
                        'updated_by' => $admin?->id,
                    ]);

                    ExaminationServiceItem::create([
                        'examination_id' => $session->id,
                        'service_id' => $service->id,
                        'service_code_snapshot' => $service->service_code,
                        'service_name_snapshot' => $service->name,
                        'tooth_codes' => [(string) (10 + ($date->day % 8) + 1)],
                        'processing_level' => $lvl['level'],
                        'complexity_coefficient' => $lvl['coef'],
                        'unit_price_snapshot' => $service->price,
                        'quantity' => 1,
                        'subtotal_snapshot' => ExaminationServiceItem::recalcSubtotal((float) $service->price, 1, $lvl['coef']),
                        'performed_by' => $doctorUserId,
                        'is_paid' => true,
                    ]);
                }
            }
        });
    }

    private function clearOldClinical(): void
    {
        ExaminationServiceItem::whereHas('examination', fn ($q) => $q->where('code', 'like', 'BA-SMP-%'))->delete();
        ExaminationSession::where('code', 'like', 'BA-SMP-%')->delete();
        Appointment::where('code', 'like', 'SMP-APT-%')->delete();
    }
}
