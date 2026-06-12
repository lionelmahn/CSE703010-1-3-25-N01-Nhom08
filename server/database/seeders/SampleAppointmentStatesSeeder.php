<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\AppointmentQueueEntry;
use App\Models\AppointmentStatusHistory;
use App\Models\ExaminationHistory;
use App\Models\ExaminationServiceItem;
use App\Models\ExaminationSession;
use App\Models\Patient;
use App\Models\Service;
use App\Models\Staff;
use App\Models\User;
use Database\Seeders\Support\SampleData;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Du lieu mau lich hen phu DU TRANG THAI cho man hinh tiep don / hang doi kham
 * (quanh hom nay): cho phan cong, da phan cong, da xac nhan, da check-in, dang
 * kham, hoan tat, da huy, doi lich, khong den + hang doi + phien kham dang dien ra.
 *
 * Noi dung thuc te (SampleData). Tien to ma SMP-AB- / Q-SMP- chi o truong ma.
 * Idempotent: xoa theo tien to ma roi tao lai.
 */
class SampleAppointmentStatesSeeder extends Seeder
{
    public function run(): void
    {
        $doctor = Staff::query()
            ->where('role_slug', 'bac_si')->where('status', 'working')
            ->whereNotNull('user_id')->orderBy('id')->first();
        if (! $doctor || ! $doctor->user_id) {
            return;
        }
        $doctorUserId = $doctor->user_id;
        $branchCode = $doctor->branch?->code ?? \App\Models\Branch::value('code') ?? 'PK1-HN';

        $actor = User::where('username', 'admin')->first();
        $patients = Patient::query()->orderBy('id')->limit(12)->get();
        if ($patients->count() < 9) {
            return;
        }
        $service = Service::query()->where('status', Service::STATUS_ACTIVE)->orderBy('id')->first();
        if (! $service) {
            return;
        }

        $today = SampleData::today();

        $this->clearOld();

        DB::transaction(function () use ($patients, $service, $branchCode, $doctorUserId, $actor, $today) {
            $i = 0;
            $p = fn () => $patients[$i++ % $patients->count()];

            // 1. Cho phan cong bac si.
            $this->makeAppt('SMP-AB-WAIT', $p(), $service, $branchCode, $today, '08:00 - 08:30',
                Appointment::STATUS_WAITING_DOCTOR_ASSIGNMENT, null, $actor, 0, $today);

            // 2. Da phan cong bac si.
            $this->makeAppt('SMP-AB-ASSIGNED', $p(), $service, $branchCode, $today, '08:30 - 09:00',
                Appointment::STATUS_DOCTOR_ASSIGNED, $doctorUserId, $actor, 1, $today);

            // 3. Da xac nhan.
            $this->makeAppt('SMP-AB-CONFIRMED', $p(), $service, $branchCode, $today, '09:00 - 09:30',
                Appointment::STATUS_CONFIRMED, $doctorUserId, $actor, 2, $today);

            // 4. Da check-in (+ hang doi waiting + phien cho_kham).
            $a4 = $this->makeAppt('SMP-AB-CHECKEDIN', $p4 = $p(), $service, $branchCode, $today, '09:30 - 10:00',
                Appointment::STATUS_CHECKED_IN, $doctorUserId, $actor, 3, $today,
                checkedInAt: $today->copy()->setTime(9, 25));
            $q4 = $this->makeQueue('Q-SMP-AB-01', $a4, $p4, $branchCode, $doctorUserId, AppointmentQueueEntry::BUCKET_WAITING, 1, $today->copy()->setTime(9, 25), $actor);
            $this->makeSession('BA-SMP-AB-CHO', $a4, $p4, $q4, $doctorUserId, ExaminationSession::STATUS_CHO_KHAM, $actor, 3);

            // 5. Dang kham (+ hang doi in_progress + phien dang_kham + dich vu).
            $a5 = $this->makeAppt('SMP-AB-INPROGRESS', $p5 = $p(), $service, $branchCode, $today, '10:00 - 10:30',
                Appointment::STATUS_IN_PROGRESS, $doctorUserId, $actor, 4, $today,
                checkedInAt: $today->copy()->setTime(9, 55));
            $q5 = $this->makeQueue('Q-SMP-AB-02', $a5, $p5, $branchCode, $doctorUserId, AppointmentQueueEntry::BUCKET_IN_PROGRESS, 2, $today->copy()->setTime(9, 55), $actor, $today->copy()->setTime(10, 0));
            $s5 = $this->makeSession('BA-SMP-AB-DANG', $a5, $p5, $q5, $doctorUserId, ExaminationSession::STATUS_DANG_KHAM, $actor, 5, [
                'started_at' => $today->copy()->setTime(10, 0),
            ]);
            $this->makeItem($s5, $service, $doctorUserId, 5);

            // 6. Hoan tat (+ hang doi completed).
            $a6 = $this->makeAppt('SMP-AB-COMPLETED', $p6 = $p(), $service, $branchCode, $today, '10:30 - 11:00',
                Appointment::STATUS_COMPLETED, $doctorUserId, $actor, 5, $today,
                checkedInAt: $today->copy()->setTime(10, 25));
            $this->makeQueue('Q-SMP-AB-03', $a6, $p6, $branchCode, $doctorUserId, AppointmentQueueEntry::BUCKET_COMPLETED, 3, $today->copy()->setTime(10, 25), $actor, $today->copy()->setTime(10, 30), $today->copy()->setTime(10, 55));

            // 7. Da huy.
            $this->makeAppt('SMP-AB-CANCELLED', $p(), $service, $branchCode, $today, '11:00 - 11:30',
                Appointment::STATUS_CANCELLED, $doctorUserId, $actor, 6, $today,
                cancelledAt: $today->copy()->setTime(8, 0),
                cancelReason: 'Khách hàng có việc đột xuất, xin hủy lịch.');

            // 8. Doi lich.
            $this->makeAppt('SMP-AB-RESCHEDULED', $p(), $service, $branchCode, $today, '13:30 - 14:00',
                Appointment::STATUS_RESCHEDULED, $doctorUserId, $actor, 7, $today,
                rescheduleReason: 'Dời sang ngày khác theo yêu cầu của khách.');

            // 9. Khong den (lich hom qua).
            $yesterday = $today->copy()->subDay();
            $this->makeAppt('SMP-AB-NOSHOW', $p(), $service, $branchCode, $yesterday, '14:00 - 14:30',
                Appointment::STATUS_NO_SHOW, $doctorUserId, $actor, 8, $yesterday,
                noShowAt: $yesterday->copy()->setTime(14, 30),
                noShowReason: 'Khách không đến và không liên lạc được.');
        });
    }

