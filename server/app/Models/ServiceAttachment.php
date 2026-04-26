<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceAttachment extends Model
{
    protected $fillable = ['service_id', 'file_name', 'file_path', 'file_type'];

    // Mối quan hệ 1-N: Thuộc về 1 dịch vụ
    public function service()
    {
        return $this->belongsTo(Service::class);
    }
}