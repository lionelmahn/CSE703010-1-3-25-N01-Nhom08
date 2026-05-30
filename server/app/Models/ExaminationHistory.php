<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * UC12 - Audit log noi bo phien kham. Khong sua / xoa. Khong dung
 * `updated_at`.
 */
class ExaminationHistory extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'examination_id',
        'action',
        'actor_id',
        'actor_name',
        'before',
        'after',
        'reason',
        'created_at',
    ];

    protected $casts = [
        'before' => 'array',
        'after' => 'array',
        'created_at' => 'datetime',
    ];

    public function examination(): BelongsTo
    {
        return $this->belongsTo(ExaminationSession::class, 'examination_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
