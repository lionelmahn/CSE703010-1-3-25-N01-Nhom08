<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon; // BẮT BUỘC PHẢI CÓ DÒNG NÀY

class Service extends Model
{
    protected $fillable = [
        'service_code', 
        'name', 
        'service_group', 
        'description', 
        'price', 
        'duration_minutes',
        'status',        
        'visibility',
        'commission_rate',
    ];

    public function attachments()
    {
        return $this->hasMany(ServiceAttachment::class);
    }

    public function specialties()
    {
        return $this->belongsToMany(Specialty::class, 'service_specialty');
    }

    public function prices()
    {
        return $this->hasMany(ServicePrice::class)->orderBy('effective_from', 'desc');
    }

    public function currentPrice()
    {
        $now = Carbon::now('Asia/Ho_Chi_Minh');

        return $this->hasOne(ServicePrice::class)
                    ->where('status', 'approved')
                    ->where('effective_from', '<=', $now)
                    ->where(function($query) use ($now) {
                        $query->whereNull('effective_to')->orWhere('effective_to', '>', $now);
                    })
                    ->orderBy('effective_from', 'desc');
    }
}