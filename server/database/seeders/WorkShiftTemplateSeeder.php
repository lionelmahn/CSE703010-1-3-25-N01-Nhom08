<?php

namespace Database\Seeders;

use App\Models\WorkShiftTemplate;
use Illuminate\Database\Seeder;

class WorkShiftTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            [
                'code' => WorkShiftTemplate::CODE_MORNING,
                'name' => 'Ca sáng',
                'start_time' => '07:00:00',
                'end_time' => '11:00:00',
                'color' => 'green',
                'display_order' => 1,
            ],
            [
                'code' => WorkShiftTemplate::CODE_AFTERNOON,
                'name' => 'Ca chiều',
                'start_time' => '13:00:00',
                'end_time' => '17:00:00',
                'color' => 'blue',
                'display_order' => 2,
            ],
            [
                'code' => WorkShiftTemplate::CODE_EVENING,
                'name' => 'Ca tối',
                'start_time' => '17:00:00',
                'end_time' => '21:00:00',
                'color' => 'orange',
                'display_order' => 3,
            ],
            [
                'code' => WorkShiftTemplate::CODE_CUSTOM,
                'name' => 'Ca tùy chỉnh',
                'start_time' => '00:00:00',
                'end_time' => '00:00:00',
                'color' => 'purple',
                'display_order' => 4,
            ],
        ];

        foreach ($templates as $template) {
            WorkShiftTemplate::updateOrCreate(
                ['code' => $template['code']],
                array_merge($template, ['is_active' => true])
            );
        }
    }
}
