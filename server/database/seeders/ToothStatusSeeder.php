<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ToothStatus;
use App\Models\User;

class ToothStatusSeeder extends Seeder
{
    public function run(): void
    {
        // Tìm tài khoản Admin để gán vào created_by
        $admin = User::whereHas('roles', function($q) {
            $q->where('slug', 'admin');
        })->first();

        // Nếu không tìm thấy admin, lấy đại user đầu tiên trong bảng users
        $userId = $admin ? $admin->id : (User::first()->id ?? null);

        if (!$userId) {
            $this->command->error("Lỗi: Bảng users đang trống. Hãy chạy Seeder tài khoản trước!");
            return;
        }

        $data = [
            ['status_code' => 'NORMAL', 'name' => 'Răng khỏe mạnh', 'status_group' => 'normal', 'color_code' => '#10B981', 'icon' => 'tooth-normal', 'sort_order' => 1],
            ['status_code' => 'DECAY_S1', 'name' => 'Sâu răng độ 1', 'status_group' => 'pathology', 'color_code' => '#F59E0B', 'icon' => 'tooth-decay', 'sort_order' => 2],
            ['status_code' => 'DECAY_S2', 'name' => 'Sâu răng viêm tủy', 'status_group' => 'pathology', 'color_code' => '#EF4444', 'icon' => 'tooth-decay', 'sort_order' => 3],
            ['status_code' => 'MISSING', 'name' => 'Răng đã mất', 'status_group' => 'missing', 'color_code' => '#94A3B8', 'icon' => 'tooth-missing', 'sort_order' => 4],
            ['status_code' => 'FILLED', 'name' => 'Răng đã trám', 'status_group' => 'treated', 'color_code' => '#06B6D4', 'icon' => 'tooth-filled', 'sort_order' => 5],
        ];

        foreach ($data as $item) {
            ToothStatus::updateOrCreate(
                ['status_code' => $item['status_code']], // Nếu trùng mã thì cập nhật, chưa có thì tạo mới
                array_merge($item, [
                    'approval_status' => 'approved',
                    'is_active' => true,
                    'created_by' => $userId,
                    'description' => 'Dữ liệu mẫu hệ thống'
                ])
            );
        }
        
        $this->command->info("Đã đổ xong dữ liệu Trạng thái răng!");
    }
}