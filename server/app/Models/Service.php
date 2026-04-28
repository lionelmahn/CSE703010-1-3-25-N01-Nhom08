<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    // Mở khóa toàn bộ các cột theo đúng file create_services_table
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

    // Mối quan hệ 1-N: Có nhiều tệp đính kèm
    public function attachments()
    {
        return $this->hasMany(ServiceAttachment::class);
    }

    // Mối quan hệ N-N: Dịch vụ thuộc về nhiều Chuyên môn
    public function specialties()
    {
        return $this->belongsToMany(Specialty::class, 'service_specialty');
    }
}