    private function makeAppt(
        string $code, Patient $patient, Service $service, string $branchCode, Carbon $date, string $slot,
        string $status, ?int $doctorUserId, ?User $actor, int $seed, Carbon $historyAt,
        ?Carbon $checkedInAt = null, ?Carbon $cancelledAt = null, ?string $cancelReason = null,
        ?Carbon $noShowAt = null, ?string $noShowReason = null, ?string $rescheduleReason = null
    ): Appointment {
        $appt = Appointment::create([
            'code' => $code,
            'patient_id' => $patient->id,
            'appointment_date' => $date->toDateString(),
            'time_slot' => $slot,
            'source' => Appointment::SOURCE_ONLINE,
            'service_ids' => [(string) $service->id],
            'branch_id' => $branchCode,
            'status' => $status,
            'assigned_doctor_id' => $doctorUserId,
            'created_by' => $actor?->id,
            'updated_by' => $actor?->id,
            'notes' => SampleData::pick(SampleData::APPOINTMENT_NOTES, $seed),
            'checked_in_at' => $checkedInAt,
            'checked_in_by' => $checkedInAt ? $actor?->id : null,
            'arrival_flag' => $checkedInAt ? Appointment::ARRIVAL_ON_TIME : null,
            'cancelled_at' => $cancelledAt,
            'cancel_reason' => $cancelReason,
            'no_show_at' => $noShowAt,
            'no_show_by' => $noShowAt ? $actor?->id : null,
            'no_show_reason' => $noShowReason,
            'reschedule_reason' => $rescheduleReason,
        ]);

        AppointmentStatusHistory::create([
            'appointment_id' => $appt->id,
            'action' => 'seed_state',
            'from_status' => null,
            'to_status' => $status,
            'reason' => 'Khởi tạo trạng thái cho dữ liệu mẫu tiếp đón.',
            'metadata' => ['seed_code' => $code],
            'actor_id' => $actor?->id,
            'actor_name' => $actor?->name ?? 'System',
            'created_at' => $historyAt,
        ]);

        return $appt;
    }

