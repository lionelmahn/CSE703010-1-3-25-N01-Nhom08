<?php

namespace Database\Seeders;

use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Du lieu mau benh nhan (mau "SMP") - 100 ho so.
 *
 * Ma BN{year}1xxxx (10001+) de khong dung ma voi PatientSeeder goc (00001-00015).
 * Idempotent: updateOrCreate theo patient_code.
 */
class SamplePatientSeeder extends Seeder
{
    private array $ho = ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Huynh', 'Phan', 'Vu', 'Vo', 'Dang', 'Bui', 'Do', 'Ho', 'Ngo', 'Duong', 'Ly', 'Truong', 'Dinh', 'Mai', 'Cao'];
    private array $dem = ['Van', 'Thi', 'Huu', 'Duc', 'Minh', 'Thanh', 'Quoc', 'Hong', 'Ngoc', 'Gia', 'Khanh', 'Bao', 'Tuan', 'Kim'];
    private array $ten = ['An', 'Binh', 'Cuong', 'Dung', 'Em', 'Phuong', 'Giang', 'Hoa', 'Khoa', 'Lan', 'My', 'Nam', 'Oanh', 'Phuc', 'Quan', 'Son', 'Trang', 'Uyen', 'Vinh', 'Yen'];
    private array $sources = ['Website', 'Facebook', 'Zalo', 'Gioi thieu', 'Den truc tiep', 'Hotline'];

    public function run(): void
    {
        $actor = User::query()->where('username', 'admin')->first() ?? User::query()->first();
        $year = now()->format('Y');
        $count = 100;

        for ($i = 1; $i <= $count; $i++) {
            $code = 'BN'.$year.str_pad((string) (10000 + $i), 5, '0', STR_PAD_LEFT);
            $female = $i % 2 === 0;

            Patient::updateOrCreate(
                ['patient_code' => $code],
                [
                    'full_name' => $this->name($i),
                    'phone' => '0938'.str_pad((string) $i, 6, '0', STR_PAD_LEFT),
                    'email' => 'patient'.$i.'@example.com',
                    'dob' => Carbon::create(1970 + ($i % 40), ($i % 12) + 1, ($i % 27) + 1)->toDateString(),
                    'gender' => $female ? 'Nu' : 'Nam',
                    'address' => 'So '.$i.' duong Mau, Quan '.(($i % 12) + 1),
                    'occupation' => 'Nhan vien',
                    'marital_status' => $i % 3 === 0 ? 'Doc than' : 'Da ket hon',
                    'source' => $this->sources[$i % count($this->sources)],
                    'medical_history' => $i % 5 === 0 ? 'Cao huyet ap nhe.' : null,
                    'allergies' => $i % 7 === 0 ? 'Penicillin' : null,
                    'notes' => null,
                    'status' => Patient::STATUS_ACTIVE,
                    'is_active' => true,
                    'created_by' => $actor?->id,
                    'updated_by' => $actor?->id,
                ]
            );
        }
    }

    private function name(int $i): string
    {
        return $this->ho[$i % count($this->ho)]
            .' '.$this->dem[$i % count($this->dem)]
            .' '.$this->ten[($i * 3) % count($this->ten)];
    }
}
