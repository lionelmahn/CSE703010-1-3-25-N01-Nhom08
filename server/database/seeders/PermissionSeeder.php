<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $modules = [
            'users' => 'Quan ly nguoi dung',
            'staff' => 'Nhan su',
            'professional_profiles' => 'Ho so chuyen mon',
            'categories' => 'Danh muc',
            'patients' => 'Benh nhan',
            'services' => 'Dich vu nha khoa',
            'packages' => 'Goi dich vu',
            'appointments' => 'Lich hen',
            'dental_records' => 'Kham nha khoa',
            'finance' => 'Tai chinh',
            'invoices' => 'Hoa don',
            'payments' => 'Thanh toan',
            'reports' => 'Bao cao',
            'schedules' => 'Lich lam viec',
            'prices' => 'Bang gia dich vu',
            'tooth_statuses' => 'Trang thai rang',
        ];

        $actions = [
            'view' => 'Xem',
            'create' => 'Them',
            'edit' => 'Sua',
            'delete' => 'Xoa',
            'approve' => 'Duyet/Xac nhan',
            'export' => 'In/Xuat file',
        ];

        $permissionIds = [];

        foreach ($modules as $moduleSlug => $moduleName) {
            foreach ($actions as $actionSlug => $actionName) {
                $permission = Permission::firstOrCreate(
                    ['slug' => "{$moduleSlug}.{$actionSlug}"],
                    [
                        'name' => "{$actionName} {$moduleName}",
                        'module' => $moduleSlug,
                    ]
                );
                $permissionIds[] = $permission->id;
            }
        }

        $adminRole = Role::where('slug', 'admin')->first();
        if ($adminRole) {
            $adminRole->permissions()->sync($permissionIds);
        }

        // Grant services.view + packages.view to all non-admin roles so they
        // can browse the catalog (visibility/status scope enforced server-side).
        $sharedView = Permission::whereIn('slug', ['services.view', 'packages.view'])->pluck('id')->all();
        if (! empty($sharedView)) {
            foreach (['bac_si', 'le_tan', 'ke_toan', 'benh_nhan'] as $slug) {
                $role = Role::where('slug', $slug)->first();
                if ($role) {
                    $role->permissions()->syncWithoutDetaching($sharedView);
                }
            }
        }

        // Grant prices.view to internal staff so they can read pricing.
        $pricesView = Permission::where('slug', 'prices.view')->value('id');
        if ($pricesView) {
            foreach (['bac_si', 'le_tan', 'ke_toan'] as $slug) {
                $role = Role::where('slug', $slug)->first();
                if ($role) {
                    $role->permissions()->syncWithoutDetaching([$pricesView]);
                }
            }
        }

        // Accountant can propose new prices (Admin still approves).
        $accountantExtra = Permission::whereIn('slug', ['prices.create', 'prices.edit'])->pluck('id')->all();
        if (! empty($accountantExtra)) {
            $accountant = Role::where('slug', 'ke_toan')->first();
            if ($accountant) {
                $accountant->permissions()->syncWithoutDetaching($accountantExtra);
            }
        }

        // UC4.4 — bac_si and other clinical roles can read tooth statuses
        // (master data used in dental records). Mutations remain admin-only.
        $toothStatusView = Permission::where('slug', 'tooth_statuses.view')->value('id');
        if ($toothStatusView) {
            foreach (['bac_si', 'le_tan', 'ke_toan'] as $slug) {
                $role = Role::where('slug', $slug)->first();
                if ($role) {
                    $role->permissions()->syncWithoutDetaching([$toothStatusView]);
                }
            }
        }

        // UC6.2 — Le tan duoc xu ly yeu cau dat lich online + thao tac patient,
        // appointment. Admin co them quyen reopen (BR-19) qua appointments.approve.
        $receptionistPermissions = Permission::whereIn('slug', [
            'appointments.view',
            'appointments.create',
            'appointments.edit',
            'patients.view',
            'patients.create',
            'patients.edit',
            'services.view',
        ])->pluck('id')->all();
        $receptionist = Role::where('slug', 'le_tan')->first();
        if ($receptionist && ! empty($receptionistPermissions)) {
            $receptionist->permissions()->syncWithoutDetaching($receptionistPermissions);
        }

        // UC8 — Dieu phoi bac si. Tach 3 slug rieng (assign / reassign /
        // unassign) ngoai matrix module.action vi rieng cho appointments.
        $dispatchSlugs = [
            'appointments.assign' => 'Phan cong bac si cho lich hen',
            'appointments.reassign' => 'Doi bac si cho lich hen',
            'appointments.unassign' => 'Huy phan cong bac si',
        ];
        $dispatchIds = [];
        foreach ($dispatchSlugs as $slug => $name) {
            $permission = Permission::firstOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'module' => 'appointments']
            );
            $dispatchIds[] = $permission->id;
        }
        if ($adminRole && ! empty($dispatchIds)) {
            $adminRole->permissions()->syncWithoutDetaching($dispatchIds);
        }
        if ($receptionist && ! empty($dispatchIds)) {
            $receptionist->permissions()->syncWithoutDetaching($dispatchIds);
        }

        // UC11 - Tiep nhan / Check-in benh nhan. Tach 2 slug rieng (check_in /
        // cancel_check_in). Mac dinh le_tan + admin co check_in; cancel chi
        // admin (BR10 - "Admin hoac nguoi co quyen dac biet").
        $checkInSlugs = [
            'appointments.check_in' => 'Check-in benh nhan',
            'appointments.cancel_check_in' => 'Huy check-in benh nhan',
        ];
        $checkInIds = [];
        $checkInOnlyIds = [];
        foreach ($checkInSlugs as $slug => $name) {
            $permission = Permission::firstOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'module' => 'appointments']
            );
            $checkInIds[] = $permission->id;
            if ($slug === 'appointments.check_in') {
                $checkInOnlyIds[] = $permission->id;
            }
        }
        if ($adminRole && ! empty($checkInIds)) {
            $adminRole->permissions()->syncWithoutDetaching($checkInIds);
        }
        if ($receptionist && ! empty($checkInOnlyIds)) {
            $receptionist->permissions()->syncWithoutDetaching($checkInOnlyIds);
        }

        // UC10 - Quan ly thong bao lich hen. Tach module rieng "notifications"
        // va "notification_templates" de phan biet rang buoc quyen le tan vs
        // admin (notifications.cancel + notification_templates.* chi admin).
        $uc10Slugs = [
            'notifications.view' => ['name' => 'Xem danh sach thong bao', 'module' => 'notifications'],
            'notifications.resend' => ['name' => 'Gui lai thong bao that bai', 'module' => 'notifications'],
            'notifications.send_manual' => ['name' => 'Gui thong bao thu cong', 'module' => 'notifications'],
            'notifications.cancel' => ['name' => 'Huy thong bao cho gui', 'module' => 'notifications'],
            'notification_templates.view' => ['name' => 'Xem mau email he thong', 'module' => 'notification_templates'],
            'notification_templates.update' => ['name' => 'Cap nhat mau email he thong', 'module' => 'notification_templates'],
        ];

        $uc10AdminIds = [];
        $uc10ReceptionistIds = [];
        foreach ($uc10Slugs as $slug => $meta) {
            $permission = Permission::firstOrCreate(
                ['slug' => $slug],
                ['name' => $meta['name'], 'module' => $meta['module']]
            );
            $uc10AdminIds[] = $permission->id;
            if (in_array($slug, [
                'notifications.view',
                'notifications.resend',
                'notifications.send_manual',
            ], true)) {
                $uc10ReceptionistIds[] = $permission->id;
            }
        }

        if ($adminRole) {
            $adminRole->permissions()->syncWithoutDetaching($uc10AdminIds);
        }
        if ($receptionist && ! empty($uc10ReceptionistIds)) {
            $receptionist->permissions()->syncWithoutDetaching($uc10ReceptionistIds);
        }

        // UC12 - Quan ly ho so benh an. Bo sung 2 slug lock/unlock ngoai
        // matrix dental_records.{view,create,edit,delete,approve,export}.
        // Phan quyen mac dinh:
        //   - admin: full (gom ca lock/unlock).
        //   - bac_si: view/create/edit/export/lock (chi voi phien cua minh
        //     - owner check trong Policy).
        //   - le_tan: view (chi truong hanh chinh/thanh toan - field masking
        //     server-side).
        //   - ke_toan: view (chi du lieu tai chinh sau khi hoan tat).
        $uc12LockSlugs = [
            'dental_records.lock' => 'Khoa ho so benh an',
            'dental_records.unlock' => 'Mo khoa ho so benh an',
        ];
        $uc12LockIds = [];
        $uc12LockOnlyIds = [];
        foreach ($uc12LockSlugs as $slug => $name) {
            $permission = Permission::firstOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'module' => 'dental_records']
            );
            $uc12LockIds[] = $permission->id;
            if ($slug === 'dental_records.lock') {
                $uc12LockOnlyIds[] = $permission->id;
            }
        }
        if ($adminRole && ! empty($uc12LockIds)) {
            $adminRole->permissions()->syncWithoutDetaching($uc12LockIds);
        }

        $doctorRole = Role::where('slug', 'bac_si')->first();
        $accountantRole = Role::where('slug', 'ke_toan')->first();

        $doctorDentalSlugs = Permission::whereIn('slug', [
            'dental_records.view',
            'dental_records.create',
            'dental_records.edit',
            'dental_records.export',
        ])->pluck('id')->all();
        if ($doctorRole && ! empty($doctorDentalSlugs)) {
            $doctorRole->permissions()->syncWithoutDetaching($doctorDentalSlugs);
        }
        if ($doctorRole && ! empty($uc12LockOnlyIds)) {
            $doctorRole->permissions()->syncWithoutDetaching($uc12LockOnlyIds);
        }

        $viewOnlyId = Permission::where('slug', 'dental_records.view')->value('id');
        if ($viewOnlyId) {
            if ($receptionist) {
                $receptionist->permissions()->syncWithoutDetaching([$viewOnlyId]);
            }
            if ($accountantRole) {
                $accountantRole->permissions()->syncWithoutDetaching([$viewOnlyId]);
            }
        }

        // UC13 - Thanh toan chi phi kham benh. Module rieng `invoices` +
        // `payments` (align UC12 dental_records/notifications style). Bo sung
        // 5 slug dac biet ngoai matrix module.action: invoices.cancel,
        // invoices.adjust, invoices.discount, invoices.print, payments.refund.
        $uc13ExtraSlugs = [
            'invoices.cancel' => ['name' => 'Huy hoa don', 'module' => 'invoices'],
            'invoices.adjust' => ['name' => 'Dieu chinh hoa don', 'module' => 'invoices'],
            'invoices.discount' => ['name' => 'Ap dung giam gia / phu thu', 'module' => 'invoices'],
            'invoices.print' => ['name' => 'In / xuat hoa don', 'module' => 'invoices'],
            'payments.refund' => ['name' => 'Hoan tien', 'module' => 'payments'],
        ];
        $uc13ExtraIds = [];
        foreach ($uc13ExtraSlugs as $slug => $meta) {
            $permission = Permission::firstOrCreate(
                ['slug' => $slug],
                ['name' => $meta['name'], 'module' => $meta['module']]
            );
            $uc13ExtraIds[] = $permission->id;
        }
        if ($adminRole && ! empty($uc13ExtraIds)) {
            $adminRole->permissions()->syncWithoutDetaching($uc13ExtraIds);
        }

        // Phan quyen mac dinh UC13:
        //   - admin: full (auto qua matrix + extra slugs).
        //   - ke_toan: full invoice + payment + refund (cap nhat doanh thu).
        //   - le_tan: view, create, discount, print, payments.create (thu tien
        //     truc tiep tai quay). KHONG co cancel / adjust / refund.
        //   - bac_si: KHONG mac dinh (tranh lo gia khi tu van).
        $accountantBillingSlugs = Permission::whereIn('slug', [
            'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.export',
            'invoices.cancel', 'invoices.adjust', 'invoices.discount', 'invoices.print',
            'payments.view', 'payments.create', 'payments.refund', 'payments.export',
        ])->pluck('id')->all();
        if ($accountantRole && ! empty($accountantBillingSlugs)) {
            $accountantRole->permissions()->syncWithoutDetaching($accountantBillingSlugs);
        }

        // UC14 - Ke toan xem va xuat bao cao doanh thu.
        $accountantReportSlugs = Permission::whereIn('slug', [
            'reports.view',
            'reports.export',
        ])->pluck('id')->all();
        if ($accountantRole && ! empty($accountantReportSlugs)) {
            $accountantRole->permissions()->syncWithoutDetaching($accountantReportSlugs);
        }

        // UC15 - Thiet lap muc tien co ban cho mot gio lam viec.
        $uc15Slugs = [
            'payroll.hourly_rate.view' => 'Xem cau hinh muc tien co ban theo gio',
            'payroll.hourly_rate.manage' => 'Thiet lap muc tien co ban theo gio',
        ];
        $uc15Ids = [];
        foreach ($uc15Slugs as $slug => $name) {
            $permission = Permission::firstOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'module' => 'payroll']
            );
            $uc15Ids[] = $permission->id;
        }
        if ($adminRole && ! empty($uc15Ids)) {
            $adminRole->permissions()->syncWithoutDetaching($uc15Ids);
        }
        if ($accountantRole && ! empty($uc15Ids)) {
            $accountantRole->permissions()->syncWithoutDetaching($uc15Ids);
        }

        // UC16 - Thiết lập hệ số ca làm việc theo loại ngày/loại ca.
        $uc16Slugs = [
            'payroll.shift_coefficient.view' => 'Xem cấu hình hệ số ca làm việc',
            'payroll.shift_coefficient.manage' => 'Thiết lập hệ số ca làm việc',
        ];
        $uc16Ids = [];
        foreach ($uc16Slugs as $slug => $name) {
            $permission = Permission::updateOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'module' => 'payroll']
            );
            $uc16Ids[] = $permission->id;
        }
        if ($adminRole && ! empty($uc16Ids)) {
            $adminRole->permissions()->syncWithoutDetaching($uc16Ids);
        }
        if ($accountantRole && ! empty($uc16Ids)) {
            $accountantRole->permissions()->syncWithoutDetaching($uc16Ids);
        }

        // UC17 - Thiet lap he so phuc tap theo dich vu va muc xu ly.
        $uc17Slugs = [
            'payroll.service_complexity.view' => 'Xem cau hinh he so phuc tap dich vu',
            'payroll.service_complexity.manage' => 'Thiet lap he so phuc tap dich vu',
        ];
        $uc17Ids = [];
        foreach ($uc17Slugs as $slug => $name) {
            $permission = Permission::updateOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'module' => 'payroll']
            );
            $uc17Ids[] = $permission->id;
        }
        if ($adminRole && ! empty($uc17Ids)) {
            $adminRole->permissions()->syncWithoutDetaching($uc17Ids);
        }
        if ($accountantRole && ! empty($uc17Ids)) {
            $accountantRole->permissions()->syncWithoutDetaching($uc17Ids);
        }

        // UC15.4 - Thiet lap he so bac si theo hoc ham/hoc vi.
        $uc154Slugs = [
            'payroll.doctor_qualification_coefficient.view' => 'Xem cau hinh he so bac si theo hoc ham hoc vi',
            'payroll.doctor_qualification_coefficient.manage' => 'Thiet lap he so bac si theo hoc ham hoc vi',
        ];
        $uc154Ids = [];
        foreach ($uc154Slugs as $slug => $name) {
            $permission = Permission::updateOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'module' => 'payroll']
            );
            $uc154Ids[] = $permission->id;
        }
        if ($adminRole && ! empty($uc154Ids)) {
            $adminRole->permissions()->syncWithoutDetaching($uc154Ids);
        }
        if ($accountantRole && ! empty($uc154Ids)) {
            $accountantRole->permissions()->syncWithoutDetaching($uc154Ids);
        }

        // UC16 - Lap phieu luong cho mot bac si trong thang.
        $uc16SalarySlipSlugs = [
            'payroll.salary_slip.view' => 'Xem phieu luong bac si',
            'payroll.salary_slip.manage' => 'Lap, tinh va chot phieu luong bac si',
        ];
        $uc16SalarySlipIds = [];
        foreach ($uc16SalarySlipSlugs as $slug => $name) {
            $permission = Permission::updateOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'module' => 'payroll']
            );
            $uc16SalarySlipIds[] = $permission->id;
        }
        if ($adminRole && ! empty($uc16SalarySlipIds)) {
            $adminRole->permissions()->syncWithoutDetaching($uc16SalarySlipIds);
        }
        if ($accountantRole && ! empty($uc16SalarySlipIds)) {
            $accountantRole->permissions()->syncWithoutDetaching($uc16SalarySlipIds);
        }

        // UC17 - Bao cao tien luong tat ca bac si trong mot thang.
        $uc17SalaryReportSlugs = [
            'payroll.salary_report.view' => 'Xem bao cao luong thang toan bac si',
            'payroll.salary_report.export' => 'Xuat/in bao cao luong thang',
        ];
        $uc17SalaryReportIds = [];
        foreach ($uc17SalaryReportSlugs as $slug => $name) {
            $permission = Permission::updateOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'module' => 'payroll']
            );
            $uc17SalaryReportIds[] = $permission->id;
        }
        if ($adminRole && ! empty($uc17SalaryReportIds)) {
            $adminRole->permissions()->syncWithoutDetaching($uc17SalaryReportIds);
        }
        if ($accountantRole && ! empty($uc17SalaryReportIds)) {
            $accountantRole->permissions()->syncWithoutDetaching($uc17SalaryReportIds);
        }

        // UC18 - Bao cao tien luong mot bac si trong mot nam (doc tu UC16).
        $uc18AnnualReportSlugs = [
            'payroll.salary_report_annual.view' => 'Xem bao cao luong nam cua bac si',
            'payroll.salary_report_annual.export' => 'Xuat/in bao cao luong nam',
            'payroll.salary_report_annual.view_own' => 'Xem bao cao luong nam cua chinh minh',
            'payroll.salary_report_annual.export_own' => 'Xuat/in bao cao luong nam cua chinh minh',
        ];
        $uc18AnnualReportIds = [];
        foreach ($uc18AnnualReportSlugs as $slug => $name) {
            $permission = Permission::updateOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'module' => 'payroll']
            );
            $uc18AnnualReportIds[$slug] = $permission->id;
        }
        // Admin + Ke toan: xem/xuat bao cao nam cua moi bac si.
        $uc18ManageIds = [
            $uc18AnnualReportIds['payroll.salary_report_annual.view'],
            $uc18AnnualReportIds['payroll.salary_report_annual.export'],
        ];
        if ($adminRole) {
            $adminRole->permissions()->syncWithoutDetaching($uc18ManageIds);
        }
        if ($accountantRole) {
            $accountantRole->permissions()->syncWithoutDetaching($uc18ManageIds);
        }
        // Bac si: chi xem/xuat bao cao nam cua chinh minh (A4/VR9).
        $uc18OwnIds = [
            $uc18AnnualReportIds['payroll.salary_report_annual.view_own'],
            $uc18AnnualReportIds['payroll.salary_report_annual.export_own'],
        ];
        if ($doctorRole) {
            $doctorRole->permissions()->syncWithoutDetaching($uc18OwnIds);
        }

        // UC19 - Bao cao tien luong tat ca bac si trong mot nam (doc tu UC16).
        // Chi Admin + Ke toan; bac si KHONG duoc xem bao cao luong toan bo bac si.
        $uc19AnnualAllSlugs = [
            'payroll.salary_report_annual_all.view' => 'Xem bao cao luong nam toan bo bac si',
            'payroll.salary_report_annual_all.export' => 'Xuat/in bao cao luong nam toan bo bac si',
        ];
        $uc19AnnualAllIds = [];
        foreach ($uc19AnnualAllSlugs as $slug => $name) {
            $permission = Permission::updateOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'module' => 'payroll']
            );
            $uc19AnnualAllIds[] = $permission->id;
        }
        if ($adminRole) {
            $adminRole->permissions()->syncWithoutDetaching($uc19AnnualAllIds);
        }
        if ($accountantRole) {
            $accountantRole->permissions()->syncWithoutDetaching($uc19AnnualAllIds);
        }

        $receptionistBillingSlugs = Permission::whereIn('slug', [
            'invoices.view', 'invoices.create', 'invoices.discount', 'invoices.print',
            'payments.view', 'payments.create',
        ])->pluck('id')->all();
        if ($receptionist && ! empty($receptionistBillingSlugs)) {
            $receptionist->permissions()->syncWithoutDetaching($receptionistBillingSlugs);
        }
    }
}
