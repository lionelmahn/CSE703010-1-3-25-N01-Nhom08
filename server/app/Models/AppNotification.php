<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * UC10 - Thong bao gui cho benh nhan (DR16-DR33).
 *
 * Khong dung ten bang "notifications" mac dinh cua Laravel de tranh xung
 * dot voi trait Notifiable + DatabaseChannel.
 */
class AppNotification extends Model
{
    use HasFactory;

    protected $table = 'app_notifications';

    // Notification type constants.
    public const TYPE_REQUEST_RECEIVED = 'request_received';
    public const TYPE_APPOINTMENT_CONFIRMATION = 'appointment_confirmation';
    public const TYPE_ALTERNATIVE_PROPOSED = 'alternative_proposed';
    public const TYPE_REQUEST_REJECTED = 'request_rejected';
    public const TYPE_APPOINTMENT_RESCHEDULED = 'appointment_rescheduled';
    public const TYPE_APPOINTMENT_CANCELLED = 'appointment_cancelled';
    public const TYPE_REMINDER_24H = 'reminder_24h';

    public const ALL_TYPES = [
        self::TYPE_REQUEST_RECEIVED,
        self::TYPE_APPOINTMENT_CONFIRMATION,
        self::TYPE_ALTERNATIVE_PROPOSED,
        self::TYPE_REQUEST_REJECTED,
        self::TYPE_APPOINTMENT_RESCHEDULED,
        self::TYPE_APPOINTMENT_CANCELLED,
        self::TYPE_REMINDER_24H,
    ];

    public const CHANNEL_EMAIL = 'email';

    public const ALL_CHANNELS = [self::CHANNEL_EMAIL];

    public const STATUS_PENDING = 'pending';
    public const STATUS_SENDING = 'sending';
    public const STATUS_SENT = 'sent';
    public const STATUS_FAILED = 'failed';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_RESENT = 'resent';

    public const ALL_STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_SENDING,
        self::STATUS_SENT,
        self::STATUS_FAILED,
        self::STATUS_CANCELLED,
        self::STATUS_RESENT,
    ];

    public const SOURCE_AUTO_EVENT = 'auto_event';
    public const SOURCE_AUTO_SCHEDULE = 'auto_schedule';
    public const SOURCE_MANUAL = 'manual';

    public const ALL_SOURCES = [
        self::SOURCE_AUTO_EVENT,
        self::SOURCE_AUTO_SCHEDULE,
        self::SOURCE_MANUAL,
    ];

    protected $fillable = [
        'code',
        'type',
        'channel',
        'status',
        'source',
        'online_booking_request_id',
        'appointment_id',
        'patient_id',
        'recipient_name',
        'recipient_email',
        'template_id',
        'template_code',
        'subject',
        'body_html',
        'body_text',
        'render_context',
        'scheduled_send_at',
        'sent_at',
        'sent_by_user_id',
        'error_code',
        'error_message',
        'retry_count',
        'manual_resend_count',
        'parent_notification_id',
        'dedup_key',
    ];

    protected $casts = [
        'render_context' => 'array',
        'scheduled_send_at' => 'datetime',
        'sent_at' => 'datetime',
        'retry_count' => 'integer',
        'manual_resend_count' => 'integer',
    ];

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function onlineBookingRequest(): BelongsTo
    {
        return $this->belongsTo(OnlineBookingRequest::class, 'online_booking_request_id');
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(AppNotificationTemplate::class, 'template_id');
    }

    public function sentByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sent_by_user_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_notification_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_notification_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(AppNotificationEvent::class, 'notification_id')
            ->orderBy('created_at');
    }

    public function scopeForAppointment(Builder $query, int $appointmentId): Builder
    {
        return $query->where('appointment_id', $appointmentId);
    }

    public function scopeForOnlineBookingRequest(Builder $query, int $requestId): Builder
    {
        return $query->where('online_booking_request_id', $requestId);
    }

    /**
     * Sinh ma NTF<YYYYMMDD>-<random> unique cho moi notification.
     */
    public static function generateCode(): string
    {
        for ($i = 0; $i < 5; $i++) {
            $candidate = 'NTF'.now()->format('Ymd').'-'.strtoupper(Str::random(5));
            if (! static::where('code', $candidate)->exists()) {
                return $candidate;
            }
        }

        // Fallback - extremely unlikely.
        return 'NTF'.now()->format('YmdHis').strtoupper(Str::random(3));
    }
}
