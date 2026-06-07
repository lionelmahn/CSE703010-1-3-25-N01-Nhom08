<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class QualificationCatalog extends Model
{
    public const TYPE_DEGREE = 'degree';
    public const TYPE_ACADEMIC_TITLE = 'academic_title';

    public const STATUS_ACTIVE = 'active';
    public const STATUS_INACTIVE = 'inactive';

    public const TYPES = [
        self::TYPE_DEGREE,
        self::TYPE_ACADEMIC_TITLE,
    ];

    public const STATUSES = [
        self::STATUS_ACTIVE,
        self::STATUS_INACTIVE,
    ];

    private const DEFAULT_COEFFICIENTS = [
        'giao_su' => 2.5,
        'pho_giao_su' => 2.0,
        'tien_si' => 1.7,
        'thac_si' => 1.5,
        'dai_hoc' => 1.3,
    ];

    protected $fillable = [
        'code',
        'name',
        'type',
        'priority',
        'status',
        'description',
    ];

    protected $casts = [
        'priority' => 'integer',
    ];

    public function professionalProfiles(): BelongsToMany
    {
        return $this->belongsToMany(
            ProfessionalProfile::class,
            'professional_profile_qualifications',
            'qualification_catalog_id',
            'professional_profile_id'
        )->withPivot(['source'])->withTimestamps();
    }

    /**
     * @return array<int,array<string,mixed>>
     */
    public static function defaultRows(): array
    {
        return [
            [
                'code' => 'giao_su',
                'name' => 'Giáo sư',
                'type' => self::TYPE_ACADEMIC_TITLE,
                'priority' => 1,
                'status' => self::STATUS_ACTIVE,
                'description' => 'Học hàm Giáo sư.',
            ],
            [
                'code' => 'pho_giao_su',
                'name' => 'Phó giáo sư',
                'type' => self::TYPE_ACADEMIC_TITLE,
                'priority' => 2,
                'status' => self::STATUS_ACTIVE,
                'description' => 'Học hàm Phó giáo sư.',
            ],
            [
                'code' => 'tien_si',
                'name' => 'Tiến sĩ',
                'type' => self::TYPE_DEGREE,
                'priority' => 3,
                'status' => self::STATUS_ACTIVE,
                'description' => 'Học vị Tiến sĩ.',
            ],
            [
                'code' => 'thac_si',
                'name' => 'Thạc sĩ',
                'type' => self::TYPE_DEGREE,
                'priority' => 4,
                'status' => self::STATUS_ACTIVE,
                'description' => 'Học vị Thạc sĩ.',
            ],
            [
                'code' => 'dai_hoc',
                'name' => 'Đại học',
                'type' => self::TYPE_DEGREE,
                'priority' => 5,
                'status' => self::STATUS_ACTIVE,
                'description' => 'Trình độ đại học hoặc bác sĩ/cử nhân tương đương.',
            ],
        ];
    }

    /**
     * @return array<int,string>
     */
    public static function defaultCodes(): array
    {
        return array_column(self::defaultRows(), 'code');
    }

    /**
     * @return array<string,mixed>
     */
    public function toPayrollOption(): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'type' => $this->type,
            'priority' => $this->priority,
            'status' => $this->status,
            'description' => $this->description,
            'default_coefficient' => self::DEFAULT_COEFFICIENTS[$this->code] ?? 1.0,
        ];
    }

    public static function normalizeLegacyCode(?string $value): ?string
    {
        $value = trim((string) $value);
        if ($value === '') {
            return null;
        }

        if (self::query()->where('code', $value)->where('status', self::STATUS_ACTIVE)->exists()) {
            return $value;
        }

        $slug = Str::slug($value, '_');
        $alias = match ($slug) {
            'giao_su', 'gs', 'gs_ts', 'gsts', 'giao_su_tien_si' => 'giao_su',
            'pho_giao_su', 'pgs', 'pgs_ts', 'pgsts', 'pho_giao_su_tien_si' => 'pho_giao_su',
            'tien_si', 'ts', 'bac_si_tien_si' => 'tien_si',
            'thac_si', 'ths', 'thac_sy', 'thac_si_bac_si' => 'thac_si',
            'dai_hoc', 'cu_nhan', 'bac_si', 'bac_sy', 'bs' => 'dai_hoc',
            default => null,
        };

        if ($alias) {
            return $alias;
        }

        $match = self::query()
            ->where('status', self::STATUS_ACTIVE)
            ->get(['code', 'name'])
            ->first(fn (self $catalog) => $slug === Str::slug($catalog->name, '_'));

        return $match?->code;
    }
}
