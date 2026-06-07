<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfessionalProfileQualification extends Model
{
    protected $fillable = [
        'professional_profile_id',
        'qualification_catalog_id',
        'source',
    ];

    public function profile(): BelongsTo
    {
        return $this->belongsTo(ProfessionalProfile::class, 'professional_profile_id');
    }

    public function catalog(): BelongsTo
    {
        return $this->belongsTo(QualificationCatalog::class, 'qualification_catalog_id');
    }
}
