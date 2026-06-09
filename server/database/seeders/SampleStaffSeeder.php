<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\ProfessionalProfile;
use App\Models\QualificationCatalog;
use App\Models\Role;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

/**
 * Du lieu mau nhan su (mau "SMP") - them bac si / le tan / ke toan de test
 * cac chuc nang nhieu bac si (vd bo chon bac si UC16).
 *
 * GIU NGUYEN user cu: chi THEM tai khoan moi (firstOrCreate theo employee_id),
 * khong sua/xoa 5 tai khoan goc (admin/bacsi_a/letan_b/ketoan_c/letan_locked).
 *
 * Moi bac si co 1 ProfessionalProfile da duyet + 1 hoc ham/hoc vi (de UC15.4
 * tra ve he so bac si khac mac dinh).
 */
class SampleStaffSeeder extends Seeder
{
    private const PASSWORD = 'Dental@123';

    private array $ho = ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Huynh', 'Phan', 'Vu', 'Vo', 'Dang', 'Bui', 'Do', 'Ho', 'Ngo', 'Duong', 'Ly', 'Truong', 'Dinh'];
    private array $dem = ['Van', 'Thi', 'Huu', 'Duc', 'Minh', 'Thanh', 'Quoc', 'Hong', 'Ngoc', 'Gia', 'Khanh', 'Bao'];
    private array $ten = ['An', 'Binh', 'Cuong', 'Dung', 'Em', 'Phuong', 'Giang', 'Hoa', 'Khoa', 'Lan', 'My', 'Nam', 'Oanh', 'Phuc', 'Quan', 'Son', 'Trang', 'Uyen'];

    private array $qualRotation = ['giao_su', 'pho_giao_su', 'tien_si', 'thac_si', 'dai_hoc'];

