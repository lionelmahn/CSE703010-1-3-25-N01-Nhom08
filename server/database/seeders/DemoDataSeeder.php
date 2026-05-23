<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\AppointmentStatusHistory;
use App\Models\Branch;
use App\Models\LeaveRequest;
use App\Models\OnlineBookingRequest;
use App\Models\Patient;
use App\Models\ProfessionalProfile;
use App\Models\Role;
use App\Models\Service;
use App\Models\Staff;
use App\Models\User;
use App\Models\WorkSchedule;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Seed du lieu mau cho viec test UC5/UC6/UC7/UC8.
 *
 * Idempotent: chay lai se chi update/khong nhan ban du lieu (dung
 * updateOrCreate theo cac khoa duy nhat employee_code/code/staff_id+work_date).
 *
 * Pham vi:
 *  - Bo sung 3 bac si (BS002/003/004) voi staff + professional_profile +
 *    specialty (hop le voi VR3/VR7).
 *  - Tao work_schedules cho 4 bac si trong 14 ngay (-7 -> +6) de UC8 co
 *    candidate (VR4).
 *  - 1 leave_request approved (test VR5).
 *  - Cap nhat 3 appointment goc (APT-0001/2/3) sang time_slot va source
 *    canonical de tranh be format cu "09:00-09:30" / "offline".
 *  - Bo sung 9 appointment moi APT-0004..APT-0012 phu toan bo trang thai
 *    cho_phan_cong / da_phan_cong / da_xac_nhan / da_check_in / dang_kham
 *    / hoan_tat / da_huy / khong_den (tham chieu UC7 + UC8).
 *  - 5 online_booking_request (UC6.2) cho cac trang thai cho_xu_ly /
 *    dang_xu_ly / da_tu_choi / da_tao_lich_hen.
 */
