<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\ExaminationSession;
use App\Models\Patient;
use App\Models\Role;
use App\Models\Staff;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * UC12 - Auto-save PATCH /api/examinations/{id} + optimistic locking (AC28).
 *
 * Cover regression: AC28 truoc day so sanh chuoi toIso8601String() con giu
 * offset mui gio. Khi app timezone != UTC (Asia/Ho_Chi_Minh +07:00), client
 * gui gio UTC (Z) con server giu gio dia phuong -> hai chuoi luon khac nhau
 * -> autosave luon bi tu choi AC28 du chi co 1 nguoi thao tac. He qua:
 * conclusion khong bao gio duoc luu. Cac test duoi dam bao:
 *  - happy path: cung mot nguoi luu lien tuc -> 200, du lieu duoc luu.
 *  - conflict that: timestamp cu (nguoi khac da sua) -> 409 AC28.
 */
class ExaminationUpdateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->seed(PermissionSeeder::class);
    }

    public function test_doctor_can_autosave_conclusion_with_serialized_updated_at(): void
    {
        $doctor = $this->createDoctor();
        $session = $this->createSession($doctor);
        Sanctum::actingAs($doctor);

        // Lay updated_at dung nhu API tra ve (UTC, hau to Z) - giong client.
        $clientUpdatedAt = $this->getJson("/api/examinations/{$session->id}")
            ->assertOk()
            ->json('data.updated_at');

        $this->assertNotNull($clientUpdatedAt);

        $response = $this->patchJson("/api/examinations/{$session->id}", [
            'conclusion' => 'Suc khoe rang trung binh',
            'last_updated_at' => $clientUpdatedAt,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.conclusion', 'Suc khoe rang trung binh');

        $this->assertDatabaseHas('examination_sessions', [
            'id' => $session->id,
            'conclusion' => 'Suc khoe rang trung binh',
        ]);
    }

    public function test_autosave_rejected_when_record_changed_by_someone_else(): void
    {
        $doctor = $this->createDoctor();
        $session = $this->createSession($doctor);
        Sanctum::actingAs($doctor);

        $staleUpdatedAt = $this->getJson("/api/examinations/{$session->id}")
            ->assertOk()
            ->json('data.updated_at');

        // Mo phong nguoi khac sua ho so -> updated_at nhay sang giay khac.
        // Query builder update bo qua auto-timestamp nen set duoc gia tri chinh xac.
        ExaminationSession::query()
            ->where('id', $session->id)
            ->update(['updated_at' => now()->addSeconds(30)]);

        $response = $this->patchJson("/api/examinations/{$session->id}", [
            'conclusion' => 'Ghi de',
            'last_updated_at' => $staleUpdatedAt,
        ]);

        $response->assertStatus(409)
            ->assertJsonValidationErrors(['last_updated_at']);
    }

    // Helpers ----------------------------------------------------------

    private function createSession(User $doctor): ExaminationSession
    {
        $patient = Patient::create([
            'patient_code' => 'BN'.now()->format('YmdHis').random_int(100, 999),
            'full_name' => 'Benh Nhan '.uniqid(),
            'phone' => '09'.random_int(10000000, 99999999),
            'gender' => 'male',
            'status' => Patient::STATUS_ACTIVE,
            'is_active' => true,
        ]);

        $appointment = Appointment::create([
            'code' => 'APT'.now()->format('Y').str_pad((string) random_int(1, 999999), 6, '0', STR_PAD_LEFT),
            'patient_id' => $patient->id,
            'appointment_date' => now()->toDateString(),
            'time_slot' => '09-10',
            'source' => Appointment::SOURCE_WALK_IN,
            'branch_id' => 'PK1-HN',
            'status' => Appointment::STATUS_IN_PROGRESS,
            'assigned_doctor_id' => $doctor->id,
        ]);

        return ExaminationSession::create([
            'code' => 'BA-'.now()->format('Y').'-'.str_pad((string) random_int(1, 999999), 6, '0', STR_PAD_LEFT),
            'patient_id' => $patient->id,
            'appointment_id' => $appointment->id,
            'doctor_id' => $doctor->id,
            'status' => ExaminationSession::STATUS_DANG_KHAM,
            'started_at' => now(),
            'created_by' => $doctor->id,
            'updated_by' => $doctor->id,
        ]);
    }

    private function createDoctor(): User
    {
        $user = User::factory()->create([
            'name' => 'Bac Si '.uniqid(),
            'email' => 'doctor.'.uniqid().'@test.local',
            'username' => 'doctor_'.uniqid(),
            'password' => Hash::make('Password@123'),
        ]);
        $user->roles()->attach(Role::where('slug', 'bac_si')->firstOrFail()->id);

        Staff::create([
            'employee_code' => 'BS'.random_int(100000, 999999),
            'full_name' => $user->name,
            'phone' => '08'.random_int(10000000, 99999999),
            'email' => $user->email,
            'status' => 'working',
            'role_slug' => 'bac_si',
            'user_id' => $user->id,
        ]);

        return $user;
    }
}
