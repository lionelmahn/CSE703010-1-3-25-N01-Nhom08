<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * UC13 - Giao dich thanh toan / hoan tien.
 *
 * type:
 *  - payment: thu tien (cong vao amount_paid).
 *  - refund: hoan tien (tru ra khoi amount_paid).
 *
 * method: cash | bank_transfer | card. ref_code bat buoc khi method
 * khac cash (VR8) - enforce trong PaymentRequest.
 *
 * Khong xoa cung (VR11) - chi danh dau voided_at/voided_by/voided_reason.
 */
class PaymentTransaction extends Model
{
    use HasFactory;

    public const TYPE_PAYMENT = 'payment';

    public const TYPE_REFUND = 'refund';

    public const METHOD_CASH = 'cash';

    public const METHOD_BANK_TRANSFER = 'bank_transfer';

    public const METHOD_CARD = 'card';

    public const ALL_METHODS = [
        self::METHOD_CASH,
        self::METHOD_BANK_TRANSFER,
        self::METHOD_CARD,
    ];

    public const METHODS_REQUIRE_REF = [
        self::METHOD_BANK_TRANSFER,
        self::METHOD_CARD,
    ];

    protected $fillable = [
        'code',
        'invoice_id',
        'type',
        'method',
        'amount',
        'reference_code',
        'note',
        'paid_by',
        'paid_at',
        'account_info',
        'voided_at',
        'voided_by',
        'voided_reason',
    ];

    protected $casts = [
        'amount' => 'float',
        'paid_at' => 'datetime',
        'voided_at' => 'datetime',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function payer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'paid_by');
    }

    public function scopeActive(Builder $q): Builder
    {
        return $q->whereNull('voided_at');
    }

    public function scopePayments(Builder $q): Builder
    {
        return $q->where('type', self::TYPE_PAYMENT);
    }

    public function scopeRefunds(Builder $q): Builder
    {
        return $q->where('type', self::TYPE_REFUND);
    }

    /**
     * Sinh code PT-YYYY-XXXXXX. Goi trong transaction co lockForUpdate
     * o caller de tranh race.
     */
    public static function generateCode(?Carbon $now = null): string
    {
        $now = $now ?: Carbon::now();
        $year = $now->year;
        $prefix = "PT-{$year}-";
        $last = DB::table('payment_transactions')
            ->where('code', 'like', "{$prefix}%")
            ->orderByDesc('id')
            ->lockForUpdate()
            ->value('code');

        $next = 1;
        if ($last && preg_match('/PT-\d{4}-(\d+)$/', $last, $m)) {
            $next = ((int) $m[1]) + 1;
        }

        return $prefix.str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }
}
