<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    // Khai báo các cột được phép thêm/sửa
    protected $fillable = [
        'service_code', 
        'name', 
        'service_group', 
        'description', 
        'price', 
        'duration_minutes', 
        'status', 
        'visibility',
        'commission_rate'
        
        
    ];

    public function specialties()
    {
        return $this->belongsToMany(Specialty::class, 'service_specialty');
    }

    // Mối quan hệ 1-N: Một dịch vụ có nhiều hình ảnh/tài liệu
    public function attachments()
    {
        return $this->hasMany(ServiceAttachment::class);
    }
}