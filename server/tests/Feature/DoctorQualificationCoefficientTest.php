<?php

namespace Tests\Feature;

use App\Models\DoctorQualificationCoefficient;
use App\Models\ProfessionalProfile;
use App\Models\QualificationCatalog;
use App\Models\Role;
use App\Models\Staff;
use App\Models\User;
use App\Services\DoctorQualificationCoefficientService;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DoctorQualificationCoefficientTest extends TestCase
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
        $doctorateCatalog = QualificationCatalog::query()->where('code', 'tien_si')->firstOrFail();

        $response = $this->postJson('/api/payroll/doctor-qualification-coefficients', [
            'qualification_code' => 'tien_si',
            'qualification_type' => DoctorQualificationCoefficient::TYPE_DEGREE,
            'coefficient' => 1.7,
            'effective_from' => Carbon::now()->toDateString(),
            'change_reason' => 'policy_change',
        ]);

        $response->assertCreated()
            ->assertJsonPath('status', DoctorQualificationCoefficient::STATUS_ACTIVE)
            ->assertJsonPath('qualification_catalog_id', $doctorateCatalog->id)
            ->assertJsonPath('qualification_code', 'tien_si')
            ->assertJsonPath('qualification_type', DoctorQualificationCoefficient::TYPE_DEGREE)
            ->assertJsonPath('priority', 3)
            ->assertJsonPath('coefficient', '1.70');

        $this->assertNotEmpty($response->json('code'));
        $this->assertDatabaseHas('doctor_qualification_coefficients', [
            'id' => $response->json('id'),
            'qualification_catalog_id' => $doctorateCatalog->id,
            'qualification_code' => 'tien_si',
            'qualification_name' => 'Tiến sĩ',
        ]);
        $doctorateCatalog->update(['name' => 'Tiến sĩ đã đổi tên', 'priority' => 9]);
        $snapshot = DoctorQualificationCoefficient::query()->findOrFail($response->json('id'));
        $this->assertSame($doctorateCatalog->id, $snapshot->qualification_catalog_id);
        $this->assertSame('Tiến sĩ', $snapshot->qualification_name);
        $this->assertSame(3, $snapshot->priority);

        $matrix = $this->getJson('/api/payroll/doctor-qualification-coefficients/effective')
            ->assertOk()
            ->json();

        $this->assertSame('1.70', $matrix['matrix']['tien_si']['coefficient']);
        $this->assertTrue($matrix['matrix']['dai_hoc']['is_default']);
        $this->assertSame('1.00', $matrix['matrix']['dai_hoc']['coefficient']);
    }

    public function test_options_read_qualifications_from_catalog(): void
    {
        Sanctum::actingAs($this->createUser('admin'));

        $this->getJson('/api/payroll/doctor-qualification-coefficients/options')
            ->assertOk()
            ->assertJsonPath('qualifications.0.code', 'giao_su')
            ->assertJsonPath('qualifications.0.name', 'Giáo sư')
            ->assertJsonPath('qualifications.0.type', QualificationCatalog::TYPE_ACADEMIC_TITLE);

        $this->assertDatabaseHas('qualification_catalogs', [
            'code' => 'giao_su',
            'status' => QualificationCatalog::STATUS_ACTIVE,
        ]);
    }

    public function test_validation_rejects_invalid_coefficient_date_range_and_type(): void
    {
        Sanctum::actingAs($this->createUser('admin'));

        $this->postJson('/api/payroll/doctor-qualification-coefficients', [
            'qualification_code' => 'thac_si',
            'qualification_type' => DoctorQualificationCoefficient::TYPE_DEGREE,
            'coefficient' => 3.5,
            'effective_from' => Carbon::now()->toDateString(),
        ])->assertStatus(422);

        $this->postJson('/api/payroll/doctor-qualification-coefficients', [
            'qualification_code' => 'thac_si',
            'qualification_type' => DoctorQualificationCoefficient::TYPE_DEGREE,
            'coefficient' => 1.5,
            'effective_from' => Carbon::now()->addMonth()->toDateString(),
            'effective_to' => Carbon::now()->toDateString(),
        ])->assertStatus(422);

        $this->postJson('/api/payroll/doctor-qualification-coefficients', [
            'qualification_code' => 'giao_su',
            'qualification_type' => DoctorQualificationCoefficient::TYPE_DEGREE,
            'coefficient' => 2.5,
            'effective_from' => Carbon::now()->toDateString(),
        ])->assertStatus(422);
    }

    public function test_future_version_caps_predecessor_and_blocks_overlap(): void
    {
        Sanctum::actingAs($this->createUser('admin'));

        $first = $this->postJson('/api/payroll/doctor-qualification-coefficients', [
            'qualification_code' => 'thac_si',
            'qualification_type' => DoctorQualificationCoefficient::TYPE_DEGREE,
            'coefficient' => 1.5,
            'effective_from' => Carbon::now()->subMonth()->toDateString(),
        ])->assertCreated()->json();

        $futureFrom = Carbon::now()->addMonth()->startOfDay();
        $this->postJson('/api/payroll/doctor-qualification-coefficients', [
            'qualification_code' => 'thac_si',
            'qualification_type' => DoctorQualificationCoefficient::TYPE_DEGREE,
            'coefficient' => 1.6,
            'effective_from' => $futureFrom->toDateString(),
            'effective_to' => $futureFrom->copy()->addMonth()->toDateString(),
        ])->assertCreated();

        $previous = DoctorQualificationCoefficient::findOrFail($first['id']);
        $this->assertNotNull($previous->effective_to);
        $this->assertTrue($previous->effective_to->lessThan($futureFrom));

        $this->postJson('/api/payroll/doctor-qualification-coefficients', [
            'qualification_code' => 'thac_si',
            'qualification_type' => DoctorQualificationCoefficient::TYPE_DEGREE,
            'coefficient' => 1.8,
            'effective_from' => $futureFrom->copy()->addDays(10)->toDateString(),
            'effective_to' => $futureFrom->copy()->addMonths(2)->toDateString(),
        ])->assertStatus(422);

        $this->postJson('/api/payroll/doctor-qualification-coefficients', [
            'qualification_code' => 'tien_si',
            'qualification_type' => DoctorQualificationCoefficient::TYPE_DEGREE,
            'coefficient' => 1.7,
            'effective_from' => $futureFrom->copy()->addDays(10)->toDateString(),
        ])->assertCreated();
    }

    public function test_bulk_create_rolls_back_invalid_rows(): void
    {
        Sanctum::actingAs($this->createUser('admin'));

        $from = Carbon::now()->toDateString();
        $items = QualificationCatalog::query()
            ->where('status', QualificationCatalog::STATUS_ACTIVE)
            ->orderBy('priority')
            ->get()
            ->map(fn (QualificationCatalog $qualification) => $qualification->toPayrollOption())
            ->map(fn (array $qualification) => [
                'qualification_code' => $qualification['code'],
                'qualification_type' => $qualification['type'],
                'priority' => $qualification['priority'],
                'coefficient' => $qualification['default_coefficient'],
                'effective_from' => $from,
            ])->all();

        $this->postJson('/api/payroll/doctor-qualification-coefficients/bulk', [
            'items' => $items,
        ])->assertCreated()
            ->assertJsonCount(5, 'data');

        $this->assertDatabaseCount('doctor_qualification_coefficients', 5);

        DoctorQualificationCoefficient::truncate();
        $items[2]['coefficient'] = 4;

        $this->postJson('/api/payroll/doctor-qualification-coefficients/bulk', [
            'items' => $items,
        ])->assertStatus(422);

        $this->assertDatabaseCount('doctor_qualification_coefficients', 0);
    }

    public function test_accountant_can_manage_but_receptionist_cannot(): void
    {
        Sanctum::actingAs($this->createUser('ke_toan'));

        $this->postJson('/api/payroll/doctor-qualification-coefficients', [
            'qualification_code' => 'dai_hoc',
            'qualification_type' => DoctorQualificationCoefficient::TYPE_DEGREE,
            'coefficient' => 1.3,
            'effective_from' => Carbon::now()->toDateString(),
        ])->assertCreated();

        Sanctum::actingAs($this->createUser('le_tan'));

        $this->postJson('/api/payroll/doctor-qualification-coefficients', [
            'qualification_code' => 'tien_si',
            'qualification_type' => DoctorQualificationCoefficient::TYPE_DEGREE,
            'coefficient' => 1.7,
            'effective_from' => Carbon::now()->toDateString(),
        ])->assertForbidden();
    }

    public function test_stop_records_audit_log(): void
    {
        Sanctum::actingAs($this->createUser('admin'));

        $created = $this->postJson('/api/payroll/doctor-qualification-coefficients', [
            'qualification_code' => 'pho_giao_su',
            'qualification_type' => DoctorQualificationCoefficient::TYPE_ACADEMIC_TITLE,
            'coefficient' => 2,
            'effective_from' => Carbon::now()->toDateString(),
        ])->assertCreated()->json();

        $this->postJson("/api/payroll/doctor-qualification-coefficients/{$created['id']}/stop", [
            'reason' => 'policy_changed',
            'reason_detail' => 'Stop for test',
        ])->assertOk()
            ->assertJsonPath('status', DoctorQualificationCoefficient::STATUS_STOPPED);

        $this->getJson("/api/payroll/doctor-qualification-coefficients/{$created['id']}/audit-logs")
            ->assertOk()
            ->assertJsonFragment(['action' => 'doctor_qualification_coefficient.stopped']);
    }

    public function test_resolver_uses_highest_priority_and_logs_default(): void
    {
        $actor = $this->createUser('admin');

        $professor = DoctorQualificationCoefficient::create($this->coefficientRecordAttributes('DQC-RESOLVE-001', 'giao_su', [
            'coefficient' => 2.5,
        ]));

        DoctorQualificationCoefficient::create($this->coefficientRecordAttributes('DQC-RESOLVE-002', 'tien_si', [
            'coefficient' => 1.7,
        ]));

        $resolved = app(DoctorQualificationCoefficientService::class)
            ->resolveForQualifications(['tien_si', 'giao_su'], Carbon::now(), $actor);

        $this->assertSame(2.5, $resolved['coefficient']);
        $this->assertSame($professor->id, $resolved['config_id']);
        $this->assertFalse($resolved['is_default']);

        DoctorQualificationCoefficient::truncate();

        $fallback = app(DoctorQualificationCoefficientService::class)
            ->resolveForQualifications(['unknown'], Carbon::now(), $actor);

        $this->assertSame(1.0, $fallback['coefficient']);
        $this->assertTrue($fallback['is_default']);
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'doctor_qualification_coefficient.default_used',
        ]);
    }

    public function test_resolver_reads_profile_qualifications_and_staff_fallback(): void
    {
        $actor = $this->createUser('admin');
        $doctorUser = $this->createUser('bac_si');
        $staff = Staff::create([
            'employee_code' => 'BSPAY001',
            'full_name' => 'Doctor Payroll',
            'email' => 'doctor-payroll@example.com',
            'role_slug' => 'bac_si',
            'status' => 'working',
            'user_id' => $doctorUser->id,
            'highest_degree' => 'Thạc sĩ',
        ]);
        $profile = ProfessionalProfile::create([
            'staff_id' => $staff->id,
            'profile_role' => 'bac_si',
            'status' => ProfessionalProfile::STATUS_APPROVED,
            'approved_at' => now(),
            'is_active' => true,
        ]);
        $professorCatalog = QualificationCatalog::query()->where('code', 'giao_su')->firstOrFail();
        $profile->qualificationCatalogs()->attach($professorCatalog->id, [
            'source' => 'test',
        ]);

        $professor = DoctorQualificationCoefficient::create($this->coefficientRecordAttributes('DQC-PROFILE-001', 'giao_su', [
            'coefficient' => 2.5,
        ]));
        $master = DoctorQualificationCoefficient::create($this->coefficientRecordAttributes('DQC-PROFILE-002', 'thac_si', [
            'coefficient' => 1.5,
        ]));

        $resolved = app(DoctorQualificationCoefficientService::class)
            ->resolveForStaff($staff, Carbon::now(), $actor);

        $this->assertSame($professor->id, $resolved['config_id']);
        $this->assertSame(2.5, $resolved['coefficient']);

        $fallbackUser = $this->createUser('bac_si');
        $fallbackStaff = Staff::create([
            'employee_code' => 'BSPAY002',
            'full_name' => 'Doctor Fallback',
            'email' => 'doctor-fallback@example.com',
            'role_slug' => 'bac_si',
            'status' => 'working',
            'user_id' => $fallbackUser->id,
            'highest_degree' => 'Thạc sĩ',
        ]);

        $fallback = app(DoctorQualificationCoefficientService::class)
            ->resolveForStaff($fallbackStaff, Carbon::now(), $actor);

        $this->assertSame($master->id, $fallback['config_id']);
        $this->assertSame(1.5, $fallback['coefficient']);
    }

    /**
     * @param  array<string,mixed>  $overrides
     * @return array<string,mixed>
     */
    private function coefficientRecordAttributes(string $code, string $qualificationCode, array $overrides = []): array
    {
        $catalog = QualificationCatalog::query()->where('code', $qualificationCode)->firstOrFail();
        $option = $catalog->toPayrollOption();

        return array_merge([
            'code' => $code,
            'qualification_catalog_id' => $catalog->id,
            'qualification_code' => $catalog->code,
            'qualification_name' => $catalog->name,
            'qualification_type' => $catalog->type,
            'priority' => $catalog->priority,
            'coefficient' => $option['default_coefficient'],
            'effective_from' => Carbon::parse('2026-01-01', 'Asia/Ho_Chi_Minh')->startOfDay(),
            'status' => DoctorQualificationCoefficient::STATUS_ACTIVE,
        ], $overrides);
    }

    private function createUser(string $roleSlug): User
    {
        $user = User::factory()->create([
            'name' => $roleSlug.' user',
            'email' => $roleSlug.'-uc154@example.com',
            'username' => $roleSlug.'_uc154',
            'password' => Hash::make('Password@123'),
        ]);
        $user->roles()->attach(Role::where('slug', $roleSlug)->firstOrFail()->id);

        return $user;
    }
}
