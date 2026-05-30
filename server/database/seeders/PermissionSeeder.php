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
    }
}
