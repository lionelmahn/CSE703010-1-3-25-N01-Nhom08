<?php

namespace Tests\Feature;

use App\Models\BaseHourlyRate;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class HourlyRateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        $this->seed(PermissionSeeder::class);
    }

    public function test_admin_can_create_and_read_current_hourly_rate(): void
    {
        Sanctum::actingAs($this->createUser('admin'));

        $response = $this->postJson('/api/payroll/hourly-rates', [
            'hourly_rate' => 350000,
            'currency' => 'VND',
            'effective_from' => Carbon::now()->toDateString(),
            'note' => 'Initial hourly rate',
        ]);

        $response->assertCreated()
            ->assertJsonPath('status', BaseHourlyRate::STATUS_ACTIVE)
            ->assertJsonPath('currency', 'VND');

        $this->getJson('/api/payroll/hourly-rates/current')
            ->assertOk()
            ->assertJsonPath('data.hourly_rate', '350000.00');
    }

    public function test_validation_rejects_invalid_rate_and_date_range(): void
    {
        Sanctum::actingAs($this->createUser('admin'));

        $this->postJson('/api/payroll/hourly-rates', [
            'hourly_rate' => 0,
            'currency' => 'VND',
            'effective_from' => Carbon::now()->toDateString(),
        ])->assertStatus(422);

        $this->postJson('/api/payroll/hourly-rates', [
            'hourly_rate' => 350000,
            'currency' => 'VND',
            'effective_from' => Carbon::now()->addMonth()->toDateString(),
            'effective_to' => Carbon::now()->toDateString(),
        ])->assertStatus(422);
    }

    public function test_future_rate_caps_open_ended_predecessor_and_blocks_overlap(): void
    {
        Sanctum::actingAs($this->createUser('admin'));

        $first = $this->postJson('/api/payroll/hourly-rates', [
            'hourly_rate' => 300000,
            'currency' => 'VND',
            'effective_from' => Carbon::now()->subMonth()->toDateString(),
        ])->assertCreated()->json();

        $futureFrom = Carbon::now()->addMonth()->startOfDay();
        $this->postJson('/api/payroll/hourly-rates', [
            'hourly_rate' => 350000,
            'currency' => 'VND',
            'effective_from' => $futureFrom->toDateString(),
            'effective_to' => $futureFrom->copy()->addMonth()->toDateString(),
        ])->assertCreated();

        $previous = BaseHourlyRate::findOrFail($first['id']);
        $this->assertNotNull($previous->effective_to);
        $this->assertTrue($previous->effective_to->lessThan($futureFrom));

        $this->postJson('/api/payroll/hourly-rates', [
            'hourly_rate' => 360000,
            'currency' => 'VND',
            'effective_from' => $futureFrom->copy()->addDays(10)->toDateString(),
            'effective_to' => $futureFrom->copy()->addMonths(2)->toDateString(),
        ])->assertStatus(422);
    }

    public function test_future_rate_becomes_current_at_midnight_vietnam_time(): void
    {
        Sanctum::actingAs($this->createUser('admin'));

        Carbon::setTestNow(Carbon::parse('2026-06-04 23:59:59', 'Asia/Ho_Chi_Minh'));

        try {
            $first = $this->postJson('/api/payroll/hourly-rates', [
                'hourly_rate' => 300000,
                'currency' => 'VND',
                'effective_from' => '2026-06-01',
            ])->assertCreated()->json();

            $second = $this->postJson('/api/payroll/hourly-rates', [
                'hourly_rate' => 400000,
                'currency' => 'VND',
                'effective_from' => '2026-06-05',
            ])->assertCreated()
                ->assertJsonPath('status', BaseHourlyRate::STATUS_UPCOMING)
                ->json();

            $previous = BaseHourlyRate::findOrFail($first['id']);
            $this->assertSame('2026-06-04 23:59:59', $previous->effective_to->format('Y-m-d H:i:s'));

            $this->getJson('/api/payroll/hourly-rates/current')
                ->assertOk()
                ->assertJsonPath('data.id', $first['id'])
                ->assertJsonPath('data.status', BaseHourlyRate::STATUS_ACTIVE);

            Carbon::setTestNow(Carbon::parse('2026-06-05 00:00:00', 'Asia/Ho_Chi_Minh'));

            $this->getJson('/api/payroll/hourly-rates/current')
                ->assertOk()
                ->assertJsonPath('data.id', $second['id'])
                ->assertJsonPath('data.status', BaseHourlyRate::STATUS_ACTIVE);
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_accountant_can_manage_but_receptionist_cannot(): void
    {
        Sanctum::actingAs($this->createUser('ke_toan'));

        $this->postJson('/api/payroll/hourly-rates', [
            'hourly_rate' => 320000,
            'currency' => 'VND',
            'effective_from' => Carbon::now()->toDateString(),
        ])->assertCreated();

        Sanctum::actingAs($this->createUser('le_tan'));

        $this->postJson('/api/payroll/hourly-rates', [
            'hourly_rate' => 330000,
            'currency' => 'VND',
            'effective_from' => Carbon::now()->addMonth()->toDateString(),
        ])->assertForbidden();
    }

    public function test_stop_hourly_rate_records_audit_log(): void
    {
        Sanctum::actingAs($this->createUser('admin'));

        $created = $this->postJson('/api/payroll/hourly-rates', [
            'hourly_rate' => 350000,
            'currency' => 'VND',
            'effective_from' => Carbon::now()->toDateString(),
        ])->assertCreated()->json();

        $this->postJson("/api/payroll/hourly-rates/{$created['id']}/stop", [
            'reason' => 'policy_changed',
            'reason_detail' => 'Stop for test',
        ])->assertOk()
            ->assertJsonPath('status', BaseHourlyRate::STATUS_STOPPED);

        $this->getJson("/api/payroll/hourly-rates/{$created['id']}/audit-logs")
            ->assertOk()
            ->assertJsonFragment(['action' => 'hourly_rate.stopped']);
    }

    private function createUser(string $roleSlug): User
    {
        $user = User::factory()->create([
            'name' => $roleSlug.' user',
            'email' => $roleSlug.'-uc15@example.com',
            'username' => $roleSlug.'_uc15',
            'password' => Hash::make('Password@123'),
        ]);
        $user->roles()->attach(Role::where('slug', $roleSlug)->firstOrFail()->id);

        return $user;
    }
}
