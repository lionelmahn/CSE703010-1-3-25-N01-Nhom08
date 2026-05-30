<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * UC13 - But toan dieu chinh hoa don sau khi chot.
 *
 * type=positive cong them vao invoice.total; type=negative giam tru.
 * Khong sua / xoa, chi insert.
 */
class InvoiceAdjustment extends Model
{
    use HasFactory;

    public const TYPE_POSITIVE = 'positive';

    public const TYPE_NEGATIVE = 'negative';

    public const ALL_TYPES = [
        self::TYPE_POSITIVE,
        self::TYPE_NEGATIVE,
    ];

    protected $fillable = [
        'invoice_id',
        'type',
        'amount',
        'reason',
        'note',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'float',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