class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedExtraDoctors();
        $this->seedWorkSchedules();
        $this->seedLeaveRequests();
        $this->updateLegacyAppointments();
        $this->seedAppointments();
        $this->seedOnlineBookingRequests();
    }

    /**
     * Bo sung 3 bac si nua (ngoai BS001 da co tu UserSeeder/StaffSeeder).
     */
    protected function seedExtraDoctors(): void
    {
        $doctorRole = Role::where('slug', 'bac_si')->first();
        $serviceIds = Service::orderBy('id')->pluck('id')->values();
        $admin = User::where('email', 'admin@dental.com')->first();

        $branches = Branch::pluck('id', 'code');

        $rows = [
            [
                'employee_code' => 'BS002',
                'username' => 'bacsi_b',
                'email' => 'bacsi_b@dental.com',
                'full_name' => 'Bác sĩ Phạm B',
                'phone' => '0900000010',
                'branch_code' => 'PK1-HN',
                'join_date' => '2024-04-01',
                'specialty_name' => 'Phục hình',
                'specialty_degree' => 'Bác sĩ',
                'specialty_years' => 6,
                // Scope dich vu: 4 (Boc su), 6 (Implant), 7 (Tay trang)
                'service_scope' => $serviceIds->whereIn(null, [])->all(), // override below
                'specialty_services' => [4, 6, 7],
            ],
            [
                'employee_code' => 'BS003',
                'username' => 'bacsi_c',
                'email' => 'bacsi_c@dental.com',
                'full_name' => 'Bác sĩ Vũ C',
                'phone' => '0900000011',
                'branch_code' => 'PK2-HCM',
                'join_date' => '2024-05-15',
                'specialty_name' => 'Răng hàm mặt tổng quát',
                'specialty_degree' => 'Thạc sĩ',
                'specialty_years' => 9,
                'specialty_services' => $serviceIds->all(),
            ],
            [
                'employee_code' => 'BS004',
                'username' => 'bacsi_d',
                'email' => 'bacsi_d@dental.com',
                'full_name' => 'Bác sĩ Trần D',
                'phone' => '0900000012',
                'branch_code' => 'PK1-HN',
                'join_date' => '2024-06-10',
                'specialty_name' => 'Phẫu thuật miệng',
                'specialty_degree' => 'Bác sĩ',
                'specialty_years' => 4,
                // BS004 chuyen ve nho rang kho + cay implant; service 6, 8.
                'specialty_services' => [6, 8],
            ],
        ];

        foreach ($rows as $row) {
            $user = User::updateOrCreate(
                ['email' => $row['email']],
                [
                    'name' => $row['full_name'],
                    'username' => $row['username'],
                    'employee_id' => $row['employee_code'],
                    'password' => Hash::make('Dental@123'),
                    'status' => 'active',
                ]
            );

            if ($doctorRole) {
                $user->roles()->syncWithoutDetaching([$doctorRole->id]);
            }

            $branchId = $branches[$row['branch_code']] ?? null;

            $staff = Staff::updateOrCreate(
                ['employee_code' => $row['employee_code']],
                [
                    'full_name' => $row['full_name'],
                    'email' => $row['email'],
                    'phone' => $row['phone'],
                    'role_slug' => 'bac_si',
                    'join_date' => $row['join_date'],
                    'status' => 'working',
                    'user_id' => $user->id,
                    'branch_id' => $branchId,
                ]
            );

            $profile = ProfessionalProfile::updateOrCreate(
                [
                    'staff_id' => $staff->id,
                    'profile_role' => 'bac_si',
                ],
                [
                    'status' => ProfessionalProfile::STATUS_APPROVED,
                    'notes' => 'Demo: ho so da duyet cho bac si.',
                    'submitted_at' => now()->subDays(20),
                    'approved_at' => now()->subDays(15),
                    'approved_by' => $admin?->id,
                    'is_active' => true,
                ]
            );

            $profile->specialties()->updateOrCreate(
                ['specialty_name' => $row['specialty_name']],
                [
                    'degree' => $row['specialty_degree'],
                    'years_experience' => $row['specialty_years'],
                    'service_scope' => $row['specialty_services'],
                    'branch_or_room' => 'Demo - '.$row['branch_code'],
                    'notes' => 'Demo seeder: chuyen mon '.$row['specialty_name'].'.',
                ]
            );
        }
    }

    /**
     * Tao work_schedules cho moi bac si trong 14 ngay (-7 -> +6).
     * Mac dinh ca lam 08:00-17:00 tai chi nhanh staff. Skip Chu Nhat.
     *
     * Khong dung updateOrCreate vi cot `work_date` luu kieu datetime
     * ("Y-m-d H:i:s") trong khi search key truyen "Y-m-d" -> KHONG match
     * khi chay lai (gay nhan ban). Phai find truoc bang whereDate.
     */
    protected function seedWorkSchedules(): void
    {
        $today = Carbon::today();
        $doctorStaff = Staff::whereIn('employee_code', ['BS001', 'BS002', 'BS003', 'BS004'])->get();

        foreach ($doctorStaff as $staff) {
            for ($delta = -7; $delta <= 6; $delta++) {
                $date = $today->copy()->addDays($delta);
                if ($date->isSunday()) {
                    continue;
                }

                $payload = [
                    'staff_id' => $staff->id,
                    'branch_id' => $staff->branch_id,
                    'work_date' => $date->toDateString(),
                    'start_time' => '08:00:00',
                    'end_time' => '17:00:00',
                    'work_role' => 'doctor_treatment',
                    'status' => WorkSchedule::STATUS_SCHEDULED,
                ];

                $existing = WorkSchedule::query()
                    ->where('staff_id', $staff->id)
                    ->whereDate('work_date', $date->toDateString())
                    ->where('start_time', '08:00:00')
                    ->first();

                if ($existing) {
                    $existing->fill($payload)->save();
                } else {
                    WorkSchedule::create($payload);
                }
            }
        }
    }

    /**
     * 1 leave_request approved cho BS003 vao ngay +3 (test VR5).
     */
    protected function seedLeaveRequests(): void
    {
        $bs003 = Staff::where('employee_code', 'BS003')->first();
        $admin = User::where('email', 'admin@dental.com')->first();
        if (! $bs003) {
            return;
        }

        $targetDate = Carbon::today()->addDays(3)->toDateString();
        $schedule = WorkSchedule::where('staff_id', $bs003->id)
            ->whereDate('work_date', $targetDate)
            ->first();
        if (! $schedule) {
            return;
        }

        LeaveRequest::updateOrCreate(
            ['work_schedule_id' => $schedule->id, 'staff_id' => $bs003->id],
            [
                'requested_by' => $bs003->user_id,
                'reason' => 'Demo: bac si BS003 nghi ca de test VR5.',
                'status' => LeaveRequest::STATUS_APPROVED,
                'review_note' => 'Demo seeder approved.',
                'reviewed_at' => now()->subDay(),
                'reviewed_by' => $admin?->id,
            ]
        );
    }

    /**
     * Update 3 appointment goc sang format canonical de tranh slot
     * "09:00-09:30" va source "offline" (khong nam trong ALL_SOURCES).
     */
    protected function updateLegacyAppointments(): void
    {
        $today = Carbon::today();
        $patches = [
            'APT-0001' => [
                'time_slot' => '09-10',
                'source' => Appointment::SOURCE_ONLINE,
                'appointment_date' => $today->toDateString(),
            ],
            'APT-0002' => [
                'time_slot' => '10-11',
                'source' => Appointment::SOURCE_WALK_IN,
                'appointment_date' => $today->toDateString(),
            ],
            'APT-0003' => [
                'time_slot' => '14-15',
                'source' => Appointment::SOURCE_WALK_IN,
                'appointment_date' => $today->copy()->addDay()->toDateString(),
            ],
        ];

        foreach ($patches as $code => $patch) {
            $apt = Appointment::where('code', $code)->first();
            if (! $apt) {
                continue;
            }
            $apt->fill($patch)->save();
        }
    }

    /**
     * 9 appointment moi: APT-0004 -> APT-0012 phu cac trang thai con lai.
     */
    protected function seedAppointments(): void
    {
        $today = Carbon::today();
        $admin = User::where('email', 'admin@dental.com')->first();
        $bs001 = User::where('email', 'bacsi@dental.com')->first();
        $bs003 = User::where('email', 'bacsi_c@dental.com')->first();

        $rows = [
            // Today, status da_check_in, branch 1
            [
                'code' => 'APT-0004',
                'patient_id' => 4,
                'appointment_date' => $today->toDateString(),
                'time_slot' => '08-09',
                'service_ids' => [1, 2],
                'branch_id' => '1',
                'status' => Appointment::STATUS_CHECKED_IN,
                'source' => Appointment::SOURCE_WALK_IN,
                'assigned_doctor_id' => $bs001?->id,
                'notes' => 'Demo: benh nhan da check-in tai quay.',
            ],
            // Today, status dang_kham
            [
                'code' => 'APT-0005',
                'patient_id' => 5,
                'appointment_date' => $today->toDateString(),
                'time_slot' => '11-12',
                'service_ids' => [3],
                'branch_id' => '1',
                'status' => Appointment::STATUS_IN_PROGRESS,
                'source' => Appointment::SOURCE_WALK_IN,
                'assigned_doctor_id' => $bs001?->id,
                'notes' => 'Demo: dang kham phong 201.',
            ],
            // Past, hoan_tat
            [
                'code' => 'APT-0006',
                'patient_id' => 3,
                'appointment_date' => $today->copy()->subDays(3)->toDateString(),
                'time_slot' => '09-10',
                'service_ids' => [2],
                'branch_id' => '1',
                'status' => Appointment::STATUS_COMPLETED,
                'source' => Appointment::SOURCE_WALK_IN,
                'assigned_doctor_id' => $bs001?->id,
                'notes' => 'Demo: lich da hoan tat 3 ngay truoc.',
            ],
            // Today, da_huy
            [
                'code' => 'APT-0007',
                'patient_id' => 7,
                'appointment_date' => $today->toDateString(),
                'time_slot' => '15-16',
                'service_ids' => [1],
                'branch_id' => '1',
                'status' => Appointment::STATUS_CANCELLED,
                'source' => Appointment::SOURCE_ONLINE,
                'assigned_doctor_id' => null,
                'cancel_reason' => 'Demo: khach hoa lich do ban dot xuat.',
                'cancelled_at' => now()->subHours(2),
                'notes' => 'Demo: lich bi huy.',
            ],
            // Today, cho_phan_cong, branch 2 (de UC8 thay 2 chi nhanh)
            [
                'code' => 'APT-0008',
                'patient_id' => 8,
                'appointment_date' => $today->toDateString(),
                'time_slot' => '09-10',
                'service_ids' => [1, 3],
                'branch_id' => '2',
                'status' => Appointment::STATUS_WAITING_DOCTOR_ASSIGNMENT,
                'source' => Appointment::SOURCE_ONLINE,
                'assigned_doctor_id' => null,
                'notes' => 'Demo: PK2-HCM cho phan cong - test BS003.',
            ],
            // +1 day, cho_phan_cong, online
            [
                'code' => 'APT-0009',
                'patient_id' => 4,
                'appointment_date' => $today->copy()->addDay()->toDateString(),
                'time_slot' => '10-11',
                'service_ids' => [4, 6],
                'branch_id' => '1',
                'status' => Appointment::STATUS_WAITING_DOCTOR_ASSIGNMENT,
                'source' => Appointment::SOURCE_ONLINE,
                'assigned_doctor_id' => null,
                'notes' => 'Demo: implant + boc su - chi co BS002/BS004 fit.',
            ],
            // +2 day, cho_phan_cong, BS003 dang nghi -> chi co BS001/BS002/BS004
            [
                'code' => 'APT-0010',
                'patient_id' => 2,
                'appointment_date' => $today->copy()->addDays(2)->toDateString(),
                'time_slot' => '14-15',
                'service_ids' => [1],
                'branch_id' => '1',
                'status' => Appointment::STATUS_WAITING_DOCTOR_ASSIGNMENT,
                'source' => Appointment::SOURCE_WALK_IN,
                'assigned_doctor_id' => null,
            ],
            // +1 day, da_phan_cong (BS001)
            [
                'code' => 'APT-0011',
                'patient_id' => 3,
                'appointment_date' => $today->copy()->addDay()->toDateString(),
                'time_slot' => '13-14',
                'service_ids' => [5],
                'branch_id' => '1',
                'status' => Appointment::STATUS_DOCTOR_ASSIGNED,
                'source' => Appointment::SOURCE_PHONE,
                'assigned_doctor_id' => $bs001?->id,
                'notes' => 'Demo: nieng rang - da phan cong BS001.',
            ],
            // -2 day, khong_den
            [
                'code' => 'APT-0012',
                'patient_id' => 7,
                'appointment_date' => $today->copy()->subDays(2)->toDateString(),
                'time_slot' => '16-17',
                'service_ids' => [1],
                'branch_id' => '1',
                'status' => Appointment::STATUS_NO_SHOW,
                'source' => Appointment::SOURCE_FOLLOW_UP,
                'assigned_doctor_id' => $bs001?->id,
                'notes' => 'Demo: benh nhan khong den.',
            ],
        ];

        foreach ($rows as $row) {
            Appointment::updateOrCreate(
                ['code' => $row['code']],
                array_merge($row, [
                    'created_by' => $admin?->id,
                    'updated_by' => $admin?->id,
                ])
            );
        }
    }

    /**
     * 5 yeu cau dat lich online (UC6.2) cho cac trang thai khac nhau.
     */
    protected function seedOnlineBookingRequests(): void
    {
        $today = Carbon::today();
        $admin = User::where('email', 'admin@dental.com')->first();
        $apt9 = Appointment::where('code', 'APT-0009')->first();
        $pat1 = Patient::find(1);

        $rows = [
            // 1) cho_xu_ly - khach moi chua co patient
            [
                'code' => 'OBR-0001',
                'name' => 'Ngô Thị Hằng',
                'phone' => '0901234567',
                'email' => 'ngohang@example.com',
                'need' => 'kham_tu_van',
                'service_ids' => [1],
                'branch_id' => '1',
                'preferred_date' => $today->copy()->addDays(2)->toDateString(),
                'preferred_time_slot' => '09-10',
                'customer_note' => 'Demo: kham va tu van rang khon.',
                'status' => OnlineBookingRequest::STATUS_PENDING,
                'submitted_at' => now()->subHours(3),
            ],
            // 2) cho_xu_ly - tre em
            [
                'code' => 'OBR-0002',
                'name' => 'Mai Thiếu Nhi',
                'phone' => '0902345678',
                'email' => null,
                'need' => 'kham_tu_van',
                'service_ids' => [1, 2],
                'branch_id' => '1',
                'preferred_date' => $today->copy()->addDays(3)->toDateString(),
                'preferred_time_slot' => '14-15',
                'customer_note' => 'Demo: kham rang cho con 8 tuoi.',
                'status' => OnlineBookingRequest::STATUS_PENDING,
                'submitted_at' => now()->subHours(1),
            ],
            // 3) dang_xu_ly - le tan dang lien lac
            [
                'code' => 'OBR-0003',
                'name' => 'Đặng Quốc V',
                'phone' => '0903456789',
                'email' => 'dangquocv@example.com',
                'need' => 'dieu_tri',
                'service_ids' => [4],
                'branch_id' => '2',
                'preferred_date' => $today->copy()->addDays(5)->toDateString(),
                'preferred_time_slot' => '10-11',
                'customer_note' => 'Demo: muon boc su cua truoc.',
                'internal_note' => 'Demo: dang goi xac nhan voi khach.',
                'status' => OnlineBookingRequest::STATUS_PROCESSING,
                'submitted_at' => now()->subDay(),
                'processed_by' => $admin?->id,
                'processed_at' => now()->subHours(6),
            ],
            // 4) da_tu_choi
            [
                'code' => 'OBR-0004',
                'name' => 'Hồ Văn Test',
                'phone' => '0904567890',
                'email' => null,
                'need' => 'dieu_tri',
                'service_ids' => [6],
                'branch_id' => '3',
                'preferred_date' => $today->copy()->addDays(7)->toDateString(),
                'preferred_time_slot' => '15-16',
                'customer_note' => 'Demo: hoi gia implant.',
                'internal_note' => 'Demo: lich khong con trong vao gio nay.',
                'status' => OnlineBookingRequest::STATUS_REJECTED,
                'submitted_at' => now()->subDays(2),
                'processed_by' => $admin?->id,
                'processed_at' => now()->subDay(),
                'reject_reason' => 'Demo: phong da kin lich; khach khong dong y khung gio khac.',
            ],
            // 5) da_tao_lich_hen - lien ket APT-0009 + patient 1
            [
                'code' => 'OBR-0005',
                'name' => $pat1?->full_name ?? 'Nguyễn Văn An',
                'phone' => $pat1?->phone ?? '0905123456',
                'email' => $pat1?->email,
                'need' => 'dieu_tri',
                'service_ids' => [4, 6],
                'branch_id' => '1',
                'preferred_date' => $today->copy()->addDay()->toDateString(),
                'preferred_time_slot' => '10-11',
                'customer_note' => 'Demo: implant + boc su tham mi.',
                'internal_note' => 'Demo: da tao APT-0009.',
                'status' => OnlineBookingRequest::STATUS_APPOINTMENT_CREATED,
                'patient_id' => $pat1?->id,
                'appointment_id' => $apt9?->id,
                'submitted_at' => now()->subDays(2),
                'processed_by' => $admin?->id,
                'processed_at' => now()->subDay(),
            ],
        ];

        foreach ($rows as $row) {
            OnlineBookingRequest::updateOrCreate(
                ['code' => $row['code']],
                $row
            );
        }

        // Lien ket nguoc tu APT-0009 sang OBR-0005
        if ($apt9) {
            $obr5 = OnlineBookingRequest::where('code', 'OBR-0005')->first();
            if ($obr5 && $apt9->online_booking_request_id !== $obr5->id) {
                $apt9->online_booking_request_id = $obr5->id;
                $apt9->save();
            }
        }
    }
}
