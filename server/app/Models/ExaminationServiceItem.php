<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * UC12 - Mot dong dich vu chi dinh trong phien kham.
 *
 * Khong cho phep edit khi `is_paid=true` (VR8) hoac phien `da_khoa`.
 */
class ExaminationServiceItem extends Model
{
    use HasFactory;

    public const LEVEL_THONG_THUONG = 'thong_thuong';

    public const LEVEL_KHO = 'kho';

    public const LEVEL_PHUC_TAP = 'phuc_tap';

    public const LEVEL_RAT_PHUC_TAP = 'rat_phuc_tap';

    public const ALL_LEVELS = [
        self::LEVEL_THONG_THUONG,
        self::LEVEL_KHO,
        self::LEVEL_PHUC_TAP,
        self::LEVEL_RAT_PHUC_TAP,
    ];

    public const LEVEL_LABELS = [
        self::LEVEL_THONG_THUONG => 'Thong thuong',
        self::LEVEL_KHO => 'Kho',
        self::LEVEL_PHUC_TAP => 'Phuc tap',
        self::LEVEL_RAT_PHUC_TAP => 'Rat phuc tap',
    ];

    /**
     * AC9 - he so cong them hop le.
     */
    public const ALLOWED_COEFFICIENTS = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5];

    protected $fillable = [
        'examination_id',
        'service_id',
        'service_code_snapshot',
        'service_name_snapshot',
        'tooth_codes',
        'processing_level',
        'complexity_coefficient',
        'service_complexity_coefficient_id',
        'complexity_reason',
        'unit_price_snapshot',
        'quantity',
        'subtotal_snapshot',
        'performed_by',
        'is_paid',
    ];

    protected $casts = [
        'tooth_codes' => 'array',
        'complexity_coefficient' => 'float',
        'unit_price_snapshot' => 'float',
        'subtotal_snapshot' => 'float',
        'quantity' => 'integer',
        'is_paid' => 'boolean',
    ];

    public function examination(): BelongsTo
    {
        return $this->belongsTo(ExaminationSession::class, 'examination_id');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function performer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    public function serviceComplexityCoefficient(): BelongsTo
    {
        return $this->belongsTo(ServiceComplexityCoefficient::class, 'service_complexity_coefficient_id');
    }

    public static function recalcSubtotal(float $unitPrice, int $quantity, float $coefficient): float
    {
        return round($unitPrice * max(1, $quantity) * (1 + max(0, $coefficient)), 2);
    }
}