    private function makeQueue(
        string $code, Appointment $appt, Patient $patient, string $branchCode, int $doctorUserId,
        string $bucket, int $number, Carbon $enteredAt, ?User $actor, ?Carbon $startedAt = null, ?Carbon $completedAt = null
    ): AppointmentQueueEntry {
        return AppointmentQueueEntry::create([
            'code' => $code,
            'appointment_id' => $appt->id,
            'patient_id' => $patient->id,
            'assigned_doctor_id' => $doctorUserId,
            'branch_id' => $branchCode,
            'bucket' => $bucket,
            'queue_number' => $number,
            'entered_at' => $enteredAt,
            'started_at' => $startedAt,
            'completed_at' => $completedAt,
            'created_by' => $actor?->id,
        ]);
    }

    private function makeSession(
        string $code, Appointment $appt, Patient $patient, ?AppointmentQueueEntry $queue, int $doctorUserId,
        string $status, ?User $actor, int $seed, array $values = []
    ): ExaminationSession {
        $session = ExaminationSession::create(array_merge([
            'code' => $code,
            'patient_id' => $patient->id,
            'appointment_id' => $appt->id,
            'queue_entry_id' => $queue?->id,
            'doctor_id' => $doctorUserId,
            'status' => $status,
            'chief_complaint' => SampleData::pick(SampleData::CHIEF_COMPLAINTS, $seed),
            'symptoms' => SampleData::pick(SampleData::SYMPTOMS, $seed + 1),
            'diagnosis' => SampleData::pick(SampleData::DIAGNOSES, $seed + 2),
            'created_by' => $actor?->id,
            'updated_by' => $actor?->id,
        ], $values));

        ExaminationHistory::create([
            'examination_id' => $session->id,
            'action' => 'created_from_seed',
            'actor_id' => $actor?->id,
            'actor_name' => $actor?->name ?? 'System',
            'after' => ['status' => $session->status, 'appointment_id' => $appt->id],
            'reason' => 'Khởi tạo phiên khám từ dữ liệu mẫu.',
            'created_at' => Carbon::now(),
        ]);

        return $session;
    }

    private function makeItem(ExaminationSession $session, Service $service, int $doctorUserId, int $seed): void
    {
        ExaminationServiceItem::create([
            'examination_id' => $session->id,
            'service_id' => $service->id,
            'service_code_snapshot' => $service->service_code,
            'service_name_snapshot' => $service->name,
            'tooth_codes' => [(string) (11 + ($seed % 8))],
            'processing_level' => ExaminationServiceItem::LEVEL_THONG_THUONG,
            'complexity_coefficient' => 0,
            'unit_price_snapshot' => $service->price,
            'quantity' => 1,
            'subtotal_snapshot' => ExaminationServiceItem::recalcSubtotal((float) $service->price, 1, 0),
            'performed_by' => $doctorUserId,
            'is_paid' => false,
        ]);
    }

    private function clearOld(): void
    {
        ExaminationServiceItem::whereHas('examination', fn ($q) => $q->where('code', 'like', 'BA-SMP-AB-%'))->delete();
        ExaminationSession::where('code', 'like', 'BA-SMP-AB-%')->delete();
        AppointmentQueueEntry::where('code', 'like', 'Q-SMP-AB-%')->delete();
        AppointmentStatusHistory::where('metadata->seed_code', 'like', 'SMP-AB-%')->delete();
        Appointment::where('code', 'like', 'SMP-AB-%')->delete();
    }
}
