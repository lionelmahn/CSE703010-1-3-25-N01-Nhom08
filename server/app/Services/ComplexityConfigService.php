<?php

namespace App\Services;

use App\Models\ExaminationServiceItem;
use Illuminate\Support\Facades\Config;

/**
 * UC12 - Lookup he so phuc tap mac dinh theo dich vu + muc xu ly.
 *
 * Day la mock cho UC17 (UC17 chua co - se cau hinh he so theo dich vu trong
 * tuong lai). Khi UC17 ra mat, lop nay chi can sua method `coefficientFor`
 * de doc tu bang config DB thay vi file.
 *
 * He so su dung dang cong them (additive) 0..0.5 - theo xac nhan PO.
 */
class ComplexityConfigService
{
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
     * He so mac dinh theo dich vu + muc xu ly.
     *
     * Uu tien per-service override (config('dental.service_complexity_overrides'))
     * roi moi fallback ve mac dinh theo level.
     */
    public function coefficientFor(?int $serviceId, string $level): float
    {
        $overrides = Config::get('dental.service_complexity_overrides', []);
        if ($serviceId !== null && isset($overrides[$serviceId][$level])) {
            return $this->clamp((float) $overrides[$serviceId][$level]);
        }

        $defaults = Config::get('dental.default_complexity_by_level', []);

        return $this->clamp((float) ($defaults[$level] ?? 0.0));
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
