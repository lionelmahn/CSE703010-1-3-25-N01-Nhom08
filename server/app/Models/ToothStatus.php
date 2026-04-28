<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ToothStatus extends Model {
    protected $fillable = [
        'status_code', 'name', 'status_group', 'color_code', 
        'icon', 'description', 'approval_status', 'is_active', 'sort_order', 'created_by'
    ];

    public function creator() {
        return $this->belongsTo(User::class, 'created_by');
    }
}