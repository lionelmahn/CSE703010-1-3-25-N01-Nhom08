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
        $this->call(SamplePayrollConfigSeeder::class);
        $this->call(SampleStaffSeeder::class);
        $this->call(SamplePatientSeeder::class);
        $this->call(SampleScheduleClinicalSeeder::class);
    }
}
