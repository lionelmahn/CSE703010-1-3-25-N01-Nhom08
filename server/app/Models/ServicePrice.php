<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServicePrice extends Model
{
    // ĐÃ SỬA DẤU CHẤM THÀNH DẤU PHẨY
    protected $fillable = ['service_id', 'price', 'effective_from', 'effective_to', 'note', 'status'];

     // Mối quan hệ N-1: Thuộc về 1 dịch vụ
    public function service()
    {
        return $this->belongsTo(Service::class);
    }
}