<?php

namespace Database\Seeders;

use App\Models\Patient;
use App\Models\PatientHistory;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * UC5 - Seed du lieu mau cho man hinh "Quan ly ho so benh nhan".
 *
 * Idempotent: chay nhieu lan se chi cap nhat ho so theo patient_code.
 * Cac record duoc seed se hien thi ngay tren FE sau khi `php artisan db:seed`.
 */
class PatientSeeder extends Seeder
{
    public function run(): void
    {
        $actor = User::query()->where('username', 'admin')->first()
            ?? User::query()->first();

        $year = now()->format('Y');

        $records = [
            [
                'code_seed' => 1,
                'full_name' => 'Nguyễn Văn An',
                'phone' => '0905123456',
                'email' => 'nguyenvanan@example.com',
                'id_number' => '012345678901',
                'dob' => '1985-03-15',
                'gender' => 'Nam',
                'address' => '123 Nguyễn Trãi, Q.1, TP.HCM',
                'occupation' => 'Kỹ sư phần mềm',
                'marital_status' => 'Đã kết hôn',
                'source' => 'Website',
                'medical_history' => 'Cao huyết áp nhẹ.',
                'allergies' => 'Penicillin',
                'notes' => 'Hẹn tái khám định kỳ 6 tháng/lần.',
                'status' => Patient::STATUS_ACTIVE,
            ],
            [
                'code_seed' => 2,
                'full_name' => 'Trần Thị Bích',
                'phone' => '0912345678',
                'email' => 'tranthibich@example.com',
                'id_number' => '012345678902',
                'dob' => '1992-07-22',
                'gender' => 'Nữ',
                'address' => '45 Lê Lợi, Q.1, TP.HCM',
                'occupation' => 'Giáo viên',
                'marital_status' => 'Độc thân',
                'source' => 'Facebook',
                'medical_history' => null,
                'allergies' => null,
                'notes' => 'Khách quen.',
                'status' => Patient::STATUS_ACTIVE,
            ],
            [
                'code_seed' => 3,
                'full_name' => 'Lê Văn Cường',
                'phone' => '0987654321',
                'email' => 'levancuong@example.com',
                'id_number' => '012345678903',
                'dob' => '1978-11-30',
                'gender' => 'Nam',
                'address' => '67 Trần Hưng Đạo, Q.5, TP.HCM',
                'occupation' => 'Kinh doanh',
                'marital_status' => 'Đã kết hôn',
                'source' => 'Giới thiệu',
                'medical_history' => 'Tiểu đường tuýp 2.',
                'allergies' => null,
                'notes' => null,
                'status' => Patient::STATUS_ACTIVE,
            ],
            [
                'code_seed' => 4,
                'full_name' => 'Phạm Thị Dung',
                'phone' => '0934567890',
                'email' => 'phamthidung@example.com',
                'id_number' => '012345678904',
                'dob' => '1995-05-18',
                'gender' => 'Nữ',
                'address' => '89 Võ Văn Tần, Q.3, TP.HCM',
                'occupation' => 'Kế toán',
                'marital_status' => 'Đã kết hôn',
                'source' => 'Đến trực tiếp',
                'medical_history' => null,
                'allergies' => 'Bụi nhà, phấn hoa',
                'notes' => null,
                'status' => Patient::STATUS_ACTIVE,
            ],
            [
                'code_seed' => 5,
                'full_name' => 'Hoàng Văn Em',
                'phone' => '0976543210',
                'email' => null,
                'id_number' => '012345678905',
                'dob' => '1988-09-12',
                'gender' => 'Nam',
                'address' => '12 Cách Mạng Tháng 8, Q.10, TP.HCM',
                'occupation' => 'Lái xe',
                'marital_status' => 'Độc thân',
                'source' => 'Zalo',
                'medical_history' => null,
                'allergies' => null,
                'notes' => null,
                'status' => Patient::STATUS_ACTIVE,
            ],
            [
                'code_seed' => 6,
                'full_name' => 'Vũ Thị Phương',
                'phone' => '0945678901',
                'email' => 'vuthiphuong@example.com',
                'id_number' => '012345678906',
                'dob' => '1990-12-05',
                'gender' => 'Nữ',
                'address' => '34 Nguyễn Văn Cừ, Q.5, TP.HCM',
                'occupation' => 'Nhân viên văn phòng',
                'marital_status' => 'Đã kết hôn',
                'source' => 'Website',
                'medical_history' => null,
                'allergies' => null,
                'notes' => null,
                'status' => Patient::STATUS_INACTIVE,
                'deactivation_reason' => 'Khách hàng yêu cầu tạm ngừng theo dõi.',
            ],
            [
                'code_seed' => 7,
                'full_name' => 'Đỗ Văn Giang',
                'phone' => '0901234567',
                'email' => 'dovangiang@example.com',
                'id_number' => '012345678907',
                'dob' => '1982-04-25',
                'gender' => 'Nam',
                'address' => '56 Nguyễn Thị Minh Khai, Q.1, TP.HCM',
                'occupation' => 'Bác sĩ',
                'marital_status' => 'Đã kết hôn',
                'source' => 'Giới thiệu',
                'medical_history' => null,
                'allergies' => 'Aspirin',
                'notes' => null,
                'status' => Patient::STATUS_ACTIVE,
            ],
            [
                'code_seed' => 8,
                'full_name' => 'Bùi Thị Hoa',
                'phone' => '0923456789',
                'email' => null,
                'id_number' => null,
                'dob' => '2000-08-08',
                'gender' => 'Nữ',
                'address' => null,
                'occupation' => 'Sinh viên',
                'marital_status' => 'Độc thân',
                'source' => 'Facebook',
                'medical_history' => null,
                'allergies' => null,
                'notes' => 'Đăng ký niềng răng.',
                'status' => Patient::STATUS_ACTIVE,
            ],
        ];

        foreach ($records as $row) {
            $code = 'BN'.$year.str_pad((string) $row['code_seed'], 5, '0', STR_PAD_LEFT);

            $payload = [
                'full_name' => $row['full_name'],
                'phone' => $row['phone'],
                'email' => $row['email'] ?? null,
                'id_number' => $row['id_number'] ?? null,
                'dob' => $row['dob'] ?? null,
                'gender' => $row['gender'] ?? null,
                'address' => $row['address'] ?? null,
                'occupation' => $row['occupation'] ?? null,
                'marital_status' => $row['marital_status'] ?? null,
                'medical_history' => $row['medical_history'] ?? null,
                'allergies' => $row['allergies'] ?? null,
                'notes' => $row['notes'] ?? null,
                'source' => $row['source'] ?? 'Đến trực tiếp',
                'status' => $row['status'],
                'is_active' => $row['status'] === Patient::STATUS_ACTIVE,
                'created_by' => $actor?->id,
                'updated_by' => $actor?->id,
            ];

            if ($row['status'] === Patient::STATUS_INACTIVE) {
                $payload['deactivated_at'] = now();
                $payload['deactivation_reason'] = $row['deactivation_reason'] ?? null;
            }

            $patient = Patient::updateOrCreate(
                ['patient_code' => $code],
                $payload,
            );

            $hasHistory = PatientHistory::where('patient_id', $patient->id)
                ->where('action', 'seeded')
                ->exists();

            if (! $hasHistory) {
                PatientHistory::create([
                    'patient_id' => $patient->id,
                    'action' => 'seeded',
                    'actor_id' => $actor?->id,
                    'actor_name' => $actor?->name ?? 'Seeder',
                    'note' => 'Hồ sơ được tạo bởi PatientSeeder (UC5).',
                    'before' => null,
                    'after' => [
                        'full_name' => $patient->full_name,
                        'phone' => $patient->phone,
                        'status' => $patient->status,
                    ],
                    'metadata' => ['seeded_at' => now()->toIso8601String()],
                    'created_at' => now(),
                ]);
            }
        }
    }
}
