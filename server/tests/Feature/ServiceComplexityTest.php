<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\ExaminationServiceItem;
use App\Models\ExaminationSession;
use App\Models\Patient;
use App\Models\Role;
use App\Models\Service;
use App\Models\ServiceComplexityCoefficient;
use App\Models\User;
use App\Services\ExaminationServiceItemService;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ServiceComplexityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow(Carbon::parse('2026-06-06 09:00:00', 'Asia/Ho_Chi_Minh'));
        $this->seed(RoleSeeder::class);
        $this->seed(PermissionSeeder::class);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_admin_can_create_and_read_effective_matrix(): void
    {
        Sanctum::actingAs($this->createUser('admin'));
        $service = $this->createService();

        $response = $this->postJson('/api/payroll/service-complexities', [
            'service_id' => $service->id,
            'processing_level' => ExaminationServiceItem::LEVEL_KHO,
            'coefficient' => 0.15,
            'effective_from' => Carbon::now()->toDateString(),
            'change_reason' => 'policy_change',
        ]);

        $response->assertCreated()
            ->assertJsonPath('status', ServiceComplexityCoefficient::STATUS_ACTIVE)
            ->assertJsonPath('service_id', $service->id)
            ->assertJsonPath('processing_level', ExaminationServiceItem::LEVEL_KHO)
            ->assertJsonPath('coefficient', '0.15');

        $this->assertNotEmpty($response->json('code'));

        $matrix = $this->getJson('/api/payroll/service-complexities/effective?service_id='.$service->id)
            ->assertOk()
            ->json();

        $this->assertSame('0.15', $matrix['matrix'][$service->id][ExaminationServiceItem::LEVEL_KHO]['coefficient']);
        $this->assertTrue($matrix['matrix'][$service->id][ExaminationServiceItem::LEVEL_PHUC_TAP]['is_default']);
    }

    public function test_validation_rejects_invalid_level_ranges_and_discontinued_services(): void
    {
        Sanctum::actingAs($this->createUser('admin'));
        $service = $this->createService();

        $this->postJson('/api/payroll/service-complexities', [
            'service_id' => $service->id,
            'processing_level' => ExaminationServiceItem::LEVEL_THONG_THUONG,
            'coefficient' => 0.1,
            'effective_from' => Carbon::now()->toDateString(),
        ])->assertStatus(422);

        $this->postJson('/api/payroll/service-complexities', [
            'service_id' => $service->id,
            'processing_level' => ExaminationServiceItem::LEVEL_PHUC_TAP,
            'coefficient' => 0.2,
            'effective_from' => Carbon::now()->toDateString(),
        ])->assertStatus(422);

        foreach ([Service::STATUS_HIDDEN, Service::STATUS_DRAFT] as $status) {
            $configurable = $this->createService(['status' => $status]);
            $this->postJson('/api/payroll/service-complexities', [
                'service_id' => $configurable->id,
                'processing_level' => ExaminationServiceItem::LEVEL_KHO,
                'coefficient' => 0.1,
                'effective_from' => Carbon::now()->toDateString(),
            ])->assertCreated();
        }

        $discontinued = $this->createService(['status' => Service::STATUS_DISCONTINUED]);
        $this->postJson('/api/payroll/service-complexities', [
            'service_id' => $discontinued->id,
            'processing_level' => ExaminationServiceItem::LEVEL_KHO,
            'coefficient' => 0.1,
            'effective_from' => Carbon::now()->toDateString(),
        ])->assertStatus(422);
    }

    public function test_future_version_caps_predecessor_and_blocks_overlap(): void
    {
        Sanctum::actingAs($this->createUser('admin'));
        $service = $this->createService();

        $first = $this->postJson('/api/payroll/service-complexities', [
            'service_id' => $service->id,
            'processing_level' => ExaminationServiceItem::LEVEL_KHO,
            'coefficient' => 0.1,
            'effective_from' => Carbon::now()->subMonth()->toDateString(),
        ])->assertCreated()->json();

        $futureFrom = Carbon::now()->addMonth()->startOfDay();
        $this->postJson('/api/payroll/service-complexities', [
            'service_id' => $service->id,
            'processing_level' => ExaminationServiceItem::LEVEL_KHO,
            'coefficient' => 0.2,
            'effective_from' => $futureFrom->toDateString(),
            'effective_to' => $futureFrom->copy()->addMonth()->toDateString(),
        ])->assertCreated();

        $previous = ServiceComplexityCoefficient::findOrFail($first['id']);
        $this->assertNotNull($previous->effective_to);
        $this->assertTrue($previous->effective_to->lessThan($futureFrom));

        $this->postJson('/api/payroll/service-complexities', [
            'service_id' => $service->id,
            'processing_level' => ExaminationServiceItem::LEVEL_KHO,
            'coefficient' => 0.15,
            'effective_from' => $futureFrom->copy()->addDays(10)->toDateString(),
            'effective_to' => $futureFrom->copy()->addMonths(2)->toDateString(),
        ])->assertStatus(422);

        $this->postJson('/api/payroll/service-complexities', [
            'service_id' => $service->id,
            'processing_level' => ExaminationServiceItem::LEVEL_PHUC_TAP,
            'coefficient' => 0.3,
            'effective_from' => $futureFrom->copy()->addDays(10)->toDateString(),
        ])->assertCreated();
    }

    public function test_bulk_create_rolls_back_invalid_cells(): void
    {
        Sanctum::actingAs($this->createUser('admin'));
        $service = $this->createService();
        $from = Carbon::now()->toDateString();

        $items = [
            ['processing_level' => ExaminationServiceItem::LEVEL_THONG_THUONG, 'coefficient' => 0],
            ['processing_level' => ExaminationServiceItem::LEVEL_KHO, 'coefficient' => 0.1],
            ['processing_level' => ExaminationServiceItem::LEVEL_PHUC_TAP, 'coefficient' => 0.3],
            ['processing_level' => ExaminationServiceItem::LEVEL_RAT_PHUC_TAP, 'coefficient' => 0.5],
        ];

        $payload = array_map(fn ($item) => [
            'service_id' => $service->id,
            'processing_level' => $item['processing_level'],
            'coefficient' => $item['coefficient'],
            'effective_from' => $from,
        ], $items);

        $this->postJson('/api/payroll/service-complexities/bulk', [
            'items' => $payload,
        ])->assertCreated()
            ->assertJsonCount(4, 'data');

        $this->assertDatabaseCount('service_complexity_coefficients', 4);

        ServiceComplexityCoefficient::truncate();
        $payload[2]['coefficient'] = 0.2;

        $this->postJson('/api/payroll/service-complexities/bulk', [
            'items' => $payload,
        ])->assertStatus(422);

        $this->assertDatabaseCount('service_complexity_coefficients', 0);
    }

    public function test_accountant_can_manage_but_receptionist_cannot(): void
    {
        $service = $this->createService();
        Sanctum::actingAs($this->createUser('ke_toan'));

        $this->postJson('/api/payroll/service-complexities', [
            'service_id' => $service->id,
            'processing_level' => ExaminationServiceItem::LEVEL_KHO,
            'coefficient' => 0.1,
            'effective_from' => Carbon::now()->toDateString(),
        ])->assertCreated();

        Sanctum::actingAs($this->createUser('le_tan'));

        $this->postJson('/api/payroll/service-complexities', [
            'service_id' => $service->id,
            'processing_level' => ExaminationServiceItem::LEVEL_PHUC_TAP,
            'coefficient' => 0.3,
            'effective_from' => Carbon::now()->toDateString(),
        ])->assertForbidden();
    }

    public function test_stop_records_audit_log(): void
    {
        Sanctum::actingAs($this->createUser('admin'));
        $service = $this->createService();

        $created = $this->postJson('/api/payroll/service-complexities', [
            'service_id' => $service->id,
            'processing_level' => ExaminationServiceItem::LEVEL_RAT_PHUC_TAP,
            'coefficient' => 0.5,
            'effective_from' => Carbon::now()->toDateString(),
        ])->assertCreated()->json();

        $this->postJson("/api/payroll/service-complexities/{$created['id']}/stop", [
            'reason' => 'policy_changed',
            'reason_detail' => 'Stop for test',
        ])->assertOk()
            ->assertJsonPath('status', ServiceComplexityCoefficient::STATUS_STOPPED);

        $this->getJson("/api/payroll/service-complexities/{$created['id']}/audit-logs")
            ->assertOk()
            ->assertJsonFragment(['action' => 'service_complexity.stopped']);
    }

    public function test_uc12_uses_active_config_and_snapshots_config_id(): void
    {
        $doctor = $this->createUser('bac_si');
        $service = $this->createService();
        $coefficient = ServiceComplexityCoefficient::create([
            'code' => 'SCX-TEST-001',
            'service_id' => $service->id,
            'processing_level' => ExaminationServiceItem::LEVEL_PHUC_TAP,
            'coefficient' => 0.35,
            'effective_from' => Carbon::now()->startOfDay(),
            'status' => ServiceComplexityCoefficient::STATUS_ACTIVE,
        ]);
        $session = $this->createExaminationSession($doctor);

        $item = app(ExaminationServiceItemService::class)->addItem($session->id, [
            'service_id' => $service->id,
            'processing_level' => ExaminationServiceItem::LEVEL_PHUC_TAP,
            'quantity' => 1,
            'complexity_reason' => 'Ca kho',
        ], $doctor);

        $this->assertSame(0.35, (float) $item->complexity_coefficient);
        $this->assertSame($coefficient->id, $item->service_complexity_coefficient_id);
    }

    private function createService(array $overrides = []): Service
    {
        return Service::create(array_merge([
            'service_code' => 'DV'.random_int(1000, 9999),
            'name' => 'Dich vu UC17 '.random_int(1000, 9999),
            'price' => 100000,
            'commission_rate' => 10,
            'status' => Service::STATUS_ACTIVE,
            'visibility' => Service::VISIBILITY_INTERNAL,
        ], $overrides));
    }

    private function createExaminationSession(User $doctor): ExaminationSession
    {
        $patient = Patient::create([
            'patient_code' => 'BN-UC17-001',
            'full_name' => 'Benh nhan UC17',
            'phone' => '0900000017',
        ]);

        $appointment = Appointment::create([
            'code' => 'APT-UC17-001',
            'patient_id' => $patient->id,
            'appointment_date' => Carbon::now()->toDateString(),
            'time_slot' => '09:00-10:00',
            'status' => Appointment::STATUS_IN_PROGRESS,
            'assigned_doctor_id' => $doctor->id,
        ]);

        return ExaminationSession::create([
            'code' => 'BA-UC17-001',
            'patient_id' => $patient->id,
            'appointment_id' => $appointment->id,
            'doctor_id' => $doctor->id,
            'status' => ExaminationSession::STATUS_DANG_KHAM,
            'started_at' => Carbon::now(),
            'created_by' => $doctor->id,
        ]);
    }

    private function createUser(string $roleSlug): User
    {
        $user = User::factory()->create([
            'name' => $roleSlug.' user',
            'email' => $roleSlug.'-uc17@example.com',
            'username' => $roleSlug.'_uc17',
            'password' => Hash::make('Password@123'),
        ]);
        $user->roles()->attach(Role::where('slug', $roleSlug)->firstOrFail()->id);

        return $user;
    }
}
