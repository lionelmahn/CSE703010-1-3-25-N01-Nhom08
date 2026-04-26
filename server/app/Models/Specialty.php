<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Specialty extends Model
{
    protected $fillable = ['name', 'description'];

    // Mối quan hệ N-N: Một chuyên môn có nhiều dịch vụ
    public function services()
    {
        return $this->belongsToMany(Service::class, 'service_specialty');
    }
}