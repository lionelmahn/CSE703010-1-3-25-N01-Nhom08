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
use App\Models\Service;
use App\Models\Staff;
use App\Models\User;
use App\Models\WorkSchedule;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class BookingCheckinBillingTestSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            // 1. Get branch and services
            $branch = Branch::where('code', 'PK1-HN')->first();
            if (!$branch) {
                $branch = Branch::create([
                    'code' => 'PK1-HN',
                    'name' => 'Phòng Khám 1 - Hà Nội',
                    'address' => '123 Nguyễn Trãi, Q. Thanh Xuân, Hà Nội',
                    'city' => 'Hà Nội',
                    'phone' => '0243123456',
                    'status' => 'active',
                ]);
            }

            $services = $this->ensureServices();

            // 2. Retrieve existing users and staff from UserSeeder/StaffSeeder
            $adminStaff = Staff::where('employee_code', 'AD001')->firstOrFail();
            $doctorStaff = Staff::where('employee_code', 'BS001')->firstOrFail();
            $receptionistStaff = Staff::where('employee_code', 'LT001')->firstOrFail();
            $accountantStaff = Staff::where('employee_code', 'KT001')->firstOrFail();
            $lockedStaff = Staff::where('employee_code', 'LT002')->firstOrFail();

            $admin = $adminStaff->user;
            $doctor = $doctorStaff->user;
            $receptionist = $receptionistStaff->user;
            $accountant = $accountantStaff->user;
            $lockedUser = $lockedStaff->user;

            // Dates: Yesterday, Today, Tomorrow
            $yesterday = Carbon::yesterday();
            $today = Carbon::today();
            $tomorrow = Carbon::tomorrow();

            // 3. Create work schedules for Yesterday, Today, Tomorrow
            $this->ensureWorkSchedule($doctorStaff, $yesterday, 'doctor_treatment', $branch, $admin);
            $this->ensureWorkSchedule($doctorStaff, $today, 'doctor_treatment', $branch, $admin);
            $this->ensureWorkSchedule($doctorStaff, $tomorrow, 'doctor_treatment', $branch, $admin);

            $this->ensureWorkSchedule($receptionistStaff, $yesterday, 'reception', $branch, $admin);
            $this->ensureWorkSchedule($receptionistStaff, $today, 'reception', $branch, $admin);
            $this->ensureWorkSchedule($receptionistStaff, $tomorrow, 'reception', $branch, $admin);

            $this->ensureWorkSchedule($adminStaff, $today, 'admin', $branch, $admin);
            $this->ensureWorkSchedule($accountantStaff, $today, 'accountant', $branch, $admin);
            $this->ensureWorkSchedule($accountantStaff, $tomorrow, 'accountant', $branch, $admin);

            // 4. Ensure Patients (8 existing + 7 new)
            $patients = $this->ensurePatients($admin);

            // Clear old data for the test codes to avoid duplicates or FK issues
            $this->clearOldData();

            // 5. Seed Online Booking Requests
            $this->seedOnlineBookingRequests($patients, $services, $branch, $receptionist, $today, $yesterday, $tomorrow);

            // 6. Seed Appointments across Yesterday, Today, Tomorrow
            $this->seedAppointments($patients, $services, $branch, $doctor, $receptionist, $accountant, $yesterday, $today, $tomorrow);
        });
    }

    private function ensureServices(): array
    {
        $defs = [
            ['DVTEST001', 'Khám tổng quát', 150000, 30],
            ['DVTEST002', 'Cạo vôi đánh bóng', 300000, 45],
            ['DVTEST003', 'Trám răng thẩm mỹ', 450000, 45],
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
                ]
            ),
            $defs
        );
    }

    private function ensureWorkSchedule(Staff $staff, Carbon $date, string $workRole, Branch $branch, User $admin): WorkSchedule
    {
        return WorkSchedule::updateOrCreate(
            [
                'staff_id' => $staff->id,
                'work_date' => $date->toDateString(),
            ],
            [
                'branch_id' => $branch->id,
                'start_time' => '08:00:00',
                'end_time' => '18:00:00',
                'work_role' => $workRole,
                'room' => $staff->role_slug === 'bac_si' ? 'P-Test-01' : null,
                'notes' => 'Ca làm việc seed tự động.',
                'status' => WorkSchedule::STATUS_CONFIRMED,
                'created_by' => $admin->id,
                'updated_by' => $admin->id,
            ]
        );
    }

    private function ensurePatients(User $actor): array
    {
        // 8 existing patients will already be created by PatientSeeder
        // We will make sure they are in database and retrieve them, and create 7 new patients.
        $patients = [];
        $year = now()->format('Y');

        // Retrieve existing ones
        for ($i = 1; $i <= 8; $i++) {
            $code = 'BN'.$year.str_pad((string) $i, 5, '0', STR_PAD_LEFT);
            $p = Patient::where('patient_code', $code)->first();
            if ($p) {
                $patients[$code] = $p;
            }
        }

        // 7 new patients
        $newRecords = [
            ['code_seed' => 9,  'name' => 'Trần Quốc Anh',   'phone' => '0918001009', 'email' => 'tranquocanh@example.com'],
            ['code_seed' => 10, 'name' => 'Phan Bích Hà',     'phone' => '0918001010', 'email' => 'phanbichha@example.com'],
            ['code_seed' => 11, 'name' => 'Vũ Minh Hải',      'phone' => '0918001011', 'email' => 'vuminhhai@example.com'],
            ['code_seed' => 12, 'name' => 'Nguyễn Thị Mai',   'phone' => '0918001012', 'email' => 'nguyenthimai@example.com'],
            ['code_seed' => 13, 'name' => 'Lê Hoài Nam',      'phone' => '0918001013', 'email' => 'lehoainam@example.com'],
            ['code_seed' => 14, 'name' => 'Phạm Hoàng Long',  'phone' => '0918001014', 'email' => 'phamhoanglong@example.com'],
            ['code_seed' => 15, 'name' => 'Đặng Thu Thảo',    'phone' => '0918001015', 'email' => 'dangthuthao@example.com'],
        ];

        foreach ($newRecords as $row) {
            $code = 'BN'.$year.str_pad((string) $row['code_seed'], 5, '0', STR_PAD_LEFT);
            $p = Patient::updateOrCreate(
                ['patient_code' => $code],
                [
                    'full_name' => $row['name'],
                    'phone' => $row['phone'],
                    'email' => $row['email'],
                    'dob' => '1995-06-15',
                    'gender' => 'Nam',
                    'address' => 'Địa chỉ test seed',
                    'medical_history' => 'Không ghi nhận bệnh nền.',
                    'allergies' => 'Chưa ghi nhận dị ứng.',
                    'source' => 'Website',
                    'status' => Patient::STATUS_ACTIVE,
                    'is_active' => true,
                    'created_by' => $actor->id,
                    'updated_by' => $actor->id,
                ]
            );
            $patients[$code] = $p;
        }

        return $patients;
    }

    private function clearOldData(): void
    {
        // Delete dependent records first to avoid FK constraints
        PaymentTransaction::where('code', 'like', 'PT-TEST-%')->delete();
        InvoiceItem::whereHas('invoice', function ($q) {
            $q->where('code', 'like', 'INV-TEST-%');
        })->delete();
        Invoice::where('code', 'like', 'INV-TEST-%')->delete();

        ExaminationServiceItem::whereHas('examination', function ($q) {
            $q->where('code', 'like', 'BA-TEST-%');
        })->delete();
        // Since examination_tooth_chart is child of examination_sessions
        DB::table('examination_tooth_chart')->whereExists(function ($query) {
            $query->select(DB::raw(1))
                  ->from('examination_sessions')
                  ->whereRaw('examination_sessions.id = examination_tooth_chart.examination_id')
                  ->where('examination_sessions.code', 'like', 'BA-TEST-%');
        })->delete();

        ExaminationSession::where('code', 'like', 'BA-TEST-%')->delete();
        AppointmentQueueEntry::where('code', 'like', 'Q-TEST-%')->delete();
        AppointmentStatusHistory::where('metadata->seed_code', 'like', 'APT-TEST-%')->delete();
        
        // Remove linked appointment_id from online booking requests before deleting appointments
        OnlineBookingRequest::where('code', 'like', 'OLB-TEST-%')->update(['appointment_id' => null]);
        
        Appointment::where('code', 'like', 'APT-TEST-%')->delete();
        OnlineBookingRequest::where('code', 'like', 'OLB-TEST-%')->delete();
    }

    private function seedOnlineBookingRequests(array $patients, array $services, Branch $branch, User $receptionist, Carbon $today, Carbon $yesterday, Carbon $tomorrow): void
    {
        $year = now()->format('Y');

        // 1. OLB-PENDING-01: cho_xu_ly, New patient
        $this->createBooking(
            code: 'OLB-TEST-PENDING-01',
            patient: $patients['BN'.$year.'00009'],
            service: $services[0],
            branch: $branch,
            status: OnlineBookingRequest::STATUS_PENDING,
            date: $today,
            slot: '08:00 - 08:30',
            note: 'Yêu cầu đặt lịch online mới, chờ xử lý.',
            submittedAt: $today->copy()->subHours(2)
        );

        // 2. OLB-PENDING-02: cho_xu_ly, Existing patient (Nguyễn Văn An)
        $this->createBooking(
            code: 'OLB-TEST-PENDING-02',
            patient: $patients['BN'.$year.'00001'],
            service: $services[1],
            branch: $branch,
            status: OnlineBookingRequest::STATUS_PENDING,
            date: $today,
            slot: '09:00 - 09:30',
            note: 'Bệnh nhân cũ (Nguyễn Văn An) yêu cầu cạo vôi răng.',
            submittedAt: $today->copy()->subHours(1)
        );

        // 3. OLB-PROCESSING: dang_xu_ly, New patient
        $this->createBooking(
            code: 'OLB-TEST-PROCESSING',
            patient: $patients['BN'.$year.'00010'],
            service: $services[0],
            branch: $branch,
            status: OnlineBookingRequest::STATUS_PROCESSING,
            date: $today,
            slot: '10:00 - 10:30',
            note: 'Đang xử lý yêu cầu khám răng của Phan Bích Hà.',
            submittedAt: $today->copy()->subMinutes(45),
            processor: $receptionist
        );

        // 4. OLB-PROPOSED: de_xuat_lich_khac, New patient
        $this->createBooking(
            code: 'OLB-TEST-PROPOSED',
            patient: $patients['BN'.$year.'00011'],
            service: $services[2],
            branch: $branch,
            status: OnlineBookingRequest::STATUS_PROPOSE_OTHER,
            date: $tomorrow,
            slot: '14:00 - 14:30',
            note: 'Đề xuất đổi sang giờ khác vì giờ khách chọn đã kín lịch.',
            submittedAt: $today->copy()->subHours(3),
            processor: $receptionist,
            proposedSlots: [
                ['date' => $tomorrow->toDateString(), 'time_slot' => '15:00 - 15:30'],
                ['date' => $tomorrow->toDateString(), 'time_slot' => '16:00 - 16:30']
            ]
        );

        // 5. OLB-CONFIRMED: da_tao_lich_hen, New patient (will link to appointment later)
        $this->createBooking(
            code: 'OLB-TEST-CONFIRMED',
            patient: $patients['BN'.$year.'00012'],
            service: $services[1],
            branch: $branch,
            status: OnlineBookingRequest::STATUS_APPOINTMENT_CREATED,
            date: $today,
            slot: '11:00 - 11:30',
            note: 'Khách hàng đặt cạo vôi răng đã được xác nhận tạo lịch hẹn.',
            submittedAt: $today->copy()->subHours(4),
            processor: $receptionist
        );

        // 6. OLB-REJECTED: da_tu_choi, New patient
        $this->createBooking(
            code: 'OLB-TEST-REJECTED',
            patient: $patients['BN'.$year.'00013'],
            service: $services[0],
            branch: $branch,
            status: OnlineBookingRequest::STATUS_REJECTED,
            date: $today,
            slot: '15:00 - 15:30',
            note: 'Lễ tân đã gọi điện từ chối vì trùng lịch bác sĩ và khách không đổi giờ.',
            submittedAt: $today->copy()->subHours(5),
            processor: $receptionist,
            rejectReason: 'Khách hàng bận, không đồng ý dời lịch sang giờ khác.'
        );

        // 7. OLB-EXPIRED: qua_han_xu_ly, New patient
        $this->createBooking(
            code: 'OLB-TEST-EXPIRED',
            patient: $patients['BN'.$year.'00014'],
            service: $services[1],
            branch: $branch,
            status: OnlineBookingRequest::STATUS_EXPIRED,
            date: $yesterday,
            slot: '08:00 - 08:30',
            note: 'Yêu cầu tự động hết hạn do không được xử lý trước giờ khám.',
            submittedAt: $yesterday->copy()->subDays(2)
        );
    }

    private function createBooking(
        string $code,
        Patient $patient,
        Service $service,
        Branch $branch,
        string $status,
        Carbon $date,
        string $slot,
        string $note,
        Carbon $submittedAt,
        ?User $processor = null,
        ?array $proposedSlots = null,
        ?string $rejectReason = null
    ): OnlineBookingRequest {
        $booking = OnlineBookingRequest::create([
            'code' => $code,
            'name' => $patient->full_name,
            'phone' => $patient->phone,
            'email' => $patient->email,
            'need' => 'examination',
            'service_ids' => [(string) $service->id],
            'branch_id' => $branch->code,
            'preferred_date' => $date->toDateString(),
            'preferred_time_slot' => $slot,
            'customer_note' => $note,
            'status' => $status,
            'patient_id' => $patient->id,
            'processed_by' => $processor?->id,
            'processed_at' => $processor ? Carbon::now() : null,
            'email_status' => OnlineBookingRequest::EMAIL_STATUS_NONE,
            'source' => 'landing_page',
            'submitted_at' => $submittedAt,
            'proposed_slots' => $proposedSlots,
            'reject_reason' => $rejectReason,
        ]);

        OnlineBookingRequestHistory::create([
            'request_id' => $booking->id,
            'action' => 'created_from_seed',
            'actor_id' => $processor?->id,
            'actor_name' => $processor?->name ?? 'System',
            'note' => 'Yêu cầu được khởi tạo từ landing page (Seed).',
            'metadata' => ['seed_code' => $code],
            'created_at' => $submittedAt,
        ]);

        return $booking;
    }

    private function seedAppointments(
        array $patients,
        array $services,
        Branch $branch,
        User $doctor,
        User $receptionist,
        User $accountant,
        Carbon $yesterday,
        Carbon $today,
        Carbon $tomorrow
    ): void {
        $year = now()->format('Y');

        // Yesterday's Appointments
        // 1. APT-TEST-COMPLETED-Y1: hoan_tat, Patient: BN...01, Doctor: bacsi_a
        $aptY1 = $this->createAppointment(
            code: 'APT-TEST-COMPLETED-Y1',
            patient: $patients['BN'.$year.'00001'],
            service: $services[0],
            branch: $branch,
            date: $yesterday,
            slot: '09:00 - 09:30',
            status: Appointment::STATUS_COMPLETED,
            doctor: $doctor,
            creator: $receptionist,
            notes: 'Khám tổng quát định kỳ.',
            checkedInAt: $yesterday->copy()->setTime(8, 55, 0),
            checkedInBy: $receptionist
        );
        $this->history($aptY1, 'completed_yesterday', null, Appointment::STATUS_COMPLETED, $receptionist);

        // 2. APT-TEST-NOSHOW-Y1: khong_den, Patient: BN...02, Doctor: bacsi_a
        $aptY2 = $this->createAppointment(
            code: 'APT-TEST-NOSHOW-Y1',
            patient: $patients['BN'.$year.'00002'],
            service: $services[1],
            branch: $branch,
            date: $yesterday,
            slot: '14:00 - 14:30',
            status: Appointment::STATUS_NO_SHOW,
            doctor: $doctor,
            creator: $receptionist,
            notes: 'Cạo vôi răng.',
            noShowAt: $yesterday->copy()->setTime(14, 45, 0),
            noShowBy: $receptionist,
            noShowReason: 'Khách hàng không đến đúng giờ hẹn và không bắt máy khi gọi.'
        );
        $this->history($aptY2, AppointmentStatusHistory::ACTION_NO_SHOW, Appointment::STATUS_CONFIRMED, Appointment::STATUS_NO_SHOW, $receptionist);

        // Today's Appointments
        // 3. APT-TEST-WAITING: cho_phan_cong_bac_si, Patient: BN...03
        $aptT1 = $this->createAppointment(
            code: 'APT-TEST-WAITING',
            patient: $patients['BN'.$year.'00003'],
            service: $services[0],
            branch: $branch,
            date: $today,
            slot: '08:30 - 09:00',
            status: Appointment::STATUS_WAITING_DOCTOR_ASSIGNMENT,
            doctor: null,
            creator: $receptionist,
            notes: 'Khách đặt qua hotline.'
        );
        $this->history($aptT1, 'created', null, Appointment::STATUS_WAITING_DOCTOR_ASSIGNMENT, $receptionist);

        // 4. APT-TEST-ASSIGNED: da_phan_cong_bac_si, Patient: BN...04
        $aptT2 = $this->createAppointment(
            code: 'APT-TEST-ASSIGNED',
            patient: $patients['BN'.$year.'00004'],
            service: $services[1],
            branch: $branch,
            date: $today,
            slot: '09:30 - 10:00',
            status: Appointment::STATUS_DOCTOR_ASSIGNED,
            doctor: $doctor,
            creator: $receptionist,
            notes: 'Cạo vôi răng thường.'
        );
        $this->history($aptT2, 'assigned', Appointment::STATUS_WAITING_DOCTOR_ASSIGNMENT, Appointment::STATUS_DOCTOR_ASSIGNED, $receptionist);

        // 5. APT-TEST-CONFIRMED: da_xac_nhan, Patient: BN...12 (OLB-CONFIRMED link)
        $bookingConfirmed = OnlineBookingRequest::where('code', 'OLB-TEST-CONFIRMED')->first();
        $aptT3 = $this->createAppointment(
            code: 'APT-TEST-CONFIRMED',
            patient: $patients['BN'.$year.'00012'],
            service: $services[1],
            branch: $branch,
            date: $today,
            slot: '11:00 - 11:30',
            status: Appointment::STATUS_CONFIRMED,
            doctor: $doctor,
            creator: $receptionist,
            notes: 'Lịch hẹn tạo từ yêu cầu Online Booking đã xác nhận.',
            booking: $bookingConfirmed
        );
        $this->history($aptT3, 'confirmed', Appointment::STATUS_DOCTOR_ASSIGNED, Appointment::STATUS_CONFIRMED, $receptionist);

        // 6. APT-TEST-CHECKEDIN: da_check_in, Patient: BN...05, Doctor: bacsi_a
        $aptT4 = $this->createAppointment(
            code: 'APT-TEST-CHECKEDIN',
            patient: $patients['BN'.$year.'00005'],
            service: $services[0],
            branch: $branch,
            date: $today,
            slot: '10:00 - 10:30',
            status: Appointment::STATUS_CHECKED_IN,
            doctor: $doctor,
            creator: $receptionist,
            notes: 'Đau răng hàm dưới bên trái.',
            checkedInAt: $today->copy()->setTime(9, 50, 0),
            checkedInBy: $receptionist
        );
        $this->history($aptT4, 'checked_in', Appointment::STATUS_CONFIRMED, Appointment::STATUS_CHECKED_IN, $receptionist);

        // 7. APT-TEST-INPROGRESS: dang_kham, Patient: BN...06, Doctor: bacsi_a
        $aptT5 = $this->createAppointment(
            code: 'APT-TEST-INPROGRESS',
            patient: $patients['BN'.$year.'00006'],
            service: $services[1],
            branch: $branch,
            date: $today,
            slot: '10:30 - 11:00',
            status: Appointment::STATUS_IN_PROGRESS,
            doctor: $doctor,
            creator: $receptionist,
            notes: 'Cạo vôi và tẩy trắng răng.',
            checkedInAt: $today->copy()->setTime(10, 20, 0),
            checkedInBy: $receptionist
        );
        $this->history($aptT5, 'in_progress', Appointment::STATUS_CHECKED_IN, Appointment::STATUS_IN_PROGRESS, $doctor);

        // 8. APT-TEST-COMPLETED-T1: hoan_tat, Patient: BN...07, Doctor: bacsi_a
        $aptT6 = $this->createAppointment(
            code: 'APT-TEST-COMPLETED-T1',
            patient: $patients['BN'.$year.'00007'],
            service: $services[2],
            branch: $branch,
            date: $today,
            slot: '11:00 - 11:30',
            status: Appointment::STATUS_COMPLETED,
            doctor: $doctor,
            creator: $receptionist,
            notes: 'Trám răng cửa bị mẻ.',
            checkedInAt: $today->copy()->setTime(10, 55, 0),
            checkedInBy: $receptionist
        );
        $this->history($aptT6, 'completed', Appointment::STATUS_IN_PROGRESS, Appointment::STATUS_COMPLETED, $doctor);

        // 9. APT-TEST-CANCELLED: da_huy, Patient: BN...08
        $aptT7 = $this->createAppointment(
            code: 'APT-TEST-CANCELLED',
            patient: $patients['BN'.$year.'00008'],
            service: $services[0],
            branch: $branch,
            date: $today,
            slot: '15:30 - 16:00',
            status: Appointment::STATUS_CANCELLED,
            doctor: $doctor,
            creator: $receptionist,
            notes: 'Đau răng nhức đầu.',
            cancelledAt: $today->copy()->setTime(13, 30, 0),
            cancelReason: 'Khách hàng bận đi công tác đột xuất.'
        );
        $this->history($aptT7, AppointmentStatusHistory::ACTION_CANCELLED, Appointment::STATUS_CONFIRMED, Appointment::STATUS_CANCELLED, $receptionist);

        // 10. APT-TEST-WALKIN: da_check_in, Patient: BN...15, Doctor: bacsi_a (source: tai_quay)
        $aptT8 = $this->createAppointment(
            code: 'APT-TEST-WALKIN',
            patient: $patients['BN'.$year.'00015'],
            service: $services[1],
            branch: $branch,
            date: $today,
            slot: '13:30 - 14:00',
            status: Appointment::STATUS_CHECKED_IN,
            doctor: $doctor,
            creator: $receptionist,
            notes: 'Khách vãng lai, cạo vôi răng.',
            checkedInAt: $today->copy()->setTime(13, 32, 0),
            checkedInBy: $receptionist,
            source: Appointment::SOURCE_WALK_IN
        );
        $this->history($aptT8, 'checked_in', null, Appointment::STATUS_CHECKED_IN, $receptionist);

        // 13 (extra for Draft session). APT-TEST-DRAFT: dang_kham, Patient: BN...11, Doctor: bacsi_a
        $aptT9 = $this->createAppointment(
            code: 'APT-TEST-DRAFT',
            patient: $patients['BN'.$year.'00011'],
            service: $services[1],
            branch: $branch,
            date: $today,
            slot: '14:30 - 15:00',
            status: Appointment::STATUS_IN_PROGRESS,
            doctor: $doctor,
            creator: $receptionist,
            notes: 'Kiểm tra tủy răng.',
            checkedInAt: $today->copy()->setTime(14, 25, 0),
            checkedInBy: $receptionist
        );
        $this->history($aptT9, 'in_progress', Appointment::STATUS_CHECKED_IN, Appointment::STATUS_IN_PROGRESS, $doctor);

        // 14 (extra for Partial Invoice). APT-TEST-PARTIAL: hoan_tat, Patient: BN...12, Doctor: bacsi_a
        $aptT10 = $this->createAppointment(
            code: 'APT-TEST-PARTIAL',
            patient: $patients['BN'.$year.'00012'],
            service: $services[2],
            branch: $branch,
            date: $today,
            slot: '15:00 - 15:30',
            status: Appointment::STATUS_COMPLETED,
            doctor: $doctor,
            creator: $receptionist,
            notes: 'Trám răng.',
            checkedInAt: $today->copy()->setTime(14, 55, 0),
            checkedInBy: $receptionist
        );
        $this->history($aptT10, 'completed', Appointment::STATUS_IN_PROGRESS, Appointment::STATUS_COMPLETED, $doctor);

        // Tomorrow's Appointments
        // 11. APT-TEST-FUTURE-1: cho_phan_cong_bac_si, Patient: BN...09
        $aptF1 = $this->createAppointment(
            code: 'APT-TEST-FUTURE-1',
            patient: $patients['BN'.$year.'00009'],
            service: $services[0],
            branch: $branch,
            date: $tomorrow,
            slot: '09:00 - 09:30',
            status: Appointment::STATUS_WAITING_DOCTOR_ASSIGNMENT,
            doctor: null,
            creator: $receptionist,
            notes: 'Khám định kỳ ngày mai.'
        );
        $this->history($aptF1, 'created', null, Appointment::STATUS_WAITING_DOCTOR_ASSIGNMENT, $receptionist);

        // 12. APT-TEST-FUTURE-2: da_phan_cong_bac_si, Patient: BN...10
        $aptF2 = $this->createAppointment(
            code: 'APT-TEST-FUTURE-2',
            patient: $patients['BN'.$year.'00010'],
            service: $services[1],
            branch: $branch,
            date: $tomorrow,
            slot: '10:00 - 10:30',
            status: Appointment::STATUS_DOCTOR_ASSIGNED,
            doctor: $doctor,
            creator: $receptionist,
            notes: 'Cạo vôi ngày mai.'
        );
        $this->history($aptF2, 'assigned', Appointment::STATUS_WAITING_DOCTOR_ASSIGNMENT, Appointment::STATUS_DOCTOR_ASSIGNED, $receptionist);

        // --- SEED CLINICAL & BILLING DATA ---

        // A. Queue entries for checked-in/completed/in-progress appointments
        // Q-TEST-001 (waiting for APT-TEST-CHECKEDIN)
        $q1 = $this->createQueue('Q-TEST-001', $aptT4, $patients['BN'.$year.'00005'], $branch, $doctor, AppointmentQueueEntry::BUCKET_WAITING, 1, $today->copy()->setTime(9, 50, 0), $receptionist);
        // Q-TEST-002 (in_progress for APT-TEST-INPROGRESS)
        $q2 = $this->createQueue('Q-TEST-002', $aptT5, $patients['BN'.$year.'00006'], $branch, $doctor, AppointmentQueueEntry::BUCKET_IN_PROGRESS, 2, $today->copy()->setTime(10, 20, 0), $receptionist, $today->copy()->setTime(10, 30, 0));
        // Q-TEST-003 (completed for APT-TEST-COMPLETED-T1)
        $q3 = $this->createQueue('Q-TEST-003', $aptT6, $patients['BN'.$year.'00007'], $branch, $doctor, AppointmentQueueEntry::BUCKET_COMPLETED, 3, $today->copy()->setTime(10, 55, 0), $receptionist, $today->copy()->setTime(11, 00, 0), $today->copy()->setTime(11, 20, 0));
        // Q-TEST-004 (waiting for APT-TEST-WALKIN)
        $q4 = $this->createQueue('Q-TEST-004', $aptT8, $patients['BN'.$year.'00015'], $branch, $doctor, AppointmentQueueEntry::BUCKET_WAITING, 4, $today->copy()->setTime(13, 32, 0), $receptionist);
        // Q-TEST-005 (in_progress for APT-TEST-DRAFT)
        $q5 = $this->createQueue('Q-TEST-005', $aptT9, $patients['BN'.$year.'00011'], $branch, $doctor, AppointmentQueueEntry::BUCKET_IN_PROGRESS, 5, $today->copy()->setTime(14, 25, 0), $receptionist, $today->copy()->setTime(14, 30, 0));
        // Q-TEST-006 (completed for APT-TEST-PARTIAL)
        $q6 = $this->createQueue('Q-TEST-006', $aptT10, $patients['BN'.$year.'00012'], $branch, $doctor, AppointmentQueueEntry::BUCKET_COMPLETED, 6, $today->copy()->setTime(14, 55, 0), $receptionist, $today->copy()->setTime(15, 00, 0), $today->copy()->setTime(15, 20, 0));

        // B. Examination Sessions (5 cases: waiting exam, in progress, draft, pending payment, completed exam)
        // 1. BA-TEST-CHO-KHAM (waiting exam today for APT-TEST-CHECKEDIN)
        $this->createSession('BA-TEST-CHO-KHAM', $aptT4, $patients['BN'.$year.'00005'], $q1, $doctor, ExaminationSession::STATUS_CHO_KHAM, $receptionist);

        // 2. BA-TEST-DANG-KHAM (in progress today for APT-TEST-INPROGRESS)
        $this->createSession('BA-TEST-DANG-KHAM', $aptT5, $patients['BN'.$year.'00006'], $q2, $doctor, ExaminationSession::STATUS_DANG_KHAM, $doctor, [
            'started_at' => $today->copy()->setTime(10, 30, 0),
            'chief_complaint' => 'Răng ê buốt khi uống nước đá.',
            'symptoms' => 'Ê buốt kéo dài 5-10 giây.',
            'diagnosis' => 'Mòn cổ răng răng 36, 37.',
        ]);

        // 3. BA-TEST-NHAP (draft today for APT-TEST-DRAFT)
        $sessDraft = $this->createSession('BA-TEST-NHAP', $aptT9, $patients['BN'.$year.'00011'], $q5, $doctor, ExaminationSession::STATUS_NHAP, $doctor, [
            'started_at' => $today->copy()->setTime(14, 30, 0),
            'chief_complaint' => 'Răng đau nhói nhẹ.',
            'diagnosis' => 'Sâu răng sâu rãnh nhai răng 46.',
        ]);
        $this->upsertServiceItem($sessDraft, $services[1], $doctor, 1, ['46'], ExaminationServiceItem::LEVEL_THONG_THUONG, 0);

        // 4. BA-TEST-CHO-THANH-TOAN (pending payment today for APT-TEST-COMPLETED-T1)
        $sessPending = $this->createSession('BA-TEST-CHO-THANH-TOAN', $aptT6, $patients['BN'.$year.'00007'], $q3, $doctor, ExaminationSession::STATUS_CHO_THANH_TOAN, $doctor, [
            'started_at' => $today->copy()->setTime(11, 00, 0),
            'completed_at' => $today->copy()->setTime(11, 20, 0),
            'completed_by' => $doctor->id,
            'chief_complaint' => 'Trám răng cửa mẻ.',
            'symptoms' => 'Răng mẻ do cắn vật cứng, không đau.',
            'clinical_findings' => 'Mẻ rìa cắn răng 11.',
            'diagnosis' => 'Mẻ răng 11 chưa phạm tủy.',
            'conclusion' => 'Trám thẩm mỹ phục hồi hình dáng răng 11.',
        ]);
        $itemPending = $this->upsertServiceItem($sessPending, $services[2], $doctor, 1, ['11'], ExaminationServiceItem::LEVEL_THONG_THUONG, 0);

        // 5. BA-TEST-HOAN-TAT (completed yesterday for APT-TEST-COMPLETED-Y1)
        $sessPaid = $this->createSession('BA-TEST-HOAN-TAT', $aptY1, $patients['BN'.$year.'00001'], null, $doctor, ExaminationSession::STATUS_HOAN_TAT, $doctor, [
            'started_at' => $yesterday->copy()->setTime(9, 00, 0),
            'completed_at' => $yesterday->copy()->setTime(9, 25, 0),
            'completed_by' => $doctor->id,
            'chief_complaint' => 'Khám răng định kỳ.',
            'clinical_findings' => 'Miệng sạch, không phát hiện răng sâu mới.',
            'diagnosis' => 'Tình trạng răng miệng khỏe mạnh.',
            'conclusion' => 'Vệ sinh răng miệng tốt, tiếp tục duy trì.',
        ]);
        $itemPaid = $this->upsertServiceItem($sessPaid, $services[0], $doctor, 1, [], ExaminationServiceItem::LEVEL_THONG_THUONG, 0, true);

        // 6. BA-TEST-PARTIAL (completed today for APT-TEST-PARTIAL)
        $sessPartial = $this->createSession('BA-TEST-PARTIAL', $aptT10, $patients['BN'.$year.'00012'], $q6, $doctor, ExaminationSession::STATUS_HOAN_TAT, $doctor, [
            'started_at' => $today->copy()->setTime(15, 00, 0),
            'completed_at' => $today->copy()->setTime(15, 20, 0),
            'completed_by' => $doctor->id,
            'chief_complaint' => 'Đau buốt nhẹ răng hàm.',
            'clinical_findings' => 'Sâu men răng 26.',
            'diagnosis' => 'Sâu răng 26 độ 1.',
            'conclusion' => 'Trám composite răng 26.',
        ]);
        $itemPartial = $this->upsertServiceItem($sessPartial, $services[2], $doctor, 1, ['26'], ExaminationServiceItem::LEVEL_THONG_THUONG, 0, false);

        // C. Invoices & Payments (3 cases: pending invoice, partial invoice, paid invoice)
        // 1. INV-TEST-PENDING (pending for BA-TEST-CHO-THANH-TOAN)
        $this->createInvoice('INV-TEST-PENDING', $sessPending, $aptT6, $patients['BN'.$year.'00007'], $branch, $doctor, $receptionist, Invoice::STATUS_PENDING, [$itemPending]);

        // 2. INV-TEST-PAID (paid for BA-TEST-HOAN-TAT)
        $invPaid = $this->createInvoice('INV-TEST-PAID', $sessPaid, $aptY1, $patients['BN'.$year.'00001'], $branch, $doctor, $receptionist, Invoice::STATUS_PAID, [$itemPaid]);
        $this->createPayment('PT-TEST-001', $invPaid, $receptionist, $yesterday->copy()->setTime(9, 28, 0));

        // 3. INV-TEST-PARTIAL (partial payment for BA-TEST-PARTIAL)
        $invPartial = $this->createInvoice('INV-TEST-PARTIAL', $sessPartial, $aptT10, $patients['BN'.$year.'00012'], $branch, $doctor, $receptionist, Invoice::STATUS_PARTIAL, [$itemPartial], 200000.00);
        $this->createPayment('PT-TEST-002', $invPartial, $receptionist, $today->copy()->setTime(15, 25, 0), 200000.00);
    }

    private function createAppointment(
        string $code,
        Patient $patient,
        ?Service $service,
        Branch $branch,
        Carbon $date,
        string $slot,
        string $status,
        ?User $doctor,
        User $creator,
        string $notes,
        ?Carbon $checkedInAt = null,
        ?User $checkedInBy = null,
        ?Carbon $noShowAt = null,
        ?User $noShowBy = null,
        ?string $noShowReason = null,
        ?Carbon $cancelledAt = null,
        ?string $cancelReason = null,
        ?OnlineBookingRequest $booking = null,
        string $source = Appointment::SOURCE_ONLINE
    ): Appointment {
        $appointment = Appointment::create([
            'code' => $code,
            'online_booking_request_id' => $booking?->id,
            'patient_id' => $patient->id,
            'appointment_date' => $date->toDateString(),
            'time_slot' => $slot,
            'source' => $source,
            'service_ids' => $service ? [(string) $service->id] : [],
            'branch_id' => $branch->code,
            'status' => $status,
            'assigned_doctor_id' => $doctor?->id,
            'created_by' => $creator->id,
            'updated_by' => $creator->id,
            'notes' => $notes,
            'checked_in_at' => $checkedInAt,
            'checked_in_by' => $checkedInBy?->id,
            'arrival_flag' => $checkedInAt ? Appointment::ARRIVAL_ON_TIME : null,
            'no_show_at' => $noShowAt,
            'no_show_by' => $noShowBy?->id,
            'no_show_reason' => $noShowReason,
            'cancelled_at' => $cancelledAt,
            'cancel_reason' => $cancelReason,
        ]);

        if ($booking) {
            $booking->update(['appointment_id' => $appointment->id]);
        }

        return $appointment;
    }

    private function createQueue(
        string $code,
        Appointment $appointment,
        Patient $patient,
        Branch $branch,
        User $doctor,
        string $bucket,
        int $number,
        Carbon $enteredAt,
        User $actor,
        ?Carbon $startedAt = null,
        ?Carbon $completedAt = null
    ): AppointmentQueueEntry {
        return AppointmentQueueEntry::create([
            'code' => $code,
            'appointment_id' => $appointment->id,
            'patient_id' => $patient->id,
            'assigned_doctor_id' => $doctor->id,
            'branch_id' => $branch->code,
            'bucket' => $bucket,
            'queue_number' => $number,
            'entered_at' => $enteredAt,
            'started_at' => $startedAt,
            'completed_at' => $completedAt,
            'created_by' => $actor->id,
        ]);
    }

    private function createSession(
        string $code,
        Appointment $appointment,
        Patient $patient,
        ?AppointmentQueueEntry $queue,
        User $doctor,
        string $status,
        User $actor,
        array $values = []
    ): ExaminationSession {
        $session = ExaminationSession::create(array_merge([
            'code' => $code,
            'patient_id' => $patient->id,
            'appointment_id' => $appointment->id,
            'queue_entry_id' => $queue?->id,
            'doctor_id' => $doctor->id,
            'status' => $status,
            'created_by' => $actor->id,
            'updated_by' => $actor->id,
        ], $values));

        ExaminationHistory::create([
            'examination_id' => $session->id,
            'action' => 'created_from_seed',
            'actor_id' => $actor->id,
            'actor_name' => $actor->name,
            'after' => ['status' => $session->status, 'appointment_id' => $appointment->id],
            'reason' => 'Khởi tạo từ dữ liệu seed.',
            'created_at' => Carbon::now(),
        ]);

        return $session;
    }

    private function upsertServiceItem(
        ExaminationSession $session,
        Service $service,
        User $doctor,
        int $quantity,
        array $toothCodes,
        string $level,
        float $coefficient,
        bool $paid = false
    ): ExaminationServiceItem {
        $subtotal = ExaminationServiceItem::recalcSubtotal((float) $service->price, $quantity, $coefficient);

        return ExaminationServiceItem::create([
            'examination_id' => $session->id,
            'service_id' => $service->id,
            'service_code_snapshot' => $service->service_code,
            'service_name_snapshot' => $service->name,
            'tooth_codes' => $toothCodes,
            'processing_level' => $level,
            'complexity_coefficient' => $coefficient,
            'unit_price_snapshot' => $service->price,
            'quantity' => $quantity,
            'subtotal_snapshot' => $subtotal,
            'performed_by' => $doctor->id,
            'is_paid' => $paid,
        ]);
    }

    private function createInvoice(
        string $code,
        ExaminationSession $session,
        Appointment $appointment,
        Patient $patient,
        Branch $branch,
        User $doctor,
        User $actor,
        string $status,
        array $items,
        float $amountPaid = 0.0
    ): Invoice {
        $subtotal = array_sum(array_map(fn (ExaminationServiceItem $item) => (float) $item->subtotal_snapshot, $items));
        
        if ($status === Invoice::STATUS_PAID) {
            $amountPaid = $subtotal;
        }

        $invoice = Invoice::create([
            'code' => $code,
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
            'amount_due' => max(0.0, $subtotal - $amountPaid),
            'status' => $status,
            'type' => Invoice::TYPE_MAIN,
            'created_by' => $actor->id,
        ]);

        foreach ($items as $item) {
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
        }

        return $invoice;
    }

    private function createPayment(
        string $code,
        Invoice $invoice,
        User $actor,
        Carbon $paidAt,
        ?float $amount = null
    ): PaymentTransaction {
        return PaymentTransaction::create([
            'code' => $code,
            'invoice_id' => $invoice->id,
            'type' => PaymentTransaction::TYPE_PAYMENT,
            'method' => PaymentTransaction::METHOD_CASH,
            'amount' => $amount ?? $invoice->total,
            'reference_code' => null,
            'note' => 'Thanh toán hóa đơn seed.',
            'paid_by' => $actor->id,
            'paid_at' => $paidAt,
        ]);
    }

    private function history(Appointment $appointment, string $action, ?string $from, string $to, User $actor): void
    {
        AppointmentStatusHistory::create([
            'appointment_id' => $appointment->id,
            'action' => $action,
            'from_status' => $from,
            'to_status' => $to,
            'reason' => 'Trạng thái khởi tạo từ seed dữ liệu.',
            'metadata' => ['seed_code' => $appointment->code],
            'actor_id' => $actor->id,
            'actor_name' => $actor->name,
            'created_at' => Carbon::now(),
        ]);
    }
}
