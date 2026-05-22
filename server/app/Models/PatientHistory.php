<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * UC5 - Mot ban ghi lich su thay doi tren ho so benh nhan.
 */
class PatientHistory extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'patient_id',
        'action',
        'actor_id',
        'actor_name',
        'note',
        'before',
        'after',
        'metadata',
        'created_at',
    ];

    protected $casts = [
        'before' => 'array',
        'after' => 'array',
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
