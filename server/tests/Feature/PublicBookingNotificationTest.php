<?php

namespace Tests\Feature;

use App\Mail\NotificationMail;
use App\Models\AppNotification;
use App\Models\AppNotificationTemplate;
use App\Models\OnlineBookingRequest;
use Database\Seeders\NotificationTemplateSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PublicBookingNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(NotificationTemplateSeeder::class);
    }

    public function test_public_booking_sends_request_received_mail_immediately_without_queue_worker(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/public/online-bookings', $this->validPayload());

        $response->assertCreated()
            ->assertJsonPath('email_sent', true);

        $booking = OnlineBookingRequest::firstOrFail();
        $notification = AppNotification::where('online_booking_request_id', $booking->id)
            ->where('type', AppNotification::TYPE_REQUEST_RECEIVED)
            ->firstOrFail();

        $this->assertSame(AppNotification::STATUS_SENT, $notification->status);
        $this->assertNotNull($notification->sent_at);
        $this->assertSame('khach@example.com', $notification->recipient_email);
        $this->assertDatabaseCount('jobs', 0);

        Mail::assertSent(NotificationMail::class, function (NotificationMail $mail) {
            return str_contains($mail->renderedSubject, 'Da tiep nhan yeu cau dat lich');
        });
    }

    public function test_public_booking_keeps_booking_when_notification_render_validation_fails(): void
    {
        Mail::fake();

        AppNotificationTemplate::where('type', AppNotification::TYPE_REQUEST_RECEIVED)
            ->update(['required_vars' => ['recipient_name', 'request_code', 'missing_var']]);

        $response = $this->postJson('/api/public/online-bookings', $this->validPayload([
            'email' => 'loi-render@example.com',
        ]));

        $response->assertCreated()
            ->assertJsonPath('email_sent', false);

        $booking = OnlineBookingRequest::firstOrFail();
        $notification = AppNotification::where('online_booking_request_id', $booking->id)
            ->where('type', AppNotification::TYPE_REQUEST_RECEIVED)
            ->firstOrFail();

        $this->assertSame(AppNotification::STATUS_FAILED, $notification->status);
        $this->assertSame('MISSING_VARS', $notification->error_code);
        $this->assertStringContainsString('missing_var', $notification->error_message);
        $this->assertSame('loi-render@example.com', $booking->email);

        Mail::assertNothingSent();
    }

    /**
     * @param array<string,mixed> $overrides
     * @return array<string,mixed>
     */
    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Nguyen Van A',
            'phone' => '0901234567',
            'email' => 'khach@example.com',
            'need' => 'examination',
            'service_ids' => ['general-checkup'],
            'branch_id' => 'HN01',
            'preferred_date' => now()->addDays(3)->toDateString(),
            'preferred_time_slot' => '08-09',
            'customer_note' => 'Can tu van them',
            'accepted_terms' => true,
            'source' => 'landing_page',
        ], $overrides);
    }
}
