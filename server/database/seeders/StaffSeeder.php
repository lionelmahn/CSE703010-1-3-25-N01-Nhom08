<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Database\Seeder;

class StaffSeeder extends Seeder
{
    public function run(): void
    {
        // Khoi tao danh sach nhan vien cho phong kham
        $branches = Branch::pluck('id', 'code');
        $rows = [
            [
                'employee_code' => 'AD001',
                'full_name' => 'Quan tri vien',
                'email' => 'admin@dental.com',
                'phone' => '0900000001',
                'role_slug' => 'admin',
                'join_date' => '2024-01-10',
                'status' => 'working',
                'branch_code' => 'PK1-HN',
                'birthday' => '1990-05-15',
                'gender' => 'male',
                'id_card' => '001090123456',
                'id_card_verified' => true,
                'nationality' => 'Việt Nam',
                'highest_degree' => 'Cử nhân',
                'major' => 'Công nghệ thông tin',
                'school' => 'Đại học Bách Khoa Hà Nội',
                'graduation_year' => 2012,
                'base_salary' => 25000000.00,
                'salary_type' => 'monthly',
                'bank_name' => 'Vietcombank',
                'bank_account' => '10123456789',
                'tax_code' => '8012345678',
            ],
            [
                'employee_code' => 'BS001',
                'full_name' => 'Bac si Nguyen A',
                'email' => 'bacsi@dental.com',
                'phone' => '0900000002',
                'role_slug' => 'bac_si',
                'join_date' => '2024-02-15',
                'status' => 'working',
                'branch_code' => 'PK1-HN',
                'birthday' => '1985-08-20',
                'gender' => 'male',
                'id_card' => '001085987654',
                'id_card_verified' => true,
                'nationality' => 'Việt Nam',
                'highest_degree' => 'Thạc sĩ',
                'major' => 'Răng Hàm Mặt',
                'school' => 'Đại học Y Hà Nội',
                'graduation_year' => 2009,
                'practice_certificate' => 'CCHN-001234',
                'is_certificate_valid' => true,
                'base_salary' => 45000000.00,
                'salary_type' => 'monthly',
                'bank_name' => 'Techcombank',
                'bank_account' => '190123456789',
                'tax_code' => '8012345679',
            ],
            [
                'employee_code' => 'LT001',
                'full_name' => 'Le tan Tran B',
                'email' => 'letan@dental.com',
                'phone' => '0900000003',
                'role_slug' => 'le_tan',
                'join_date' => '2024-03-01',
                'status' => 'working',
                'branch_code' => 'PK1-HN',
                'birthday' => '1995-11-12',
                'gender' => 'female',
                'id_card' => '001095111222',
                'id_card_verified' => true,
                'nationality' => 'Việt Nam',
                'highest_degree' => 'Cao đẳng',
                'major' => 'Quản trị văn phòng',
                'school' => 'Cao đẳng Ngoại thương',
                'graduation_year' => 2017,
                'base_salary' => 12000000.00,
                'salary_type' => 'monthly',
                'bank_name' => 'BIDV',
                'bank_account' => '2151234567',
                'tax_code' => '8012345680',
            ],
            [
                'employee_code' => 'KT001',
                'full_name' => 'Ke toan Le C',
                'email' => 'ketoan@dental.com',
                'phone' => '0900000004',
                'role_slug' => 'ke_toan',
                'join_date' => '2024-03-20',
                'status' => 'working',
                'branch_code' => 'PK2-HCM',
                'birthday' => '1992-04-25',
                'gender' => 'female',
                'id_card' => '002092111333',
                'id_card_verified' => true,
                'nationality' => 'Việt Nam',
                'highest_degree' => 'Cử nhân',
                'major' => 'Kế toán doanh nghiệp',
                'school' => 'Đại học Kinh tế TP.HCM',
                'graduation_year' => 2014,
                'base_salary' => 15000000.00,
                'salary_type' => 'monthly',
                'bank_name' => 'VietinBank',
                'bank_account' => '1038123456',
                'tax_code' => '8012345681',
            ],
            [
                'employee_code' => 'LT002',
                'full_name' => 'Le tan bi khoa',
                'email' => 'locked@dental.com',
                'phone' => '0900000005',
                'role_slug' => 'le_tan',
                'join_date' => '2024-04-05',
                'status' => 'suspended',
                'branch_code' => 'PK3-DN',
                'birthday' => '1997-02-14',
                'gender' => 'male',
                'id_card' => '003097111444',
                'id_card_verified' => false,
                'nationality' => 'Việt Nam',
                'highest_degree' => 'Trung cấp',
                'major' => 'Lễ tân khách sạn',
                'school' => 'Trung cấp Du lịch Đà Nẵng',
                'graduation_year' => 2019,
                'base_salary' => 9000000.00,
                'salary_type' => 'monthly',
                'bank_name' => 'Agribank',
                'bank_account' => '20011234567',
                'tax_code' => '8012345682',
            ],
        ];

        foreach ($rows as $row) {
            $user = User::where('email', $row['email'])->first();
            $branchId = $branches[$row['branch_code']] ?? null;
            unset($row['branch_code']);

            Staff::updateOrCreate(
                ['employee_code' => $row['employee_code']],
                array_merge($row, [
                    'user_id' => $user?->id,
                    'branch_id' => $branchId,
                ])
            );
        }
    }
}
