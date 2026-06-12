<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\ExaminationServiceItem;
use App\Models\ExaminationSession;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Patient;
use App\Models\PaymentTransaction;
use App\Models\Service;
use App\Models\Staff;
use App\Models\User;
use App\Models\WorkSchedule;
use App\Models\WorkShiftTemplate;
use Database\Seeders\Support\SampleData;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Du lieu mau lich lam viec + lam sang + tai chinh, trai ~24 thang (mau "SMP").
 *
 * - Tao ca lam viec cho MOI bac si tu dau cua so (~2 nam) den hom nay (T2-T7),
 *   co shift_template_id de resolve dung he so ca.
 * - Voi cac ngay da qua: sinh mot phan phien kham + DICH VU + HOA DON + THANH TOAN
 *   voi moc thoi gian LICH SU (theo ngay kham) => bao cao doanh thu / luong theo
 *   thang & nam (UC16-UC19) co du lieu thuc.
 * - Phu du trang thai hoa don: paid / partial / pending / cancelled / refunded.
 *
 * Noi dung lam sang lay tu SampleData (chan doan / ket luan thuc te, KHONG
 * placeholder). Tien to ma SMP chi dung trong TRUONG MA noi bo.
 *
 * Idempotent: ca lam updateOrCreate theo (staff_id, work_date); du lieu lam sang
 * + tai chinh xoa theo tien to ma roi tao lai.
 */
class SampleScheduleClinicalSeeder extends Seeder
{
    private array $levels = [
        ['level' => ExaminationServiceItem::LEVEL_THONG_THUONG, 'coef' => 0.0],
        ['level' => ExaminationServiceItem::LEVEL_KHO, 'coef' => 0.20],
        ['level' => ExaminationServiceItem::LEVEL_PHUC_TAP, 'coef' => 0.40],
        ['level' => ExaminationServiceItem::LEVEL_RAT_PHUC_TAP, 'coef' => 0.50],
    ];

    public function run(): void
    {
        $today = SampleData::today();

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
        if ($templates->isEmpty()) {
            return;
        }
        $rotation = ['morning', 'afternoon', 'evening'];

        $services = Service::query()->where('status', Service::STATUS_ACTIVE)->orderBy('id')->limit(10)->get();
        if ($services->isEmpty()) {
            return;
        }

        $patients = Patient::query()->orderBy('id')->limit(120)->get();
        if ($patients->isEmpty()) {
            return;
        }

        $this->clearOldClinical();

        $months = SampleData::months();

        // Chia nho theo bac si de moi transaction khong qua lon.
        foreach ($doctors as $di => $doctor) {
            DB::transaction(function () use ($doctor, $di, $months, $today, $admin, $templates, $rotation, $services, $patients) {
                $this->seedDoctor($doctor, $di, $months, $today, $admin, $templates, $rotation, $services, $patients);
            });
        }
    }

