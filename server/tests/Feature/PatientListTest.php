<?php

namespace Tests\Feature;

use App\Models\Patient;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * UC5 - Regression test cho GET /api/patients.
 *
 * Bug goc: PatientService::listPatients() truy cap $filters['sort_by'] truc tiep
 * trong nhanh truthy cua ternary -> "Undefined array key sort_by" khi FE
 * khong gui sort_by/sort_dir (FE hien tai khong gui).
 *
 * Cac case test:
 * - Khong query param: phai 200 + meta paginated hop le.
 * - sort_by hop le: nhan whitelist.
 * - sort_by/sort_dir khong hop le: fallback ve default.
 * - q rong: khong loi.
 */
class PatientListTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->seed(PermissionSeeder::class);
    }

    public function test_index_without_query_params_does_not_crash(): void
    {
        Sanctum::actingAs($this->createAdmin());
        $this->seedPatients();

        $response = $this->getJson('/api/patients');

        $response->assertOk()
            ->assertJsonStructure([
                'data',
                'meta' => ['current_page', 'per_page', 'total', 'last_page'],
            ]);

        $this->assertSame(15, $response->json('meta.per_page'));
        $this->assertSame(3, $response->json('meta.total'));
    }

    public function test_index_with_valid_sort_by_and_dir(): void
    {
        Sanctum::actingAs($this->createAdmin());
        $this->seedPatients();

        $response = $this->getJson('/api/patients?sort_by=full_name&sort_dir=asc');

        $response->assertOk();
        $names = array_column($response->json('data'), 'full_name');
        $sorted = $names;
        sort($sorted);
        $this->assertSame($sorted, $names);
    }

    public function test_index_with_invalid_sort_by_falls_back_to_default(): void
    {
        Sanctum::actingAs($this->createAdmin());
        $this->seedPatients();

        // Khong duoc crash, khong duoc reflect sort_by injection.
        $response = $this->getJson('/api/patients?sort_by=password&sort_dir=garbage');

        $response->assertOk()
            ->assertJsonStructure([
                'data',
                'meta' => ['current_page', 'per_page', 'total', 'last_page'],
            ]);
    }

    public function test_index_with_empty_q_does_not_crash(): void
    {
        Sanctum::actingAs($this->createAdmin());
        $this->seedPatients();

        $response = $this->getJson('/api/patients?q=&status=all&source=all&gender=all');

        $response->assertOk();
        $this->assertSame(3, $response->json('meta.total'));
    }

    public function test_index_with_custom_per_page_and_page(): void
    {
        Sanctum::actingAs($this->createAdmin());
        $this->seedPatients();

        $response = $this->getJson('/api/patients?per_page=2&page=2');

        $response->assertOk();
        $this->assertSame(2, $response->json('meta.per_page'));
        $this->assertSame(2, $response->json('meta.current_page'));
    }

    public function test_index_search_by_q(): void
    {
        Sanctum::actingAs($this->createAdmin());
        $this->seedPatients();

        $response = $this->getJson('/api/patients?q=Nguyen');

        $response->assertOk();
        $this->assertGreaterThanOrEqual(1, $response->json('meta.total'));
    }

    private function createAdmin(): User
    {
        $user = User::factory()->create([
            'name' => 'Admin Test',
            'email' => 'admin-patients@example.com',
            'username' => 'admin_patients',
            'password' => Hash::make('Password@123'),
        ]);
        $user->roles()->attach(Role::where('slug', 'admin')->firstOrFail()->id);

        return $user;
    }

    private function seedPatients(): void
    {
        $base = [
            'status' => Patient::STATUS_ACTIVE,
            'is_active' => true,
            'source' => 'Website',
        ];

        Patient::create(array_merge($base, [
            'patient_code' => 'BN999990001',
            'full_name' => 'Nguyen Van A',
            'phone' => '0900000001',
            'email' => 'a@example.com',
        ]));
        Patient::create(array_merge($base, [
            'patient_code' => 'BN999990002',
            'full_name' => 'Tran Thi B',
            'phone' => '0900000002',
            'email' => 'b@example.com',
        ]));
        Patient::create(array_merge($base, [
            'patient_code' => 'BN999990003',
            'full_name' => 'Le Van C',
            'phone' => '0900000003',
            'email' => 'c@example.com',
        ]));
    }
}
