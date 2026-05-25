<?php

/**
 * UC10 - Cau hinh phong kham dung cho email/notification.
 *
 * Co the override qua bien moi truong CLINIC_NAME, CLINIC_LOGO_URL,
 * CLINIC_HOTLINE, CLINIC_EMAIL, CLINIC_ADDRESS, CLINIC_WEBSITE.
 */

return [
    'name' => env('CLINIC_NAME', 'Dental Pro'),

    'logo_url' => env('CLINIC_LOGO_URL', null),

    'hotline' => env('CLINIC_HOTLINE', '(028) 1234 5678'),

    'email' => env('CLINIC_EMAIL', 'phongkham@dental.vn'),

    'address' => env('CLINIC_ADDRESS', '123 Nguyen Trai, Quan 1, TP.HCM'),

    'website' => env('CLINIC_WEBSITE', 'https://dental-pro.example.com'),
];
