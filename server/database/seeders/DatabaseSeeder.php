<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call(RoleSeeder::class);
        $this->call(PermissionSeeder::class);
        $this->call(UserSeeder::class);
        $this->call(BranchSeeder::class);
        $this->call(StaffSeeder::class);
        $this->call(ServiceSeeder::class);
        $this->call(ServicePackageSeeder::class);
        $this->call(QualificationCatalogSeeder::class);
        $this->call(ProfessionalProfileSeeder::class);
        $this->call(WorkShiftTemplateSeeder::class);
        $this->call(ToothStatusSeeder::class);
        $this->call(PatientSeeder::class);
        $this->call(NotificationTemplateSeeder::class);
        $this->call(DemoDataSeeder::class);

        // Du lieu mau mo rong (mau "SMP") - giu nguyen user goc, them du lieu de test.
        // Trai ~2 nam, phu moi nghiep vu + moi trang thai, noi dung thuc te.
        $this->call(SamplePayrollConfigSeeder::class);   // cau hinh luong (hieu luc tu dau cua so)
        $this->call(SampleStaffSeeder::class);           // bac si / le tan / ke toan
        $this->call(SamplePatientSeeder::class);         // 100 benh nhan
        $this->call(SampleScheduleClinicalSeeder::class);// ca lam + phien kham + hoa don + thanh toan (24 thang)
        $this->call(SampleSalarySlipSeeder::class);      // phieu luong moi bac si x moi thang
        $this->call(SampleAppointmentStatesSeeder::class);// lich hen moi trang thai + hang doi
        $this->call(SampleScheduleRequestsSeeder::class);// don nghi phep + doi ca
        $this->call(SampleOnlineBookingSeeder::class);   // yeu cau dat lich online moi trang thai
    }
}
