<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServicePackage extends Model
{
    protected $fillable = [
        'package_code', 'name', 'description', 'original_price', 
        'package_price', 'usage_limit_days', 'status', 'visibility'
    ];

    public function services()
    {
        return $this->belongsToMany(Service::class, 'service_package_items', 'package_id', 'service_id')
                    ->withPivot('quantity')
                    ->withTimestamps();
    }
}