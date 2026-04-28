<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MyProfessionalProfileController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\ProfessionalProfileController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\ServiceController; 
use App\Http\Controllers\Api\SpecialtyController; 
use App\Http\Controllers\Api\ServicePackageController;
// --- ĐÂY LÀ IMPORT BẠN BỊ THIẾU ---
use App\Http\Controllers\Api\PriceListController; 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


// --- Public Routes ---
Route::post('/login', [AuthController::class, 'login']);
Route::post('/verify-login-otp', [AuthController::class, 'verifyLoginOtp']);
Route::post('/auth/google', [AuthController::class, 'googleLogin']);

Route::post('/password/forgot/send-otp', [PasswordResetController::class, 'sendResetOtp']);
Route::post('/password/forgot/verify-otp', [PasswordResetController::class, 'verifyResetOtp']);
Route::post('/password/forgot/reset', [PasswordResetController::class, 'resetPassword']);

// --- Protected Routes (Yêu cầu đăng nhập) ---
Route::middleware('auth:sanctum')->group(function () {
    
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/me', function (Request $request) {
        return $request->user();
    });

    Route::get('/user', function (Request $request) {
        $user = $request->user();
        return array_merge($user->toArray(), [
            'role' => $user->roles->first()?->slug ?? '',
            'permission_slugs' => $user->getPermissionSlugs()
        ]);
    });

    // --- Quản lý Quyền & Vai trò ---
    Route::get('/permissions', [PermissionController::class, 'index']);
    Route::get('/roles/{id}/permissions', [PermissionController::class, 'getPermissionsByRole']);
    Route::put('/users/{id}/permissions', [PermissionController::class, 'updateUserPermissions']);
    
    Route::get('/my-professional-profile', [MyProfessionalProfileController::class, 'show']);
    Route::put('/my-professional-profile/{professionalProfile}', [MyProfessionalProfileController::class, 'update'])->whereNumber('professionalProfile');
    Route::post('/my-professional-profile/{professionalProfile}/submit', [MyProfessionalProfileController::class, 'submit'])->whereNumber('professionalProfile');

    // ==========================================================
    // API CHO PHÉP TẤT CẢ NHÂN VIÊN ĐÃ ĐĂNG NHẬP ĐỀU XEM ĐƯỢC
    // ==========================================================
    Route::get('/services', [ServiceController::class, 'index']);
    Route::get('/specialties', [SpecialtyController::class, 'index']);
    Route::get('/service-packages', [ServicePackageController::class, 'index']); 
    
    // --- LẤY DỮ LIỆU BẢNG GIÁ ĐỂ ĐỔ LÊN GIAO DIỆN MÀ BẠN CHỤP ẢNH ---
    Route::get('/price-list', [PriceListController::class, 'index']); 
    Route::get('/price-list/{serviceId}/history', [PriceListController::class, 'history'])->whereNumber('serviceId');

    // --- API ĐỀ XUẤT GIÁ MỚI (Cả Kế toán và Admin đều được gọi) ---
    Route::middleware('role:admin,ke_toan')->group(function () {
        Route::post('/price-list', [PriceListController::class, 'store']);
    });

    // --- Nhóm Route chỉ dành riêng cho ADMIN ---
    Route::middleware('role:admin')->group(function () {
        
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{user}', [UserController::class, 'update'])->whereNumber('user');
        Route::put('/users/{user}/toggle-status', [UserController::class, 'toggleStatus'])->whereNumber('user');
        Route::post('/users/{user}/send-reset-otp', [UserController::class, 'sendResetOtp'])->whereNumber('user');
        Route::post('/users/{user}/verify-reset', [UserController::class, 'verifyAndResetPassword'])->whereNumber('user');
        Route::get('/users/history', [UserController::class, 'getHistory']);

        Route::get('/staff', [\App\Http\Controllers\Api\StaffController::class, 'index']);
        Route::post('/staff', [\App\Http\Controllers\Api\StaffController::class, 'store']);
        Route::get('/staff/{staff}', [\App\Http\Controllers\Api\StaffController::class, 'show'])->whereNumber('staff');
        Route::put('/staff/{staff}', [\App\Http\Controllers\Api\StaffController::class, 'update'])->whereNumber('staff');
        Route::put('/staff/{staff}/status', [\App\Http\Controllers\Api\StaffController::class, 'changeStatus'])->whereNumber('staff');
        Route::get('/staff/{staff}/history', [\App\Http\Controllers\Api\StaffController::class, 'history'])->whereNumber('staff');
        
        Route::get('/professional-profiles/options', [ProfessionalProfileController::class, 'options']);
        Route::get('/professional-profiles', [ProfessionalProfileController::class, 'index']);
        Route::post('/professional-profiles', [ProfessionalProfileController::class, 'store']);
        Route::get('/professional-profiles/{professionalProfile}', [ProfessionalProfileController::class, 'show'])->whereNumber('professionalProfile');
        Route::post('/professional-profiles/{professionalProfile}', [ProfessionalProfileController::class, 'update'])->whereNumber('professionalProfile');
        Route::post('/professional-profiles/{professionalProfile}/submit', [ProfessionalProfileController::class, 'submit'])->whereNumber('professionalProfile');
        Route::post('/professional-profiles/{professionalProfile}/approve', [ProfessionalProfileController::class, 'approve'])->whereNumber('professionalProfile');
        Route::post('/professional-profiles/{professionalProfile}/reject', [ProfessionalProfileController::class, 'reject'])->whereNumber('professionalProfile');
        Route::post('/professional-profiles/{professionalProfile}/invalidate', [ProfessionalProfileController::class, 'invalidate'])->whereNumber('professionalProfile');
        Route::get('/professional-profiles/{professionalProfile}/history', [ProfessionalProfileController::class, 'history'])->whereNumber('professionalProfile');

        Route::get('/roles', [UserController::class, 'getAllRoles']);
        Route::get('/admin/dashboard-stats', [DashboardController::class, 'getAdminStats']);

        // UC 4.1: QUẢN LÝ DỊCH VỤ NHA KHOA
        Route::post('/services', [ServiceController::class, 'store']);
        Route::put('/services/{service}', [ServiceController::class, 'update'])->whereNumber('service');
        Route::delete('/services/{service}', [ServiceController::class, 'destroy'])->whereNumber('service');

        // UC 4.2: QUẢN LÝ GÓI DỊCH VỤ
        Route::post('/service-packages', [ServicePackageController::class, 'store']);
        Route::put('/service-packages/{package}', [ServicePackageController::class, 'update'])->whereNumber('package');
        Route::delete('/service-packages/{package}', [ServicePackageController::class, 'destroy'])->whereNumber('package');

        // --- UC 4.3: QUYỀN PHÊ DUYỆT BẢNG GIÁ (Chỉ dành cho Admin) ---
        Route::put('/price-list/{id}/approve', [PriceListController::class, 'approve']);
    });
});