<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Service;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            [
                'service_code' => 'DV001',
                'name' => 'Lấy cao răng',
                'service_group' => 'Khám',
                'price' => 200000,
                'duration_minutes' => 30,
                'status' => 'active',
                'visibility' => 'public',
                'commission_rate' => 10, // Giữ lại trường cũ của Minh
            ],
            [
                'service_code' => 'DV002',
                'name' => 'Nhổ răng khôn',
                'service_group' => 'Điều trị',
                'price' => 1500000,
                'duration_minutes' => 60,
                'status' => 'active',
                'visibility' => 'internal',
                'commission_rate' => 15,
            ],
            [
                'service_code' => 'DV003',
                'name' => 'Tẩy trắng răng',
                'service_group' => 'Điều trị',
                'price' => 2500000,
                'duration_minutes' => 45,
                'status' => 'active',
                'visibility' => 'public',
                'commission_rate' => 20,
            ],
        ];

        foreach ($services as $service) {
            Service::create($service);
        }
    }
}