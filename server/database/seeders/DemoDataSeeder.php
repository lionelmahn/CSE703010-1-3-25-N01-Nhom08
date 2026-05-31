<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Du lieu mau nghiep vu tong hop.
 *
 * Khong tao them tai khoan dang nhap la. Seeder nay chi dung cac account
 * mac dinh tu UserSeeder:
 * - admin@dental.com
 * - bacsi@dental.com
 * - letan@dental.com
 * - ketoan@dental.com
 */
class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(BookingCheckinBillingTestSeeder::class);
    }
}
