<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExaminationToothChart extends Model
{
    use HasFactory;

    protected $table = 'examination_tooth_chart';

    protected $fillable = [
        'examination_id',
        'tooth_fdi',
        'tooth_status_id',
        'note',
    ];

    public function examination(): BelongsTo
    {
        return $this->belongsTo(ExaminationSession::class, 'examination_id');
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(ToothStatus::class, 'tooth_status_id');
    }

    /**
     * Danh sach FDI (32 rang vinh vien) hop le.
     *
     * @return list<string>
     */
    public static function validFdiCodes(): array
    {
        $codes = [];
        foreach ([1, 2, 3, 4] as $quadrant) {
            foreach (range(1, 8) as $position) {
                $codes[] = (string) ($quadrant * 10 + $position);
            }
        }

        return $codes;
    }
}