    public function run(): void
    {
        $branchIds = Branch::pluck('id', 'code');
        $branchCodes = $branchIds->keys()->values()->all();
        if (empty($branchCodes)) {
            return;
        }

        $admin = User::where('username', 'admin')->first();
        $catalogIdByCode = QualificationCatalog::pluck('id', 'code');
        $catalogNameByCode = QualificationCatalog::pluck('name', 'code');

        $doctorRole = Role::where('slug', 'bac_si')->first();
        $receptionRole = Role::where('slug', 'le_tan')->first();
        $accountantRole = Role::where('slug', 'ke_toan')->first();

        // 18 bac si moi.
        for ($i = 1; $i <= 18; $i++) {
            $code = 'BS'.str_pad((string) (100 + $i), 3, '0', STR_PAD_LEFT);
            $branchCode = $branchCodes[$i % count($branchCodes)];
            $qualCode = $this->qualRotation[$i % count($this->qualRotation)];

            $user = $this->makeUser(
                employeeId: $code,
                name: 'BS. '.$this->name($i),
                username: 'doctor'.$i,
                email: 'doctor'.$i.'@dental.com',
                role: $doctorRole,
            );

            $staff = Staff::updateOrCreate(
                ['employee_code' => $code],
                [
                    'full_name' => 'BS. '.$this->name($i),
                    'email' => 'doctor'.$i.'@dental.com',
                    'phone' => '09120'.str_pad((string) $i, 5, '0', STR_PAD_LEFT),
                    'role_slug' => 'bac_si',
                    'join_date' => Carbon::create(2024, ($i % 12) + 1, 10)->toDateString(),
                    'status' => 'working',
                    'branch_id' => $branchIds[$branchCode],
                    'gender' => $i % 2 === 0 ? 'female' : 'male',
                    'nationality' => 'Viet Nam',
                    'highest_degree' => $catalogNameByCode[$qualCode] ?? 'Dai hoc',
                    'major' => 'Rang Ham Mat',
                    'school' => 'Dai hoc Y Ha Noi',
                    'graduation_year' => 2005 + ($i % 12),
                    'practice_certificate' => 'CCHN-'.$code,
                    'is_certificate_valid' => true,
                    'salary_type' => 'hourly',
                    'user_id' => $user->id,
                ]
            );

            $this->makeDoctorProfile($staff, $qualCode, $catalogIdByCode, $admin);
        }

        // 4 le tan moi.
        for ($i = 1; $i <= 4; $i++) {
            $code = 'LT'.str_pad((string) (100 + $i), 3, '0', STR_PAD_LEFT);
            $branchCode = $branchCodes[$i % count($branchCodes)];
            $user = $this->makeUser($code, 'Le tan '.$this->name($i + 30), 'reception'.$i, 'reception'.$i.'@dental.com', $receptionRole);
            Staff::updateOrCreate(
                ['employee_code' => $code],
                [
                    'full_name' => 'Le tan '.$this->name($i + 30),
                    'email' => 'reception'.$i.'@dental.com',
                    'phone' => '09130'.str_pad((string) $i, 5, '0', STR_PAD_LEFT),
                    'role_slug' => 'le_tan',
                    'join_date' => '2024-05-01',
                    'status' => 'working',
                    'branch_id' => $branchIds[$branchCode],
                    'gender' => 'female',
                    'nationality' => 'Viet Nam',
                    'salary_type' => 'monthly',
                    'user_id' => $user->id,
                ]
            );
        }

        // 2 ke toan moi.
        for ($i = 1; $i <= 2; $i++) {
            $code = 'KT'.str_pad((string) (100 + $i), 3, '0', STR_PAD_LEFT);
            $branchCode = $branchCodes[$i % count($branchCodes)];
            $user = $this->makeUser($code, 'Ke toan '.$this->name($i + 40), 'accountant'.$i, 'accountant'.$i.'@dental.com', $accountantRole);
            Staff::updateOrCreate(
                ['employee_code' => $code],
                [
                    'full_name' => 'Ke toan '.$this->name($i + 40),
                    'email' => 'accountant'.$i.'@dental.com',
                    'phone' => '09140'.str_pad((string) $i, 5, '0', STR_PAD_LEFT),
                    'role_slug' => 'ke_toan',
                    'join_date' => '2024-05-01',
                    'status' => 'working',
                    'branch_id' => $branchIds[$branchCode],
                    'gender' => 'male',
                    'nationality' => 'Viet Nam',
                    'salary_type' => 'monthly',
                    'user_id' => $user->id,
                ]
            );
        }
    }

    private function makeUser(string $employeeId, string $name, string $username, string $email, ?Role $role): User
    {
        $user = User::firstOrCreate(
            ['employee_id' => $employeeId],
            [
                'name' => $name,
                'username' => $username,
                'email' => $email,
                'password' => Hash::make(self::PASSWORD),
                'status' => 'active',
            ]
        );

        if ($role) {
            $user->roles()->syncWithoutDetaching([$role->id]);
        }

        return $user;
    }

    private function makeDoctorProfile(Staff $staff, string $qualCode, $catalogIdByCode, ?User $admin): void
    {
        $profile = ProfessionalProfile::updateOrCreate(
            ['staff_id' => $staff->id, 'profile_role' => 'bac_si'],
            [
                'status' => ProfessionalProfile::STATUS_APPROVED,
                'notes' => 'Ho so mau SMP da duyet.',
                'submitted_at' => now()->subDays(30),
                'approved_at' => now()->subDays(28),
                'approved_by' => $admin?->id,
                'is_active' => true,
            ]
        );

        $catalogId = $catalogIdByCode[$qualCode] ?? null;
        if ($catalogId) {
            $profile->qualificationCatalogs()->syncWithoutDetaching([
                $catalogId => ['source' => 'seeder'],
            ]);
        }
    }

    private function name(int $i): string
    {
        return $this->ho[$i % count($this->ho)]
            .' '.$this->dem[$i % count($this->dem)]
            .' '.$this->ten[$i % count($this->ten)];
    }
}
