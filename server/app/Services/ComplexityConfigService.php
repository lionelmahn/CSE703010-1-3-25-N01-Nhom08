<?php

namespace App\Services;

use App\Models\ExaminationServiceItem;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Config;

/**
 * UC12 - Lookup he so phuc tap mac dinh theo dich vu + muc xu ly.
 *
 * He so su dung dang cong them (additive) 0..0.5 - theo xac nhan PO.
 */
class ComplexityConfigService
{
    public function __construct(private readonly ServiceComplexityService $serviceComplexities)
    {
    }

    /**
     * Tra ve mang [level => label].
     *
     * @return array<string,string>
     */
    public function processingLevels(): array
    {
        return Config::get('dental.processing_levels', []);
    }

    /**
     * Cac muc he so cong them duoc phep nhap (AC9 + AC10).
     *
     * @return list<float>
     */
    public function allowedCoefficients(): array
    {
        return array_map('floatval', Config::get('dental.allowed_complexity_coefficients', [0.0, 0.1, 0.2, 0.3, 0.4, 0.5]));
    }

    /**
     * He so theo dich vu + muc xu ly. UC17 la nguon su that; neu thieu
     * cau hinh thi fallback ve 0 de UC12 khong nhan he so tu client.
     */
    public function coefficientFor(
        ?int $serviceId,
        string $level,
        ?User $actor = null,
        bool $logDefault = false,
        CarbonInterface|string|null $date = null
    ): float
    {
        return $this->snapshotFor($serviceId, $level, $actor, $logDefault, $date)['coefficient'];
    }

    /**
     * @return array{coefficient:float,config_id:int|null,is_default:bool}
     */
    public function snapshotFor(
        ?int $serviceId,
        string $level,
        ?User $actor = null,
        bool $logDefault = true,
        CarbonInterface|string|null $date = null
    ): array {
        $snapshot = $this->serviceComplexities->snapshotFor($serviceId, $level, $actor, $logDefault, $date);
        $snapshot['coefficient'] = $this->clamp((float) $snapshot['coefficient']);

        return $snapshot;
    }

    /**
     * Snap he so client gui ve gia tri hop le gan nhat. He so 0..0.5
     * step 0.1. Cac gia tri ngoai khoang se bi clamp ve [0, 0.5].
     */
    public function snapCoefficient(float $value): float
    {
        $allowed = $this->allowedCoefficients();
        $clamped = $this->clamp($value);
        $best = $allowed[0];
        $bestDiff = abs($clamped - $allowed[0]);
        foreach ($allowed as $candidate) {
            $diff = abs($clamped - $candidate);
            if ($diff < $bestDiff) {
                $best = $candidate;
                $bestDiff = $diff;
            }
        }

        return $best;
    }

    /**
     * UC payroll chua co - tra ve flag mock tu config.
     *
     * Khi UC15 (kỳ luong) duoc trien khai, hoi service do thay vi config.
     */
    public function isPayrollPeriodLocked(): bool
    {
        return (bool) Config::get('dental.is_payroll_period_locked', false);
    }

    /**
     * Gioi han so dong dich vu trong 1 phien (xac nhan PO).
     */
    public function maxServiceItemsPerExamination(): int
    {
        return (int) Config::get('dental.max_service_items_per_examination', 50);
    }

    /**
     * Helper - validate ve enum.
     */
    public function isValidLevel(string $level): bool
    {
        return in_array($level, ExaminationServiceItem::ALL_LEVELS, true);
    }

    private function clamp(float $value): float
    {
        return max(0.0, min(0.5, round($value, 2)));
    }
}
