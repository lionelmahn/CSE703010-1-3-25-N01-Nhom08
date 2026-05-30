<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * UC13 - Dong dich vu trong hoa don. Snapshot tu
 * `examination_service_items` luc tao invoice.
 *
 * Khong cho phep edit truc tiep - moi sua deu phai qua "invoice_adjustments"
 * hoac qua chu trinh huy + tao moi.
 */
class InvoiceItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'examination_service_item_id',
        'service_id',
        'service_code_snapshot',
        'service_name_snapshot',
        'tooth_codes',
        'processing_level',
        'complexity_coefficient',
        'unit_price_snapshot',
        'quantity',
        'line_total',
    ];

    protected $casts = [
        'tooth_codes' => 'array',
        'complexity_coefficient' => 'float',
        'unit_price_snapshot' => 'float',
        'line_total' => 'float',
        'quantity' => 'integer',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function examinationServiceItem(): BelongsTo
    {
        return $this->belongsTo(ExaminationServiceItem::class, 'examination_service_item_id');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}
