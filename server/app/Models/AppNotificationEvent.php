<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * UC10 - Lich su gui/retry/cancel cho 1 notification.
 */
class AppNotificationEvent extends Model
{
    use HasFactory;

    protected $table = 'app_notification_events';

    public $timestamps = false;

    public const EVENT_QUEUED = 'queued';
    public const EVENT_SCHEDULED = 'scheduled';
    public const EVENT_SENDING = 'sending';
    public const EVENT_SENT = 'sent';
    public const EVENT_FAILED = 'failed';
    public const EVENT_CANCELLED = 'cancelled';
    public const EVENT_RESEND_REQUESTED = 'resend_requested';
    public const EVENT_RETRY = 'retry';
    public const EVENT_RESCHEDULED = 'rescheduled';

    protected $fillable = [
        'notification_id',
        'event',
        'actor_id',
        'actor_name',
        'error_code',
        'error_message',
        'metadata',
        'created_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    public function notification(): BelongsTo
    {
        return $this->belongsTo(AppNotification::class, 'notification_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
