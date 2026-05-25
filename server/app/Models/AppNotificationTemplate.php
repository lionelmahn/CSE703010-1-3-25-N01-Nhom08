<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * UC10 - Mau email he thong.
 *
 * Khong dung ten "notification_templates" de tranh nham lan voi cac package
 * Laravel khac va de gan voi domain "app_*" cua UC10.
 */
class AppNotificationTemplate extends Model
{
    use HasFactory;

    protected $table = 'app_notification_templates';

    protected $fillable = [
        'code',
        'type',
        'name',
        'subject',
        'body_html',
        'body_text',
        'required_vars',
        'is_active',
        'version',
        'updated_by',
    ];

    protected $casts = [
        'required_vars' => 'array',
        'is_active' => 'boolean',
        'version' => 'integer',
    ];

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
