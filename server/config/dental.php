<?php

/**
 * UC12 - Cau hinh tam thoi cho mat do phuc tap cua dich vu nha khoa.
 *
 * Theo xac nhan PO ngay 29/05/2026:
 *  - He so phuc tap la DANG CONG THEM (additive) 0..0.5, KHONG phai
 *    multiplier 1.0/1.3 (de mau thuan voi mockup Figma).
 *  - 4 muc xu ly: thong_thuong, kho, phuc_tap, rat_phuc_tap.
 *  - UC17 (cau hinh he so theo dich vu) chua co. Khi UC17 san sang,
 *    ComplexityConfigService se chuyen sang doc tu DB thay vi file nay.
 */

return [
    /*
    |--------------------------------------------------------------------------
    | Default complexity coefficients per processing level (UC12 - UC17 mock).
    |--------------------------------------------------------------------------
    |
    | Khi bac si chon muc xu ly, FE/BE se hieu dinh he so cong them tu day.
    | Bac si CO THE override cho 1 dong dich vu cu the (van trong range 0..0.5).
    |
    */

    'default_complexity_by_level' => [
        'thong_thuong' => 0.0,
        'kho' => 0.1,
        'phuc_tap' => 0.3,
        'rat_phuc_tap' => 0.5,
    ],

    /*
    |--------------------------------------------------------------------------
    | Processing levels labels.
    |--------------------------------------------------------------------------
    */
    'processing_levels' => [
        'thong_thuong' => 'Thong thuong',
        'kho' => 'Kho',
        'phuc_tap' => 'Phuc tap',
        'rat_phuc_tap' => 'Rat phuc tap',
    ],

    /*
    |--------------------------------------------------------------------------
    | Allowed complexity coefficients (AC9 0..0.5 step 0.1).
    |--------------------------------------------------------------------------
    */
    'allowed_complexity_coefficients' => [0.0, 0.1, 0.2, 0.3, 0.4, 0.5],

    /*
    |--------------------------------------------------------------------------
    | Per-service override matrix.
    |--------------------------------------------------------------------------
    |
    | Optional. Map [service_id => [processing_level => coefficient]]. Khi
    | rong (mac dinh), service nao cung dung he so theo
    | `default_complexity_by_level`.
    |
    */
    'service_complexity_overrides' => [],

    /*
    |--------------------------------------------------------------------------
    | Mock payroll period lock flag (UC payroll chua co).
    |--------------------------------------------------------------------------
    */
    'is_payroll_period_locked' => env('UC12_PAYROLL_LOCKED', false),

    /*
    |--------------------------------------------------------------------------
    | UC12 hard limits.
    |--------------------------------------------------------------------------
    */
    'max_service_items_per_examination' => 50,
    'medical_record_code_prefix' => 'BA',
    'auto_save_interval_seconds' => 30,
];
