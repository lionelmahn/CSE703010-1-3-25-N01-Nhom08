<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Lich su xu ly tung yeu cau (BR-08, AC17, DR15/DR16).
 *
 * Mot row = mot hanh dong (tao moi, tiep nhan, xac nhan, de xuat, tu choi,
 * gui email, ghi chu noi bo...). FE ren timeline tu day.
 */
class OnlineBookingRequestHistory extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'request_id',
        'action',
        'actor_id',
        'actor_name',
        'note',
        'metadata',
        'created_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    public function request()
    {
        return $this->belongsTo(OnlineBookingRequest::class, 'request_id');
    }

    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