    private function seedDoctor(Staff $doctor, int $di, array $months, Carbon $today, ?User $admin, $templates, array $rotation, $services, $patients): void
    {
        $branchCode = $doctor->branch?->code ?? 'PK1-HN';
        $doctorUserId = $doctor->user_id;
        $patientCount = $patients->count();

        foreach ($months as $m) {
            /** @var Carbon $from */
            $from = $m['start'];
            /** @var Carbon $to */
            $to = $m['end'];

            $cursor = $from->copy();
            while ($cursor->lte($to)) {
                if ($cursor->isoWeekday() > 6) { // bo Chu nhat
                    $cursor->addDay();
                    continue;
                }

                $tplCode = $rotation[($cursor->day + $di) % count($rotation)];
                /** @var WorkShiftTemplate|null $tpl */
                $tpl = $templates[$tplCode] ?? null;
                if (! $tpl) {
                    $cursor->addDay();
                    continue;
                }

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
                        'notes' => 'Ca làm việc theo lịch phân công.',
                        'created_by' => $admin?->id,
                        'updated_by' => $admin?->id,
                    ]
                );

                // Chi sinh lam sang cho ngay da qua, ~1/3 so ngay lam.
                $isPast = $cursor->lte($today);
                if ($isPast && ($cursor->day % 3 === ($di % 3))) {
                    $seed = $doctor->id * 31 + $cursor->dayOfYear;
                    $patient = $patients[$seed % $patientCount];
                    $service = $services[$seed % $services->count()];
                    $lvl = $this->levels[$seed % count($this->levels)];

                    $this->seedClinicalAndBilling(
                        $doctor, $doctorUserId, $branchCode, $schedule, $cursor,
                        $patient, $service, $lvl, $seed, $admin
                    );
                }

                $cursor->addDay();
            }
        }
    }

    private function seedClinicalAndBilling(
        Staff $doctor, int $doctorUserId, string $branchCode, WorkSchedule $schedule, Carbon $date,
        Patient $patient, Service $service, array $lvl, int $seed, ?User $admin
    ): void {
        $startAt = $date->copy()->setTimeFromTimeString($schedule->start_time);
        $endAt = $date->copy()->setTimeFromTimeString($schedule->end_time);

        // Phan loai ket cuc tai chinh (deterministic): paid (0-5), partial (6-7),
        // pending (8), cancelled/refunded (9).
        $outcome = $seed % 10;
        $sessionStatus = in_array($outcome, [8, 6, 7], true)
            ? ExaminationSession::STATUS_CHO_THANH_TOAN
            : ExaminationSession::STATUS_HOAN_TAT;

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
            'checked_in_at' => $startAt->copy()->subMinutes(5),
            'checked_in_by' => $admin?->id,
            'notes' => SampleData::pick(SampleData::APPOINTMENT_NOTES, $seed),
        ]);

        $session = ExaminationSession::create([
            'code' => 'BA-SMP-'.$doctor->id.'-'.$date->format('Ymd'),
            'patient_id' => $patient->id,
            'appointment_id' => $apt->id,
            'doctor_id' => $doctorUserId,
            'work_schedule_id' => $schedule->id,
            'unlinked_shift' => false,
            'status' => $sessionStatus,
            'started_at' => $startAt,
            'completed_at' => $endAt,
            'completed_by' => $doctorUserId,
            'chief_complaint' => SampleData::pick(SampleData::CHIEF_COMPLAINTS, $seed),
            'symptoms' => SampleData::pick(SampleData::SYMPTOMS, $seed + 1),
            'diagnosis' => SampleData::pick(SampleData::DIAGNOSES, $seed + 2),
            'conclusion' => SampleData::pick(SampleData::CONCLUSIONS, $seed + 3),
            'treatment_outcome' => SampleData::pick(SampleData::TREATMENT_OUTCOMES, $seed + 4),
            'created_by' => $admin?->id,
            'updated_by' => $admin?->id,
        ]);

        $isPaid = $sessionStatus === ExaminationSession::STATUS_HOAN_TAT;
        $item = ExaminationServiceItem::create([
            'examination_id' => $session->id,
            'service_id' => $service->id,
            'service_code_snapshot' => $service->service_code,
            'service_name_snapshot' => $service->name,
            'tooth_codes' => [(string) (11 + ($seed % 8))],
            'processing_level' => $lvl['level'],
            'complexity_coefficient' => $lvl['coef'],
            'unit_price_snapshot' => $service->price,
            'quantity' => 1,
            'subtotal_snapshot' => ExaminationServiceItem::recalcSubtotal((float) $service->price, 1, $lvl['coef']),
            'performed_by' => $doctorUserId,
            'is_paid' => $isPaid,
        ]);

        $this->seedInvoice($outcome, $session, $apt, $patient, $doctor, $doctorUserId, $branchCode, $item, $endAt, $admin);
    }

    private function seedInvoice(
        int $outcome, ExaminationSession $session, Appointment $apt, Patient $patient,
        Staff $doctor, int $doctorUserId, string $branchCode, ExaminationServiceItem $item, Carbon $examEnd, ?User $admin
    ): void {
        $subtotal = (float) $item->subtotal_snapshot;
        $code = 'INV-SMP-'.$doctor->id.'-'.$examEnd->format('Ymd');
        $branchId = $this->branchId($branchCode);

        // Mac dinh: paid.
        $status = Invoice::STATUS_PAID;
        $amountPaid = $subtotal;
        $cancelled = false;
        $refunded = false;

        if (in_array($outcome, [6, 7], true)) {        // partial
            $status = Invoice::STATUS_PARTIAL;
            $amountPaid = round($subtotal * 0.4, 2);
        } elseif ($outcome === 8) {                     // pending
            $status = Invoice::STATUS_PENDING;
            $amountPaid = 0.0;
        } elseif ($outcome === 9) {                     // cancelled hoac refunded
            if ($examEnd->day % 2 === 0) {
                $status = Invoice::STATUS_CANCELLED;
                $amountPaid = 0.0;
                $cancelled = true;
            } else {
                $status = Invoice::STATUS_REFUNDED;
                $amountPaid = $subtotal;
                $refunded = true;
            }
        }

        $invoice = Invoice::create([
            'code' => $code,
            'examination_id' => $session->id,
            'appointment_id' => $apt->id,
            'patient_id' => $patient->id,
            'patient_name_snapshot' => $patient->full_name,
            'patient_phone_snapshot' => $patient->phone,
            'doctor_id' => $doctorUserId,
            'exam_date' => $examEnd,
            'branch_id' => $branchId,
            'subtotal' => $subtotal,
            'discount_amount' => 0,
            'surcharge_amount' => 0,
            'total' => $subtotal,
            'amount_paid' => $amountPaid,
            'amount_due' => $cancelled || $refunded ? 0.0 : max(0.0, $subtotal - $amountPaid),
            'status' => $status,
            'type' => Invoice::TYPE_MAIN,
            'created_by' => $admin?->id,
            'cancelled_by' => $cancelled ? $admin?->id : null,
            'cancelled_at' => $cancelled ? $examEnd->copy()->addHours(1) : null,
            'cancelled_reason' => $cancelled ? 'Bệnh nhân đổi ý, hủy dịch vụ trước khi thanh toán.' : null,
        ]);

        InvoiceItem::create([
            'invoice_id' => $invoice->id,
            'examination_service_item_id' => $item->id,
            'service_id' => $item->service_id,
            'service_code_snapshot' => $item->service_code_snapshot,
            'service_name_snapshot' => $item->service_name_snapshot,
            'tooth_codes' => $item->tooth_codes,
            'processing_level' => $item->processing_level,
            'complexity_coefficient' => $item->complexity_coefficient,
            'unit_price_snapshot' => $item->unit_price_snapshot,
            'quantity' => $item->quantity,
            'line_total' => $item->subtotal_snapshot,
        ]);

        // Thanh toan (moc thoi gian lich su = sau khi kham xong).
        if ($amountPaid > 0 && ! $cancelled) {
            PaymentTransaction::create([
                'code' => 'PT-SMP-'.$doctor->id.'-'.$examEnd->format('Ymd'),
                'invoice_id' => $invoice->id,
                'type' => PaymentTransaction::TYPE_PAYMENT,
                'method' => PaymentTransaction::METHOD_CASH,
                'amount' => $amountPaid,
                'reference_code' => null,
                'note' => 'Thanh toán tại quầy sau khi kết thúc điều trị.',
                'paid_by' => $admin?->id,
                'paid_at' => $examEnd->copy()->addMinutes(20),
            ]);
        }

        if ($refunded) {
            PaymentTransaction::create([
                'code' => 'PT-SMP-RF-'.$doctor->id.'-'.$examEnd->format('Ymd'),
                'invoice_id' => $invoice->id,
                'type' => PaymentTransaction::TYPE_REFUND,
                'method' => PaymentTransaction::METHOD_CASH,
                'amount' => $subtotal,
                'reference_code' => null,
                'note' => 'Hoàn tiền do bệnh nhân ngừng liệu trình.',
                'paid_by' => $admin?->id,
                'paid_at' => $examEnd->copy()->addDays(1),
            ]);
        }
    }

    private array $branchIdCache = [];

    private function branchId(string $branchCode): ?int
    {
        if (! array_key_exists($branchCode, $this->branchIdCache)) {
            $this->branchIdCache[$branchCode] = \App\Models\Branch::where('code', $branchCode)->value('id');
        }

        return $this->branchIdCache[$branchCode];
    }

    private function clearOldClinical(): void
    {
        PaymentTransaction::where('code', 'like', 'PT-SMP-%')->delete();
        InvoiceItem::whereHas('invoice', fn ($q) => $q->where('code', 'like', 'INV-SMP-%'))->delete();
        Invoice::where('code', 'like', 'INV-SMP-%')->delete();
        ExaminationServiceItem::whereHas('examination', fn ($q) => $q->where('code', 'like', 'BA-SMP-%'))->delete();
        ExaminationSession::where('code', 'like', 'BA-SMP-%')->delete();
        Appointment::where('code', 'like', 'SMP-APT-%')->delete();
    }
}
