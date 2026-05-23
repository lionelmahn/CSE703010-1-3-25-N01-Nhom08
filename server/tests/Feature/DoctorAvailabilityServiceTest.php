<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Branch;
use App\Models\Patient;
use App\Models\ProfessionalProfile;
use App\Models\ProfessionalProfileSpecialty;
use App\Models\Role;
use App\Models\Service;
use App\Models\Staff;
use App\Models\User;
use App\Models\WorkSchedule;
use App\Services\DoctorAvailabilityService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DoctorAvailabilityServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    public function test_legacy_branch_and_other_service_do_not_block_assignment(): void
    {
        [$doctor, $branch] = $this->createScheduledDoctor();
        $appointment = $this->createAppointment('q1', ['other']);

        $result = app(DoctorAvailabilityService::class)
            ->validateAssignment($doctor->id, $appointment);

        $this->assertTrue($result['ok'], json_encode($result, JSON_UNESCAPED_UNICODE));
    }

    public function test_service_code_is_resolved_for_specialty_matching(): void
    {
        [$doctor, $branch, $service] = $this->createScheduledDoctor();
        $appointment = $this->createAppointment((string) $branch->id, [$service->service_code]);

        $result = app(DoctorAvailabilityService::class)
            ->validateAssignment($doctor->id, $appointment);

        $this->assertTrue($result['ok'], json_encode($result, JSON_UNESCAPED_UNICODE));
    }

    public function test_numeric_service_id_is_resolved_for_specialty_matching(): void
    {
        [$doctor, $branch, $service] = $this->createScheduledDoctor();
        $appointment = $this->createAppointment((string) $branch->id, [(string) $service->id]);

        $result = app(DoctorAvailabilityService::class)
            ->validateAssignment($doctor->id, $appointment);

        $this->assertTrue($result['ok'], json_encode($result, JSON_UNESCAPED_UNICODE));
    }

    private function createScheduledDoctor(): array
    {
        $branch = Branch::create([
            'code' => 'PK1-HN',
            'name' => 'Phong Kham 1',
            'status' => 'active',
        ]);
        $service = Service::create([
            'service_code' => 'DV0001',
            'name' => 'Kham tong quat',
            'price' => 100000,
            'duration_minutes' => 60,
            'commission_rate' => 0,
            'status' => Service::STATUS_ACTIVE,
            'visibility' => Service::VISIBILITY_PUBLIC,
        ]);
        $user = User::factory()->create(['name' => 'Bac si Nguyen A']);
        $user->roles()->attach(Role::where('slug', 'bac_si')->firstOrFail()->id);
        $staff = Staff::create([
            'employee_code' => 'BS01',
            'full_name' => $user->name,
            'email' => $user->email,
            'role_slug' => 'bac_si',
            'status' => 'working',
            'user_id' => $user->id,
            'branch_id' => $branch->id,
        ]);
        $profile = ProfessionalProfile::create([
            'staff_id' => $staff->id,
            'profile_role' => 'bac_si',
            'status' => ProfessionalProfile::STATUS_APPROVED,
            'is_active' => true,
            'approved_at' => now(),
        ]);
        ProfessionalProfileSpecialty::create([
            'professional_profile_id' => $profile->id,
            'specialty_name' => 'Tong quat',
            'service_scope' => [$service->id],
        ]);
        WorkSchedule::create([
            'staff_id' => $staff->id,
            'branch_id' => $branch->id,
            'work_date' => '2026-06-01',
            'start_time' => '07:00:00',
            'end_time' => '11:00:00',
            'work_role' => 'doctor_treatment',
            'status' => WorkSchedule::STATUS_SCHEDULED,
        ]);

        return [$user, $branch, $service];
    }

    private function createAppointment(string $branchRef, array $serviceIds): Appointment
    {
        $patient = Patient::create([
            'patient_code' => Patient::generateCode(),
            'full_name' => 'Benh nhan A',
            'phone' => '0901234567',
            'status' => Patient::STATUS_ACTIVE,
            'is_active' => true,
        ]);

        return Appointment::create([
            'code' => Appointment::generateCode(),
            'patient_id' => $patient->id,
            'appointment_date' => '2026-06-01',
            'time_slot' => '09-10',
            'source' => Appointment::SOURCE_ONLINE,
            'service_ids' => $serviceIds,
            'branch_id' => $branchRef,
            'status' => Appointment::STATUS_WAITING_DOCTOR_ASSIGNMENT,
        ]);
    }
}
