<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\AppointmentQueueEntry;
use App\Models\AppointmentStatusHistory;
use App\Models\Branch;
use App\Models\ExaminationServiceItem;
use App\Models\ExaminationSession;
use App\Models\Invoice;
use App\Models\Patient;
use App\Models\Role;
use App\Models\Service;
use App\Models\Staff;
use App\Models\User;
use App\Models\WorkSchedule;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * UC11 - Feature tests cho luong tiep nhan / check-in benh nhan.
 *
 * Cover:
 *  - SR1, SR2, SR3 - check-in tu 3 status hop le.
 *  - SR4 - cancel check-in restore status.
 *  - SR5 - mark no-show tu 3 status hop le.
 *  - SR6, SR7, SR8 - chan check-in khi `dang_kham`, `da_huy`, `khong_den`.
 *  - VR1, VR2, VR5, VR9, VR10, VR12, VR14.
 *  - Audit log (appointment_status_histories).
 *  - Queue entry (appointment_queue_entries) tao + cancel.
 *  - Permission: receptionist co `check_in`, khong co `cancel_check_in`.
 */
class CheckInTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->seed(PermissionSeeder::class);
    }

    public function test_receptionist_can_check_in_from_waiting_doctor_assignment(): void
    {
        Sanctum::actingAs($this->createReceptionist());

        $appointment = $this->createAppointment([
            'status' => Appointment::STATUS_WAITING_DOCTOR_ASSIGNMENT,
            'assigned_doctor_id' => null,
        ]);

        $response = $this->postJson("/api/appointments/{$appointment->id}/check-in", [
            'arrival_flag' => Appointment::ARRIVAL_ON_TIME,
            'note' => 'Den dung gio',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.status', Appointment::STATUS_CHECKED_IN)
            ->assertJsonPath('data.allowed_actions.check_in', false)
            ->assertJsonPath('data.allowed_actions.cancel_check_in', true)
            ->assertJsonPath('data.queue_entry.bucket', AppointmentQueueEntry::BUCKET_UNASSIGNED);

        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => Appointment::STATUS_CHECKED_IN,
            'pre_checkin_status' => Appointment::STATUS_WAITING_DOCTOR_ASSIGNMENT,
            'arrival_flag' => Appointment::ARRIVAL_ON_TIME,
        ]);
        $this->assertDatabaseHas('appointment_status_histories', [
            'appointment_id' => $appointment->id,
            'action' => AppointmentStatusHistory::ACTION_CHECKED_IN,
            'to_status' => Appointment::STATUS_CHECKED_IN,
        ]);
        $this->assertDatabaseHas('appointment_queue_entries', [
            'appointment_id' => $appointment->id,
            'bucket' => AppointmentQueueEntry::BUCKET_UNASSIGNED,
        ]);
    }

    public function test_check_in_with_assigned_doctor_routes_to_waiting_bucket(): void
    {
        Sanctum::actingAs($this->createReceptionist());

        $doctor = $this->createDoctor();
        $appointment = $this->createAppointment([
            'status' => Appointment::STATUS_DOCTOR_ASSIGNED,
            'assigned_doctor_id' => $doctor->id,
        ]);

        $response = $this->postJson("/api/appointments/{$appointment->id}/check-in", []);

        $response->assertOk()
            ->assertJsonPath('data.queue_entry.bucket', AppointmentQueueEntry::BUCKET_WAITING);
    }

    public function test_check_in_with_assigned_doctor_creates_waiting_examination_session(): void
    {
        Sanctum::actingAs($this->createReceptionist());

        $doctor = $this->createDoctor();
        $appointment = $this->createAppointment([
            'status' => Appointment::STATUS_DOCTOR_ASSIGNED,
            'assigned_doctor_id' => $doctor->id,
        ]);

        $this->postJson("/api/appointments/{$appointment->id}/check-in", [])->assertOk();

        $session = ExaminationSession::query()->where('appointment_id', $appointment->id)->firstOrFail();

        $this->assertSame(ExaminationSession::STATUS_CHO_KHAM, $session->status);
        $this->assertSame($appointment->patient_id, $session->patient_id);
        $this->assertSame($doctor->id, $session->doctor_id);
        $this->assertNotNull($session->queue_entry_id);
        $this->assertDatabaseHas('examination_histories', [
            'examination_id' => $session->id,
            'action' => 'created_from_checkin',
        ]);
    }

    public function test_check_in_does_not_create_duplicate_examination_session_when_one_exists(): void
    {
        Sanctum::actingAs($this->createReceptionist());

        $doctor = $this->createDoctor();
        $appointment = $this->createAppointment([
            'status' => Appointment::STATUS_DOCTOR_ASSIGNED,
            'assigned_doctor_id' => $doctor->id,
        ]);

        $existing = ExaminationSession::create([
            'code' => 'BA-'.now()->format('Y').'-000123',
            'patient_id' => $appointment->patient_id,
            'appointment_id' => $appointment->id,
            'doctor_id' => $doctor->id,
            'status' => ExaminationSession::STATUS_CHO_KHAM,
            'created_by' => $doctor->id,
            'updated_by' => $doctor->id,
        ]);

        $this->postJson("/api/appointments/{$appointment->id}/check-in", [])->assertOk();

        $this->assertSame(1, ExaminationSession::query()->where('appointment_id', $appointment->id)->count());
        $this->assertNotNull($existing->fresh()->queue_entry_id);
    }

    public function test_waiting_worklist_returns_checked_in_examination_session(): void
    {
        $doctor = $this->createDoctor();
        Sanctum::actingAs($this->createReceptionist());

        $appointment = $this->createAppointment([
            'status' => Appointment::STATUS_DOCTOR_ASSIGNED,
            'assigned_doctor_id' => $doctor->id,
        ]);
        $this->postJson("/api/appointments/{$appointment->id}/check-in", [])->assertOk();
        $session = ExaminationSession::query()->where('appointment_id', $appointment->id)->firstOrFail();

        Sanctum::actingAs($doctor);
        $response = $this->getJson('/api/medical-records/worklist?tab=waiting');

        $response->assertOk()
            ->assertJsonPath('counts.waiting', 1)
            ->assertJsonPath('data.0.id', $session->id)
            ->assertJsonPath('data.0.status', ExaminationSession::STATUS_CHO_KHAM);
    }

    public function test_start_examination_from_waiting_session_marks_appointment_and_queue_in_progress(): void
    {
        $doctor = $this->createDoctor();
        Sanctum::actingAs($this->createReceptionist());

        $appointment = $this->createAppointment([
            'status' => Appointment::STATUS_DOCTOR_ASSIGNED,
            'assigned_doctor_id' => $doctor->id,
        ]);
        $this->postJson("/api/appointments/{$appointment->id}/check-in", [])->assertOk();

        Sanctum::actingAs($doctor);
        $response = $this->postJson('/api/examinations/start', [
            'appointment_id' => $appointment->id,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', ExaminationSession::STATUS_DANG_KHAM);

        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => Appointment::STATUS_IN_PROGRESS,
        ]);
        $this->assertDatabaseHas('appointment_queue_entries', [
            'appointment_id' => $appointment->id,
            'bucket' => AppointmentQueueEntry::BUCKET_IN_PROGRESS,
        ]);
        $this->assertDatabaseHas('examination_histories', [
            'examination_id' => $response->json('data.id'),
            'action' => 'start',
        ]);
    }

    public function test_reassign_after_check_in_syncs_waiting_examination_doctor(): void
    {
        $doctor = $this->createDoctor();
        $newDoctor = $this->createDoctor();
        Sanctum::actingAs($this->createReceptionist());

        $appointment = $this->createAppointment([
            'status' => Appointment::STATUS_DOCTOR_ASSIGNED,
            'assigned_doctor_id' => $doctor->id,
        ]);
        $this->postJson("/api/appointments/{$appointment->id}/check-in", [])->assertOk();
        $session = ExaminationSession::query()->where('appointment_id', $appointment->id)->firstOrFail();

        Sanctum::actingAs($this->createAdmin());
        $this->postJson("/api/appointments/{$appointment->id}/reassign-doctor", [
            'doctor_id' => $newDoctor->id,
            'reason' => 'Doi bac si sau check-in',
        ])->assertOk();

        $this->assertSame($newDoctor->id, $session->fresh()->doctor_id);
    }

    public function test_complete_started_examination_creates_pending_invoice(): void
    {
        $doctor = $this->createDoctor();
        $branch = Branch::create([
            'code' => 'PK1-HN',
            'name' => 'Phong kham test',
            'status' => 'active',
        ]);
        Sanctum::actingAs($this->createReceptionist());

        $appointment = $this->createAppointment([
            'status' => Appointment::STATUS_DOCTOR_ASSIGNED,
            'assigned_doctor_id' => $doctor->id,
        ]);
        $this->postJson("/api/appointments/{$appointment->id}/check-in", [])->assertOk();

        Sanctum::actingAs($doctor);
        $startResponse = $this->postJson('/api/examinations/start', [
            'appointment_id' => $appointment->id,
        ])->assertCreated();

        $session = ExaminationSession::findOrFail($startResponse->json('data.id'));
        $session->forceFill([
            'chief_complaint' => 'Dau rang',
            'diagnosis' => 'Sau rang',
            'conclusion' => 'Can tram rang',
        ])->save();

        $service = $this->createService();
        ExaminationServiceItem::create([
            'examination_id' => $session->id,
            'service_id' => $service->id,
            'service_code_snapshot' => $service->service_code,
            'service_name_snapshot' => $service->name,
            'processing_level' => ExaminationServiceItem::LEVEL_THONG_THUONG,
            'complexity_coefficient' => 0,
            'unit_price_snapshot' => 250000,
            'quantity' => 1,
            'subtotal_snapshot' => 250000,
            'performed_by' => $doctor->id,
        ]);

        $this->postJson("/api/examinations/{$session->id}/complete", [
            'completion_note' => 'Da hoan tat',
        ])->assertOk()
            ->assertJsonPath('data.status', ExaminationSession::STATUS_CHO_THANH_TOAN);

        $invoice = Invoice::query()->where('examination_id', $session->id)->firstOrFail();
        $this->assertSame(Invoice::STATUS_PENDING, $invoice->status);
        $this->assertSame($branch->id, $invoice->branch_id);
        $this->assertSame(250000.0, (float) $invoice->total);

        Sanctum::actingAs($this->createAdmin());
        $this->getJson("/api/billing/queue?tab=pending&examinationId={$session->id}")
            ->assertOk()
            ->assertJsonPath('data.0.id', $invoice->id);
    }

    public function test_check_in_rejected_when_status_already_checked_in(): void
    {
        Sanctum::actingAs($this->createReceptionist());

        $appointment = $this->createAppointment([
            'status' => Appointment::STATUS_CHECKED_IN,
        ]);

        $response = $this->postJson("/api/appointments/{$appointment->id}/check-in", []);

        $response->assertStatus(422);
    }

    public function test_check_in_rejected_when_status_cancelled_or_no_show_or_completed(): void
    {
        Sanctum::actingAs($this->createReceptionist());

        foreach ([
            Appointment::STATUS_CANCELLED,
            Appointment::STATUS_NO_SHOW,
            Appointment::STATUS_COMPLETED,
            Appointment::STATUS_IN_PROGRESS,
        ] as $status) {
            $appointment = $this->createAppointment(['status' => $status]);
            $response = $this->postJson("/api/appointments/{$appointment->id}/check-in", []);
            $response->assertStatus(422, "Expected 422 for status=$status");
        }
    }

    public function test_check_in_rejected_when_patient_is_inactive(): void
    {
        Sanctum::actingAs($this->createReceptionist());

        $patient = $this->createPatient(['status' => Patient::STATUS_INACTIVE]);
        $appointment = $this->createAppointment([
            'patient_id' => $patient->id,
            'status' => Appointment::STATUS_DOCTOR_ASSIGNED,
            'assigned_doctor_id' => $this->createDoctor()->id,
        ]);

        $response = $this->postJson("/api/appointments/{$appointment->id}/check-in", []);
        $response->assertStatus(422);
    }

    public function test_receptionist_cannot_cancel_check_in_by_default(): void
    {
        Sanctum::actingAs($this->createReceptionist());
        $appointment = $this->checkedInAppointment();

        $response = $this->postJson("/api/appointments/{$appointment->id}/cancel-check-in", [
            'reason' => 'Sai thong tin',
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_cancel_check_in_and_restore_status(): void
    {
        $admin = $this->createAdmin();
        Sanctum::actingAs($admin);

        // Tao lich + check-in qua API de co queue entry that.
        $appointment = $this->createAppointment([
            'status' => Appointment::STATUS_DOCTOR_ASSIGNED,
            'assigned_doctor_id' => $this->createDoctor()->id,
        ]);
        $this->postJson("/api/appointments/{$appointment->id}/check-in", [])->assertOk();

        $response = $this->postJson("/api/appointments/{$appointment->id}/cancel-check-in", [
            'reason' => 'Check-in nham benh nhan',
            'note' => 'Test reset',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.status', Appointment::STATUS_DOCTOR_ASSIGNED);

        $this->assertDatabaseHas('appointment_status_histories', [
            'appointment_id' => $appointment->id,
            'action' => AppointmentStatusHistory::ACTION_CHECK_IN_CANCELLED,
            'to_status' => Appointment::STATUS_DOCTOR_ASSIGNED,
        ]);
        $this->assertDatabaseHas('appointment_queue_entries', [
            'appointment_id' => $appointment->id,
            'bucket' => AppointmentQueueEntry::BUCKET_CANCELLED,
        ]);
    }

    public function test_cancel_check_in_requires_reason(): void
    {
        Sanctum::actingAs($this->createAdmin());
        $appointment = $this->checkedInAppointment();

        $response = $this->postJson("/api/appointments/{$appointment->id}/cancel-check-in", [
            'reason' => '',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['reason']);
    }

    public function test_cancel_check_in_rejected_when_status_is_in_progress(): void
    {
        Sanctum::actingAs($this->createAdmin());

        $appointment = $this->createAppointment(['status' => Appointment::STATUS_IN_PROGRESS]);

        $response = $this->postJson("/api/appointments/{$appointment->id}/cancel-check-in", [
            'reason' => 'Da bat dau kham',
        ]);

        $response->assertStatus(422);
    }

    public function test_mark_no_show_succeeds_and_cancels_queue(): void
    {
        Sanctum::actingAs($this->createReceptionist());

        $appointment = $this->createAppointment(['status' => Appointment::STATUS_DOCTOR_ASSIGNED]);

        $response = $this->postJson("/api/appointments/{$appointment->id}/no-show", [
            'reason' => 'Khong lien lac duoc',
            'note' => 'Goi 3 lan khong nhac may',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.status', Appointment::STATUS_NO_SHOW);
        $this->assertDatabaseHas('appointment_status_histories', [
            'appointment_id' => $appointment->id,
            'action' => AppointmentStatusHistory::ACTION_NO_SHOW,
        ]);
    }

    public function test_mark_no_show_rejected_when_already_checked_in(): void
    {
        Sanctum::actingAs($this->createReceptionist());

        $appointment = $this->checkedInAppointment();

        $response = $this->postJson("/api/appointments/{$appointment->id}/no-show", [
            'reason' => 'Sai',
        ]);

        $response->assertStatus(422);
    }

    public function test_mark_no_show_requires_reason(): void
    {
        Sanctum::actingAs($this->createReceptionist());

        $appointment = $this->createAppointment(['status' => Appointment::STATUS_DOCTOR_ASSIGNED]);

        $response = $this->postJson("/api/appointments/{$appointment->id}/no-show", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['reason']);
    }

    public function test_today_appointments_filters_by_branch_and_arrival_filter(): void
    {
        Sanctum::actingAs($this->createReceptionist());

        $this->createAppointment([
            'branch_id' => 'PK1-HN',
            'status' => Appointment::STATUS_DOCTOR_ASSIGNED,
        ]);
        $this->createAppointment([
            'branch_id' => 'PK2-HCM',
            'status' => Appointment::STATUS_CHECKED_IN,
            'checked_in_at' => now(),
        ]);

        $response = $this->getJson('/api/reception/today-appointments?branch_id=PK1-HN');
        $response->assertOk()
            ->assertJsonCount(1, 'data');

        $response2 = $this->getJson('/api/reception/today-appointments?arrival_filter=checked_in');
        $response2->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_queue_endpoint_returns_buckets_after_check_in(): void
    {
        Sanctum::actingAs($this->createReceptionist());

        $appointment = $this->createAppointment([
            'status' => Appointment::STATUS_DOCTOR_ASSIGNED,
            'assigned_doctor_id' => $this->createDoctor()->id,
        ]);
        $this->postJson("/api/appointments/{$appointment->id}/check-in", [])->assertOk();

        $response = $this->getJson('/api/reception/queue');
        $response->assertOk()
            ->assertJsonStructure([
                'buckets' => ['unassigned', 'waiting', 'ready', 'in_progress'],
                'summary' => ['total_active', 'unassigned', 'waiting', 'ready', 'in_progress'],
                'avg_wait_min',
            ]);
        $this->assertSame(1, $response->json('summary.waiting'));
    }

    public function test_queue_stats_returns_kpi_and_alerts(): void
    {
        Sanctum::actingAs($this->createReceptionist());

        $response = $this->getJson('/api/reception/queue-stats');
        $response->assertOk()
            ->assertJsonStructure([
                'kpi' => ['total_checked_in', 'in_progress', 'completed', 'no_show'],
                'overdue',
                'alerts',
            ]);
    }

    public function test_unauthenticated_request_returns_401(): void
    {
        $response = $this->postJson('/api/appointments/1/check-in', []);
        $response->assertStatus(401);
    }

    public function test_appointment_transform_exposes_check_in_allowed_actions_on_uc7_endpoint(): void
    {
        Sanctum::actingAs($this->createReceptionist());

        $appointment = $this->createAppointment(['status' => Appointment::STATUS_DOCTOR_ASSIGNED]);

        $response = $this->getJson("/api/appointments/{$appointment->id}");

        $response->assertOk()
            ->assertJsonPath('data.allowed_actions.check_in', true)
            ->assertJsonPath('data.allowed_actions.cancel_check_in', false)
            ->assertJsonPath('data.allowed_actions.no_show', true);
    }

    // Helpers ----------------------------------------------------------

    private function checkedInAppointment(string $preStatus = Appointment::STATUS_DOCTOR_ASSIGNED): Appointment
    {
        return $this->createAppointment([
            'status' => Appointment::STATUS_CHECKED_IN,
            'pre_checkin_status' => $preStatus,
            'checked_in_at' => now(),
            'checked_in_by' => $this->createAdmin()->id,
            'arrival_flag' => Appointment::ARRIVAL_ON_TIME,
        ]);
    }

    private function createAppointment(array $overrides = []): Appointment
    {
        $patient = $overrides['patient_id'] ?? null;
        if (! $patient) {
            $patient = $this->createPatient()->id;
        }

        return Appointment::create(array_merge([
            'code' => 'APT'.now()->format('Y').str_pad((string) random_int(1, 999999), 6, '0', STR_PAD_LEFT),
            'patient_id' => $patient,
            'appointment_date' => now()->toDateString(),
            'time_slot' => '09-10',
            'source' => Appointment::SOURCE_WALK_IN,
            'branch_id' => 'PK1-HN',
            'status' => Appointment::STATUS_WAITING_DOCTOR_ASSIGNMENT,
        ], $overrides));
    }

    private function createPatient(array $overrides = []): Patient
    {
        return Patient::create(array_merge([
            'patient_code' => 'BN'.now()->format('YmdHis').random_int(100, 999),
            'full_name' => 'Benh Nhan '.uniqid(),
            'phone' => '09'.random_int(10000000, 99999999),
            'gender' => 'female',
            'status' => Patient::STATUS_ACTIVE,
            'is_active' => true,
        ], $overrides));
    }

    private function createService(array $overrides = []): Service
    {
        return Service::create(array_merge([
            'service_code' => 'SV'.random_int(100000, 999999),
            'name' => 'Dich vu test '.uniqid(),
            'price' => 250000,
            'commission_rate' => 10,
            'duration_minutes' => 30,
            'status' => Service::STATUS_ACTIVE,
            'visibility' => Service::VISIBILITY_INTERNAL,
        ], $overrides));
    }

    private function createReceptionist(): User
    {
        $user = User::factory()->create([
            'name' => 'Le Tan Test '.uniqid(),
            'email' => 'le.tan.'.uniqid().'@test.local',
            'username' => 'le_tan_'.uniqid(),
            'password' => Hash::make('Password@123'),
        ]);
        $user->roles()->attach(Role::where('slug', 'le_tan')->firstOrFail()->id);

        return $user;
    }

    private function createAdmin(): User
    {
        $user = User::factory()->create([
            'name' => 'Admin Test '.uniqid(),
            'email' => 'admin.'.uniqid().'@test.local',
            'username' => 'admin_'.uniqid(),
            'password' => Hash::make('Password@123'),
        ]);
        $user->roles()->attach(Role::where('slug', 'admin')->firstOrFail()->id);

        return $user;
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

        $staff = Staff::create([
            'employee_code' => 'BS'.random_int(100000, 999999),
            'full_name' => $user->name,
            'phone' => '08'.random_int(10000000, 99999999),
            'email' => $user->email,
            'status' => 'working',
            'role_slug' => 'bac_si',
            'user_id' => $user->id,
        ]);

        WorkSchedule::create([
            'staff_id' => $staff->id,
            'work_date' => now()->toDateString(),
            'start_time' => '08:00:00',
            'end_time' => '18:00:00',
            'work_role' => 'doctor_treatment',
            'status' => WorkSchedule::STATUS_CONFIRMED,
        ]);

        return $user;
    }
}
