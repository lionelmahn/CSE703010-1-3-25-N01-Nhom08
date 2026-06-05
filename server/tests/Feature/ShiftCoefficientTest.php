<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\ShiftCoefficient;
use App\Models\Staff;
use App\Models\User;
use App\Models\WorkSchedule;
use App\Services\ShiftCoefficientService;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ShiftCoefficientTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow(Carbon::parse('2026-06-05 09:00:00', 'Asia/Ho_Chi_Minh'));
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

        $response = $this->postJson('/api/payroll/shift-coefficients', [
            'name' => 'Ngày thường ca sáng',
            'day_type' => ShiftCoefficient::DAY_TYPE_WEEKDAY,
            'shift_type' => ShiftCoefficient::SHIFT_TYPE_MORNING,
            'coefficient' => 1.25,
            'effective_from' => Carbon::now()->toDateString(),
            'change_reason' => 'policy_change',
        ]);

        $response->assertCreated()
            ->assertJsonPath('status', ShiftCoefficient::STATUS_ACTIVE)
            ->assertJsonPath('day_type', ShiftCoefficient::DAY_TYPE_WEEKDAY)
            ->assertJsonPath('shift_type', ShiftCoefficient::SHIFT_TYPE_MORNING)
            ->assertJsonPath('coefficient', '1.25');

        $this->assertNotEmpty($response->json('code'));

        $this->getJson('/api/payroll/shift-coefficients/effective')
            ->assertOk()
            ->assertJsonCount(4, 'day_types')
            ->assertJsonCount(4, 'shift_types')
            ->assertJsonPath('matrix.weekday.morning.coefficient', '1.25')
            ->assertJsonPath('matrix.saturday.morning.is_default', true);
    }

    public function test_validation_rejects_invalid_coefficient_and_date_range(): void
    {
        Sanctum::actingAs($this->createUser('admin'));

        $this->postJson('/api/payroll/shift-coefficients', [
            'name' => 'Invalid',
            'day_type' => ShiftCoefficient::DAY_TYPE_WEEKDAY,
            'shift_type' => ShiftCoefficient::SHIFT_TYPE_MORNING,
            'coefficient' => 0.9,
            'effective_from' => Carbon::now()->toDateString(),
        ])->assertStatus(422);

        $this->postJson('/api/payroll/shift-coefficients', [
            'name' => 'Invalid range',
            'day_type' => ShiftCoefficient::DAY_TYPE_WEEKDAY,
            'shift_type' => ShiftCoefficient::SHIFT_TYPE_MORNING,
            'coefficient' => 1.2,
            'effective_from' => Carbon::now()->addMonth()->toDateString(),
            'effective_to' => Carbon::now()->toDateString(),
        ])->assertStatus(422);
    }

    public function test_future_version_caps_same_day_and_shift_predecessor_and_blocks_overlap(): void
    {
        Sanctum::actingAs($this->createUser('admin'));

        $first = $this->postJson('/api/payroll/shift-coefficients', [
            'name' => 'Ca tối thứ 7 cũ',
            'day_type' => ShiftCoefficient::DAY_TYPE_SATURDAY,
            'shift_type' => ShiftCoefficient::SHIFT_TYPE_EVENING,
            'coefficient' => 1.5,
            'effective_from' => Carbon::now()->subMonth()->toDateString(),
        ])->assertCreated()->json();

        $futureFrom = Carbon::now()->addMonth()->startOfDay();
        $this->postJson('/api/payroll/shift-coefficients', [
            'name' => 'Ca tối thứ 7 mới',
            'day_type' => ShiftCoefficient::DAY_TYPE_SATURDAY,
            'shift_type' => ShiftCoefficient::SHIFT_TYPE_EVENING,
            'coefficient' => 1.7,
            'effective_from' => $futureFrom->toDateString(),
            'effective_to' => $futureFrom->copy()->addMonth()->toDateString(),
        ])->assertCreated();

        $previous = ShiftCoefficient::findOrFail($first['id']);
        $this->assertNotNull($previous->effective_to);
        $this->assertTrue($previous->effective_to->lessThan($futureFrom));

        $this->postJson('/api/payroll/shift-coefficients', [
            'name' => 'Trùng ca tối thứ 7',
            'day_type' => ShiftCoefficient::DAY_TYPE_SATURDAY,
            'shift_type' => ShiftCoefficient::SHIFT_TYPE_EVENING,
            'coefficient' => 1.8,
            'effective_from' => $futureFrom->copy()->addDays(10)->toDateString(),
            'effective_to' => $futureFrom->copy()->addMonths(2)->toDateString(),
        ])->assertStatus(422);

        $this->postJson('/api/payroll/shift-coefficients', [
            'name' => 'Ca sáng thứ 7 hợp lệ',
            'day_type' => ShiftCoefficient::DAY_TYPE_SATURDAY,
            'shift_type' => ShiftCoefficient::SHIFT_TYPE_MORNING,
            'coefficient' => 1.1,
            'effective_from' => $futureFrom->copy()->addDays(10)->toDateString(),
        ])->assertCreated();
    }

    public function test_bulk_create_builds_full_matrix_and_rolls_back_invalid_cells(): void
    {
        Sanctum::actingAs($this->createUser('admin'));

        $from = Carbon::now()->toDateString();
        $items = [];

        foreach (ShiftCoefficient::DAY_TYPES as $dayType) {
            foreach (ShiftCoefficient::SHIFT_TYPES as $shiftType) {
                $items[] = [
                    'name' => "{$dayType} {$shiftType}",
                    'day_type' => $dayType,
                    'shift_type' => $shiftType,
                    'coefficient' => 1.1,
                    'effective_from' => $from,
                ];
            }
        }

        $this->postJson('/api/payroll/shift-coefficients/bulk', [
            'items' => $items,
        ])->assertCreated()
            ->assertJsonCount(16, 'data');

        $this->assertDatabaseCount('shift_coefficients', 16);

        ShiftCoefficient::truncate();

        $items[3]['coefficient'] = 2.5;

        $this->postJson('/api/payroll/shift-coefficients/bulk', [
            'items' => $items,
        ])->assertStatus(422);

        $this->assertDatabaseCount('shift_coefficients', 0);
    }

    public function test_accountant_can_manage_but_receptionist_cannot(): void
    {
        Sanctum::actingAs($this->createUser('ke_toan'));

        $this->postJson('/api/payroll/shift-coefficients', [
            'name' => 'Kế toán cấu hình',
            'day_type' => ShiftCoefficient::DAY_TYPE_WEEKDAY,
            'shift_type' => ShiftCoefficient::SHIFT_TYPE_MORNING,
            'coefficient' => 1.05,
            'effective_from' => Carbon::now()->toDateString(),
        ])->assertCreated();

        Sanctum::actingAs($this->createUser('le_tan'));

        $this->postJson('/api/payroll/shift-coefficients', [
            'name' => 'Lễ tân cấu hình',
            'day_type' => ShiftCoefficient::DAY_TYPE_WEEKDAY,
            'shift_type' => ShiftCoefficient::SHIFT_TYPE_AFTERNOON,
            'coefficient' => 1.2,
            'effective_from' => Carbon::now()->toDateString(),
        ])->assertForbidden();
    }

    public function test_stop_shift_coefficient_records_audit_log(): void
    {
        Sanctum::actingAs($this->createUser('admin'));

        $created = $this->postJson('/api/payroll/shift-coefficients', [
            'name' => 'Ngày lễ ca tùy chỉnh',
            'day_type' => ShiftCoefficient::DAY_TYPE_HOLIDAY,
            'shift_type' => ShiftCoefficient::SHIFT_TYPE_CUSTOM,
            'coefficient' => 2,
            'effective_from' => Carbon::now()->toDateString(),
        ])->assertCreated()->json();

        $this->postJson("/api/payroll/shift-coefficients/{$created['id']}/stop", [
            'reason' => 'policy_changed',
            'reason_detail' => 'Stop for test',
        ])->assertOk()
            ->assertJsonPath('status', ShiftCoefficient::STATUS_STOPPED);

        $this->getJson("/api/payroll/shift-coefficients/{$created['id']}/audit-logs")
            ->assertOk()
            ->assertJsonFragment(['action' => 'shift_coefficient.stopped']);
    }

    public function test_resolver_maps_dates_and_work_shift_templates(): void
    {
        $actor = $this->createUser('admin');
        $service = app(ShiftCoefficientService::class);

        $this->createCoefficient(ShiftCoefficient::DAY_TYPE_WEEKDAY, ShiftCoefficient::SHIFT_TYPE_MORNING, 1.1);
        $this->createCoefficient(ShiftCoefficient::DAY_TYPE_SATURDAY, ShiftCoefficient::SHIFT_TYPE_AFTERNOON, 1.2);
        $this->createCoefficient(ShiftCoefficient::DAY_TYPE_SUNDAY, ShiftCoefficient::SHIFT_TYPE_EVENING, 1.3);
        $this->createCoefficient(ShiftCoefficient::DAY_TYPE_WEEKDAY, ShiftCoefficient::SHIFT_TYPE_CUSTOM, 1.4);

        $this->assertSame(1.1, $service->resolveCoefficientValue('2026-06-05', ShiftCoefficient::SHIFT_TYPE_MORNING, $actor));
        $this->assertSame(1.2, $service->resolveCoefficientValue('2026-06-06', ShiftCoefficient::SHIFT_TYPE_AFTERNOON, $actor));
        $this->assertSame(1.3, $service->resolveCoefficientValue('2026-06-07', ShiftCoefficient::SHIFT_TYPE_EVENING, $actor));

        $staff = Staff::create([
            'employee_code' => 'UC16-STAFF-001',
            'full_name' => 'Nhân sự UC16',
            'email' => 'uc16-staff@example.com',
            'status' => 'working',
            'role_slug' => 'bac_si',
        ]);

        $schedule = WorkSchedule::create([
            'staff_id' => $staff->id,
            'work_date' => '2026-06-05',
            'shift_template_id' => null,
            'start_time' => '09:00:00',
            'end_time' => '12:00:00',
            'work_role' => 'doctor_treatment',
            'status' => WorkSchedule::STATUS_SCHEDULED,
        ]);

        $this->assertSame(1.4, $service->resolveCoefficientValueForSchedule($schedule, $actor));
    }

    public function test_resolver_falls_back_to_default_and_logs_warning(): void
    {
        $actor = $this->createUser('admin');

        $value = app(ShiftCoefficientService::class)
            ->resolveCoefficientValue('2026-06-05', ShiftCoefficient::SHIFT_TYPE_CUSTOM, $actor);

        $this->assertSame(1.0, $value);
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'shift_coefficient.default_used',
        ]);
    }

    private function createCoefficient(string $dayType, string $shiftType, float $coefficient): ShiftCoefficient
    {
        return ShiftCoefficient::create([
            'code' => 'SCF-'.strtoupper($dayType).'-'.strtoupper($shiftType),
            'name' => "{$dayType} {$shiftType}",
            'day_type' => $dayType,
            'shift_type' => $shiftType,
            'coefficient' => $coefficient,
            'effective_from' => Carbon::parse('2026-01-01', 'Asia/Ho_Chi_Minh')->startOfDay(),
            'status' => ShiftCoefficient::STATUS_ACTIVE,
        ]);
    }

    private function createUser(string $roleSlug): User
    {
        $user = User::factory()->create([
            'name' => $roleSlug.' user',
            'email' => $roleSlug.'-uc16@example.com',
            'username' => $roleSlug.'_uc16',
            'password' => Hash::make('Password@123'),
        ]);
        $user->roles()->attach(Role::where('slug', $roleSlug)->firstOrFail()->id);

        return $user;
    }
}
