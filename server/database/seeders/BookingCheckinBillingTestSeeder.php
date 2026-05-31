<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\AppointmentQueueEntry;
use App\Models\AppointmentStatusHistory;
use App\Models\Branch;
use App\Models\ExaminationHistory;
use App\Models\ExaminationServiceItem;
use App\Models\ExaminationSession;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\OnlineBookingRequest;
use App\Models\OnlineBookingRequestHistory;
use App\Models\Patient;
use App\Models\PaymentTransaction;
use App\Models\Role;
use App\Models\Service;
use App\Models\Staff;
use App\Models\User;
use App\Models\WorkSchedule;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class BookingCheckinBillingTestSeeder extends Seeder
{
    private const TEST_DATE = '2026-06-01';
    private const BRANCH_CODE = 'PK1-HN';
    private const ADMIN_EMAIL = 'admin@dental.com';
    private const RECEPTIONIST_EMAIL = 'letan@dental.com';
    private const DOCTOR_EMAIL = 'bacsi@dental.com';
    private const PASSWORD = 'Dental@123';

    public function run(): void
    {
        DB::transaction(function () {
            $branch = $this->ensureBranch();
            $services = $this->ensureServices();

            $admin = $this->ensureKnownUser('admin', 'Admin Test', self::ADMIN_EMAIL, 'admin_test', 'ADTEST');
            $receptionist = $this->ensureKnownUser('le_tan', 'Le tan Test', self::RECEPTIONIST_EMAIL, 'letan_test', 'LTTEST');
            $doctor = $this->ensureKnownUser('bac_si', 'Bac si Nguyen A', self::DOCTOR_EMAIL, 'bacsi_test', 'BSTEST');

            $this->ensureStaffAndSchedule($doctor, $branch, 'doctor_treatment');
            $this->ensureStaffAndSchedule($receptionist, $branch, 'reception');
            $this->ensureStaffAndSchedule($admin, $branch, 'admin');

            $this->seedPendingOnlineBooking($services[0], $branch);
            $this->seedAppointmentWaitingAssignment($services[0], $branch, $receptionist);
            $this->seedAssignedReadyForCheckIn($services[0], $branch, $doctor, $receptionist);
            $this->seedCheckedInWaitingExam($services[0], $branch, $doctor, $receptionist);
            $this->seedInProgressExam($services[1], $branch, $doctor, $receptionist);
            $this->seedDraftExam($services[1], $branch, $doctor, $receptionist);
            $this->seedPendingInvoice($services[2], $branch, $doctor, $receptionist);
            $this->seedPaidInvoice($services[0], $branch, $doctor, $receptionist);
            $this->seedNoShowAppointment($services[1], $branch, $doctor, $receptionist);
            $this->seedCancelledAppointment($services[2], $branch, $doctor, $receptionist);
        });
    }

    private function seedPendingOnlineBooking(Service $service, Branch $branch): void
    {
        $patient = $this->ensurePatient('BNTEST-ONLINE', 'Test Dat Lich Online', '0918001000', 'test-online-pending@example.com');

        $this->upsertBooking(
            code: 'OLBTEST-PENDING',
            patient: $patient,
            service: $service,
            branch: $branch,
            status: OnlineBookingRequest::STATUS_PENDING,
            note: 'Seed case: yeu cau dat lich online moi, cho le tan xu ly.',
        );
    }

    private function seedAppointmentWaitingAssignment(Service $service, Branch $branch, User $actor): void
    {
        $patient = $this->ensurePatient('BNTEST-ASSIGN', 'Test Cho Phan Cong', '0918001001', 'test-waiting-assignment@example.com');
        $booking = $this->upsertBooking(
            code: 'OLBTEST-ASSIGNMENT',
            patient: $patient,
            service: $service,
            branch: $branch,
            status: OnlineBookingRequest::STATUS_APPOINTMENT_CREATED,
            note: 'Seed case: lich da tao, cho phan cong bac si.',
            processor: $actor,
        );

        $appointment = $this->upsertAppointment('APTTEST-ASSIGNMENT', $booking, $patient, $service, $branch, [
            'appointment_date' => self::TEST_DATE,
            'time_slot' => '0830-09',
            'status' => Appointment::STATUS_WAITING_DOCTOR_ASSIGNMENT,
            'assigned_doctor_id' => null,
            'created_by' => $actor->id,
            'updated_by' => $actor->id,
            'notes' => 'Seed case: dung de test tab cho phan cong bac si.',
        ]);

        $this->clearClinicalData($appointment);
        $this->history($appointment, 'seed_waiting_assignment', null, Appointment::STATUS_WAITING_DOCTOR_ASSIGNMENT, $actor);
    }

    private function seedAssignedReadyForCheckIn(Service $service, Branch $branch, User $doctor, User $actor): void
    {
        $patient = $this->ensurePatient('BNTEST-CHECKIN', 'Test Cho Checkin', '0918001002', 'test-checkin-ready@example.com');
        $booking = $this->upsertBooking(
            code: 'OLBTEST-CHECKIN',
            patient: $patient,
            service: $service,
            branch: $branch,
            status: OnlineBookingRequest::STATUS_APPOINTMENT_CREATED,
            note: 'Seed case: da phan cong bac si, cho le tan check-in.',
            processor: $actor,
        );

        $appointment = $this->upsertAppointment('APTTEST-CHECKIN', $booking, $patient, $service, $branch, [
            'appointment_date' => self::TEST_DATE,
            'time_slot' => '09-0930',
            'status' => Appointment::STATUS_DOCTOR_ASSIGNED,
            'assigned_doctor_id' => $doctor->id,
            'created_by' => $actor->id,
            'updated_by' => $actor->id,
            'notes' => 'Seed case: check-in lich nay de tao benh an cho_kham.',
        ]);

        $this->clearClinicalData($appointment);
        $this->history($appointment, 'seed_doctor_assigned', null, Appointment::STATUS_DOCTOR_ASSIGNED, $actor);
    }

    private function seedCheckedInWaitingExam(Service $service, Branch $branch, User $doctor, User $actor): void
    {
        $patient = $this->ensurePatient('BNTEST-WAITING', 'Test Cho Kham', '0918001003', 'test-waiting-exam@example.com');
        $booking = $this->upsertProcessedBooking('OLBTEST-WAITING', $patient, $service, $branch, $actor, 'Seed case: da check-in, co benh an cho kham.');
        $appointment = $this->upsertCheckedInAppointment('APTTEST-WAITING', $booking, $patient, $service, $branch, $doctor, $actor, '0930-10');
        $queue = $this->upsertQueue('W260601901', $appointment, $patient, $branch, $doctor, AppointmentQueueEntry::BUCKET_WAITING, 901, '09:25:00', $actor);
        $this->upsertSession('BA-2026-TEST01', $appointment, $patient, $queue, $doctor, ExaminationSession::STATUS_CHO_KHAM, $actor);
    }

    private function seedInProgressExam(Service $service, Branch $branch, User $doctor, User $actor): void
    {
        $patient = $this->ensurePatient('BNTEST-INPROG', 'Test Dang Kham', '0918001004', 'test-in-progress@example.com');
        $booking = $this->upsertProcessedBooking('OLBTEST-INPROGRESS', $patient, $service, $branch, $actor, 'Seed case: phien dang kham de test form benh an.');
        $appointment = $this->upsertAppointment('APTTEST-INPROGRESS', $booking, $patient, $service, $branch, [
            'appointment_date' => self::TEST_DATE,
            'time_slot' => '10-1030',
            'status' => Appointment::STATUS_IN_PROGRESS,
            'assigned_doctor_id' => $doctor->id,
            'pre_checkin_status' => Appointment::STATUS_DOCTOR_ASSIGNED,
            'checked_in_at' => $this->at('09:55:00'),
            'checked_in_by' => $actor->id,
            'arrival_flag' => Appointment::ARRIVAL_ON_TIME,
            'created_by' => $actor->id,
            'updated_by' => $doctor->id,
            'notes' => 'Seed case: dang kham, bac si co the sua form.',
        ]);

        $queue = $this->upsertQueue('W260601902', $appointment, $patient, $branch, $doctor, AppointmentQueueEntry::BUCKET_IN_PROGRESS, 902, '09:55:00', $actor, '10:00:00');
        $this->upsertSession('BA-2026-TEST02', $appointment, $patient, $queue, $doctor, ExaminationSession::STATUS_DANG_KHAM, $actor, [
            'started_at' => $this->at('10:00:00'),
            'chief_complaint' => 'Dau rang ham duoi.',
            'symptoms' => 'Dau am i khi nhai.',
            'diagnosis' => 'Nghi ngo sau rang.',
        ]);
    }

    private function seedDraftExam(Service $service, Branch $branch, User $doctor, User $actor): void
    {
        $patient = $this->ensurePatient('BNTEST-DRAFT', 'Test Ban Nhap', '0918001005', 'test-draft@example.com');
        $booking = $this->upsertProcessedBooking('OLBTEST-DRAFT', $patient, $service, $branch, $actor, 'Seed case: benh an ban nhap.');
        $appointment = $this->upsertAppointment('APTTEST-DRAFT', $booking, $patient, $service, $branch, [
            'appointment_date' => self::TEST_DATE,
            'time_slot' => '1030-11',
            'status' => Appointment::STATUS_IN_PROGRESS,
            'assigned_doctor_id' => $doctor->id,
            'pre_checkin_status' => Appointment::STATUS_DOCTOR_ASSIGNED,
            'checked_in_at' => $this->at('10:25:00'),
            'checked_in_by' => $actor->id,
            'arrival_flag' => Appointment::ARRIVAL_ON_TIME,
            'created_by' => $actor->id,
            'updated_by' => $doctor->id,
            'notes' => 'Seed case: ban nhap, tiep tuc kham va hoan tat.',
        ]);

        $queue = $this->upsertQueue('W260601903', $appointment, $patient, $branch, $doctor, AppointmentQueueEntry::BUCKET_IN_PROGRESS, 903, '10:25:00', $actor, '10:30:00');
        $session = $this->upsertSession('BA-2026-TEST03', $appointment, $patient, $queue, $doctor, ExaminationSession::STATUS_NHAP, $actor, [
            'started_at' => $this->at('10:30:00'),
            'chief_complaint' => 'E buot rang.',
            'diagnosis' => 'Viêm lợi nhẹ.',
            'conclusion' => 'Can cao voi va theo doi.',
        ]);
        $this->upsertServiceItem($session, $service, $doctor, 1, ['31', '32'], ExaminationServiceItem::LEVEL_THONG_THUONG, 0);
    }

    private function seedPendingInvoice(Service $service, Branch $branch, User $doctor, User $actor): void
    {
        $patient = $this->ensurePatient('BNTEST-PAYMENT', 'Test Cho Thanh Toan', '0918001006', 'test-pending-payment@example.com');
        $booking = $this->upsertProcessedBooking('OLBTEST-PAYMENT', $patient, $service, $branch, $actor, 'Seed case: da hoan tat kham, hoa don pending.');
        $appointment = $this->upsertCompletedAppointment('APTTEST-PAYMENT', $booking, $patient, $service, $branch, $doctor, $actor, '11-1130');
        $queue = $this->upsertQueue('W260601904', $appointment, $patient, $branch, $doctor, AppointmentQueueEntry::BUCKET_COMPLETED, 904, '10:55:00', $actor, '11:00:00', '11:20:00');
        $session = $this->upsertCompletedSession('BA-2026-TEST04', $appointment, $patient, $queue, $doctor, $actor, ExaminationSession::STATUS_CHO_THANH_TOAN, '11:00:00', '11:20:00');
        $item = $this->upsertServiceItem($session, $service, $doctor, 1, ['16'], ExaminationServiceItem::LEVEL_KHO, 0.2);
        $this->upsertInvoice('INV-2026-TEST01', $session, $appointment, $patient, $branch, $doctor, $actor, Invoice::STATUS_PENDING, [$item]);
    }

    private function seedPaidInvoice(Service $service, Branch $branch, User $doctor, User $actor): void
    {
        $patient = $this->ensurePatient('BNTEST-PAID', 'Test Da Thanh Toan', '0918001007', 'test-paid@example.com');
        $booking = $this->upsertProcessedBooking('OLBTEST-PAID', $patient, $service, $branch, $actor, 'Seed case: hoa don da thanh toan.');
        $appointment = $this->upsertCompletedAppointment('APTTEST-PAID', $booking, $patient, $service, $branch, $doctor, $actor, '1130-12');
        $queue = $this->upsertQueue('W260601905', $appointment, $patient, $branch, $doctor, AppointmentQueueEntry::BUCKET_COMPLETED, 905, '11:25:00', $actor, '11:30:00', '11:50:00');
        $session = $this->upsertCompletedSession('BA-2026-TEST05', $appointment, $patient, $queue, $doctor, $actor, ExaminationSession::STATUS_HOAN_TAT, '11:30:00', '11:50:00');
        $item = $this->upsertServiceItem($session, $service, $doctor, 2, ['11', '21'], ExaminationServiceItem::LEVEL_THONG_THUONG, 0, true);
        $invoice = $this->upsertInvoice('INV-2026-TEST02', $session, $appointment, $patient, $branch, $doctor, $actor, Invoice::STATUS_PAID, [$item]);
        $this->upsertPayment('PT-2026-TEST01', $invoice, $actor);
    }

    private function seedNoShowAppointment(Service $service, Branch $branch, User $doctor, User $actor): void
    {
        $patient = $this->ensurePatient('BNTEST-NOSHOW', 'Test Khong Den', '0918001008', 'test-no-show@example.com');
        $booking = $this->upsertProcessedBooking('OLBTEST-NOSHOW', $patient, $service, $branch, $actor, 'Seed case: lich khong den.');
        $appointment = $this->upsertAppointment('APTTEST-NOSHOW', $booking, $patient, $service, $branch, [
            'appointment_date' => self::TEST_DATE,
            'time_slot' => '14-1430',
            'status' => Appointment::STATUS_NO_SHOW,
            'assigned_doctor_id' => $doctor->id,
            'no_show_at' => $this->at('14:45:00'),
            'no_show_by' => $actor->id,
            'no_show_reason' => 'Khach khong den theo lich hen seed.',
            'created_by' => $actor->id,
            'updated_by' => $actor->id,
            'notes' => 'Seed case: kiem tra lich khong den.',
        ]);

        $this->clearClinicalData($appointment);
        $this->history($appointment, AppointmentStatusHistory::ACTION_NO_SHOW, Appointment::STATUS_DOCTOR_ASSIGNED, Appointment::STATUS_NO_SHOW, $actor);
    }

    private function seedCancelledAppointment(Service $service, Branch $branch, User $doctor, User $actor): void
    {
        $patient = $this->ensurePatient('BNTEST-CANCEL', 'Test Da Huy', '0918001009', 'test-cancelled@example.com');
        $booking = $this->upsertProcessedBooking('OLBTEST-CANCELLED', $patient, $service, $branch, $actor, 'Seed case: lich da huy.');
        $appointment = $this->upsertAppointment('APTTEST-CANCELLED', $booking, $patient, $service, $branch, [
            'appointment_date' => self::TEST_DATE,
            'time_slot' => '1430-15',
            'status' => Appointment::STATUS_CANCELLED,
            'assigned_doctor_id' => $doctor->id,
            'cancelled_at' => $this->at('13:30:00'),
            'cancel_reason' => 'Khach doi ke hoach.',
            'created_by' => $actor->id,
            'updated_by' => $actor->id,
            'notes' => 'Seed case: kiem tra lich da huy.',
        ]);

        $this->clearClinicalData($appointment);
        $this->history($appointment, AppointmentStatusHistory::ACTION_CANCELLED, Appointment::STATUS_DOCTOR_ASSIGNED, Appointment::STATUS_CANCELLED, $actor);
    }

    private function upsertProcessedBooking(string $code, Patient $patient, Service $service, Branch $branch, User $processor, string $note): OnlineBookingRequest
    {
        return $this->upsertBooking($code, $patient, $service, $branch, OnlineBookingRequest::STATUS_APPOINTMENT_CREATED, $note, $processor);
    }

    private function upsertBooking(
        string $code,
        Patient $patient,
        Service $service,
        Branch $branch,
        string $status,
        string $note,
        ?User $processor = null,
    ): OnlineBookingRequest {
        $booking = OnlineBookingRequest::updateOrCreate(
            ['code' => $code],
            [
                'name' => $patient->full_name,
                'phone' => $patient->phone,
                'email' => $patient->email,
                'need' => 'examination',
                'service_ids' => [(string) $service->id],
                'branch_id' => $branch->code,
                'preferred_date' => self::TEST_DATE,
                'preferred_time_slot' => '09-0930',
                'customer_note' => $note,
                'internal_note' => 'Seed test flow booking -> check-in -> benh an -> hoa don.',
                'status' => $status,
                'patient_id' => $patient->id,
                'processed_by' => $processor?->id,
                'processed_at' => $processor ? Carbon::now() : null,
                'email_status' => OnlineBookingRequest::EMAIL_STATUS_NONE,
                'source' => 'seed',
                'submitted_at' => Carbon::now()->subHours(2),
            ],
        );

        OnlineBookingRequestHistory::updateOrCreate(
            ['request_id' => $booking->id, 'action' => 'seed_created'],
            [
                'actor_id' => $processor?->id,
                'actor_name' => $processor?->name ?? 'Seeder',
                'note' => $note,
                'metadata' => ['seed_code' => $code],
                'created_at' => Carbon::now(),
            ],
        );

        return $booking;
    }

    private function upsertAppointment(string $code, OnlineBookingRequest $booking, Patient $patient, Service $service, Branch $branch, array $values): Appointment
    {
        $appointment = Appointment::updateOrCreate(
            ['code' => $code],
            array_merge([
                'online_booking_request_id' => $booking->id,
                'patient_id' => $patient->id,
                'appointment_date' => self::TEST_DATE,
                'source' => Appointment::SOURCE_ONLINE,
                'service_ids' => [(string) $service->id],
                'branch_id' => $branch->code,
            ], $values),
        );

        $booking->forceFill(['appointment_id' => $appointment->id])->save();

        return $appointment;
    }

    private function upsertCheckedInAppointment(string $code, OnlineBookingRequest $booking, Patient $patient, Service $service, Branch $branch, User $doctor, User $actor, string $slot): Appointment
    {
        return $this->upsertAppointment($code, $booking, $patient, $service, $branch, [
            'appointment_date' => self::TEST_DATE,
            'time_slot' => $slot,
            'status' => Appointment::STATUS_CHECKED_IN,
            'assigned_doctor_id' => $doctor->id,
            'pre_checkin_status' => Appointment::STATUS_DOCTOR_ASSIGNED,
            'checked_in_at' => $this->at('09:25:00'),
            'checked_in_by' => $actor->id,
            'arrival_flag' => Appointment::ARRIVAL_ON_TIME,
            'created_by' => $actor->id,
            'updated_by' => $actor->id,
            'notes' => 'Seed case: da check-in.',
        ]);
    }

    private function upsertCompletedAppointment(string $code, OnlineBookingRequest $booking, Patient $patient, Service $service, Branch $branch, User $doctor, User $actor, string $slot): Appointment
    {
        return $this->upsertAppointment($code, $booking, $patient, $service, $branch, [
            'appointment_date' => self::TEST_DATE,
            'time_slot' => $slot,
            'status' => Appointment::STATUS_COMPLETED,
            'assigned_doctor_id' => $doctor->id,
            'pre_checkin_status' => Appointment::STATUS_DOCTOR_ASSIGNED,
            'checked_in_at' => $this->at('10:55:00'),
            'checked_in_by' => $actor->id,
            'arrival_flag' => Appointment::ARRIVAL_ON_TIME,
            'created_by' => $actor->id,
            'updated_by' => $doctor->id,
            'notes' => 'Seed case: da hoan tat kham.',
        ]);
    }

    private function upsertQueue(
        string $code,
        Appointment $appointment,
        Patient $patient,
        Branch $branch,
        User $doctor,
        string $bucket,
        int $number,
        string $enteredAt,
        User $actor,
        ?string $startedAt = null,
        ?string $completedAt = null,
    ): AppointmentQueueEntry {
        return AppointmentQueueEntry::updateOrCreate(
            ['code' => $code],
            [
                'appointment_id' => $appointment->id,
                'patient_id' => $patient->id,
                'assigned_doctor_id' => $doctor->id,
                'branch_id' => $branch->code,
                'bucket' => $bucket,
                'queue_number' => $number,
                'entered_at' => $this->at($enteredAt),
                'started_at' => $startedAt ? $this->at($startedAt) : null,
                'completed_at' => $completedAt ? $this->at($completedAt) : null,
                'created_by' => $actor->id,
            ],
        );
    }

    private function upsertSession(
        string $code,
        Appointment $appointment,
        Patient $patient,
        AppointmentQueueEntry $queue,
        User $doctor,
        string $status,
        User $actor,
        array $values = [],
    ): ExaminationSession {
        $session = ExaminationSession::updateOrCreate(
            ['code' => $code],
            array_merge([
                'patient_id' => $patient->id,
                'appointment_id' => $appointment->id,
                'queue_entry_id' => $queue->id,
                'doctor_id' => $doctor->id,
                'status' => $status,
                'created_by' => $actor->id,
                'updated_by' => $actor->id,
            ], $values),
        );

        ExaminationHistory::updateOrCreate(
            ['examination_id' => $session->id, 'action' => 'created_from_seed'],
            [
                'actor_id' => $actor->id,
                'actor_name' => $actor->name,
                'after' => ['status' => $session->status, 'appointment_id' => $appointment->id],
                'reason' => 'Seed test data.',
                'created_at' => Carbon::now(),
            ],
        );

        return $session;
    }

    private function upsertCompletedSession(
        string $code,
        Appointment $appointment,
        Patient $patient,
        AppointmentQueueEntry $queue,
        User $doctor,
        User $actor,
        string $status,
        string $startedAt,
        string $completedAt,
    ): ExaminationSession {
        return $this->upsertSession($code, $appointment, $patient, $queue, $doctor, $status, $actor, [
            'started_at' => $this->at($startedAt),
            'completed_at' => $this->at($completedAt),
            'completed_by' => $doctor->id,
            'chief_complaint' => 'Dau rang khi an nhai.',
            'symptoms' => 'E buot theo dot.',
            'clinical_findings' => 'Co mang bam va lo sau nho.',
            'diagnosis' => 'Sau rang muc do nhe.',
            'clinical_notes' => 'Da giai thich ke hoach dieu tri.',
            'treatment_outcome' => 'Benh nhan on dinh sau dieu tri.',
            'conclusion' => 'Hoan tat dot kham.',
            'completion_note' => 'Du lieu seed da hoan tat.',
        ]);
    }

    private function upsertServiceItem(
        ExaminationSession $session,
        Service $service,
        User $doctor,
        int $quantity,
        array $toothCodes,
        string $level,
        float $coefficient,
        bool $paid = false,
    ): ExaminationServiceItem {
        $subtotal = ExaminationServiceItem::recalcSubtotal((float) $service->price, $quantity, $coefficient);

        return ExaminationServiceItem::updateOrCreate(
            ['examination_id' => $session->id, 'service_id' => $service->id],
            [
                'service_code_snapshot' => $service->service_code,
                'service_name_snapshot' => $service->name,
                'tooth_codes' => $toothCodes,
                'processing_level' => $level,
                'complexity_coefficient' => $coefficient,
                'complexity_reason' => $coefficient > 0 ? 'Seed: xu ly phuc tap hon muc thong thuong.' : null,
                'unit_price_snapshot' => $service->price,
                'quantity' => $quantity,
                'subtotal_snapshot' => $subtotal,
                'performed_by' => $doctor->id,
                'is_paid' => $paid,
            ],
        );
    }

    /**
     * @param  array<int,ExaminationServiceItem>  $items
     */
    private function upsertInvoice(string $code, ExaminationSession $session, Appointment $appointment, Patient $patient, Branch $branch, User $doctor, User $actor, string $status, array $items): Invoice
    {
        $subtotal = array_sum(array_map(fn (ExaminationServiceItem $item) => (float) $item->subtotal_snapshot, $items));
        $amountPaid = $status === Invoice::STATUS_PAID ? $subtotal : 0;

        Invoice::where('examination_id', $session->id)
            ->where('code', '!=', $code)
            ->delete();

        $invoice = Invoice::updateOrCreate(
            ['code' => $code],
            [
                'examination_id' => $session->id,
                'appointment_id' => $appointment->id,
                'patient_id' => $patient->id,
                'patient_name_snapshot' => $patient->full_name,
                'patient_phone_snapshot' => $patient->phone,
                'doctor_id' => $doctor->id,
                'exam_date' => $session->completed_at ?: Carbon::now(),
                'branch_id' => $branch->id,
                'subtotal' => $subtotal,
                'discount_amount' => 0,
                'surcharge_amount' => 0,
                'total' => $subtotal,
                'amount_paid' => $amountPaid,
                'amount_due' => max(0, $subtotal - $amountPaid),
                'status' => $status,
                'type' => Invoice::TYPE_MAIN,
                'created_by' => $actor->id,
            ],
        );

        foreach ($items as $item) {
            InvoiceItem::updateOrCreate(
                ['invoice_id' => $invoice->id, 'examination_service_item_id' => $item->id],
                [
                    'service_id' => $item->service_id,
                    'service_code_snapshot' => $item->service_code_snapshot,
                    'service_name_snapshot' => $item->service_name_snapshot,
                    'tooth_codes' => $item->tooth_codes,
                    'processing_level' => $item->processing_level,
                    'complexity_coefficient' => $item->complexity_coefficient,
                    'unit_price_snapshot' => $item->unit_price_snapshot,
                    'quantity' => $item->quantity,
                    'line_total' => $item->subtotal_snapshot,
                ],
            );
        }

        return $invoice;
    }

    private function upsertPayment(string $code, Invoice $invoice, User $actor): PaymentTransaction
    {
        return PaymentTransaction::updateOrCreate(
            ['code' => $code],
            [
                'invoice_id' => $invoice->id,
                'type' => PaymentTransaction::TYPE_PAYMENT,
                'method' => PaymentTransaction::METHOD_CASH,
                'amount' => $invoice->total,
                'reference_code' => null,
                'note' => 'Seed thanh toan tien mat.',
                'paid_by' => $actor->id,
                'paid_at' => $this->at('12:05:00'),
            ],
        );
    }

    private function clearClinicalData(Appointment $appointment): void
    {
        $sessions = ExaminationSession::where('appointment_id', $appointment->id)->get();
        foreach ($sessions as $session) {
            Invoice::where('examination_id', $session->id)->delete();
        }

        ExaminationSession::where('appointment_id', $appointment->id)->delete();
        AppointmentQueueEntry::where('appointment_id', $appointment->id)->delete();
    }

    private function history(Appointment $appointment, string $action, ?string $from, string $to, User $actor): void
    {
        AppointmentStatusHistory::updateOrCreate(
            ['appointment_id' => $appointment->id, 'action' => $action],
            [
                'from_status' => $from,
                'to_status' => $to,
                'reason' => 'Seed test data.',
                'metadata' => ['seed_code' => $appointment->code],
                'actor_id' => $actor->id,
                'actor_name' => $actor->name,
                'created_at' => Carbon::now(),
            ],
        );
    }

    /**
     * @return array<int,Service>
     */
    private function ensureServices(): array
    {
        $defs = [
            ['DVTEST001', 'Kham tong quat', 150000, 30],
            ['DVTEST002', 'Cao voi danh bong', 300000, 45],
            ['DVTEST003', 'Tram rang tham my', 450000, 45],
        ];

        return array_map(
            fn (array $def) => Service::updateOrCreate(
                ['service_code' => $def[0]],
                [
                    'name' => $def[1],
                    'price' => $def[2],
                    'duration_minutes' => $def[3],
                    'commission_rate' => 10,
                    'status' => Service::STATUS_ACTIVE,
                    'visibility' => Service::VISIBILITY_PUBLIC,
                ],
            ),
            $defs,
        );
    }

    private function ensurePatient(string $code, string $name, string $phone, string $email): Patient
    {
        return Patient::updateOrCreate(
            ['phone' => $phone],
            [
                'patient_code' => $code,
                'full_name' => $name,
                'email' => $email,
                'dob' => '1995-06-15',
                'gender' => 'Nam',
                'address' => 'Dia chi test seed',
                'medical_history' => 'Khong ghi nhan benh nen nghiem trong.',
                'allergies' => 'Chua ghi nhan di ung.',
                'source' => 'online',
                'status' => Patient::STATUS_ACTIVE,
                'is_active' => true,
            ],
        );
    }

    private function ensureBranch(): Branch
    {
        return Branch::firstOrCreate(
            ['code' => self::BRANCH_CODE],
            [
                'name' => 'Phong Kham Test - Ha Noi',
                'address' => '123 Test Seed',
                'city' => 'Ha Noi',
                'phone' => '0243-000-000',
                'status' => 'active',
            ],
        );
    }

    private function ensureKnownUser(string $roleSlug, string $name, string $email, string $username, string $employeeId): User
    {
        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'username' => $username,
                'employee_id' => $employeeId,
                'password' => Hash::make(self::PASSWORD),
                'status' => 'active',
            ],
        );

        if ($user->status !== 'active') {
            $user->forceFill(['status' => 'active'])->save();
        }

        $role = Role::where('slug', $roleSlug)->first();
        if ($role && ! $user->roles()->where('roles.id', $role->id)->exists()) {
            $user->roles()->attach($role->id);
        }

        return $user;
    }

    private function ensureStaffAndSchedule(User $user, Branch $branch, string $workRole): void
    {
        $roleSlug = $user->roles()->first()?->slug ?? 'bac_si';

        $staff = Staff::updateOrCreate(
            ['email' => $user->email],
            [
                'employee_code' => $user->employee_id ?: strtoupper(substr($roleSlug, 0, 2)).$user->id,
                'full_name' => $user->name,
                'phone' => '09'.str_pad((string) $user->id, 8, '0', STR_PAD_LEFT),
                'role_slug' => $roleSlug,
                'join_date' => '2024-01-01',
                'status' => 'working',
                'branch_id' => $branch->id,
                'user_id' => $user->id,
            ],
        );

        WorkSchedule::updateOrCreate(
            [
                'staff_id' => $staff->id,
                'work_date' => self::TEST_DATE,
                'work_role' => $workRole,
            ],
            [
                'branch_id' => $branch->id,
                'start_time' => '08:00:00',
                'end_time' => '18:00:00',
                'room' => $roleSlug === 'bac_si' ? 'P-Test-01' : null,
                'notes' => 'Seed ca lam viec de test booking/check-in/benh an.',
                'status' => WorkSchedule::STATUS_CONFIRMED,
                'created_by' => $user->id,
                'updated_by' => $user->id,
            ],
        );
    }

    private function at(string $time): Carbon
    {
        return Carbon::parse(self::TEST_DATE.' '.$time);
    }
}
