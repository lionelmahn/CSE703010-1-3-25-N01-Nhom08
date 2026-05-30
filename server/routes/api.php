<?php

use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DoctorController;
use App\Http\Controllers\Api\ExaminationController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\NotificationTemplateController;
use App\Http\Controllers\Api\LeaveRequestController;
use App\Http\Controllers\Api\MyProfessionalProfileController;
use App\Http\Controllers\Api\MyWorkScheduleController;
use App\Http\Controllers\Api\OnlineBookingController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\ProfessionalProfileController;
use App\Http\Controllers\Api\PublicBookingController;
use App\Http\Controllers\Api\ReceptionController;
use App\Http\Controllers\Api\ServiceAttachmentController;
use App\Http\Controllers\Api\ServiceCatalogController;
use App\Http\Controllers\Api\ServicePackageController;
use App\Http\Controllers\Api\ServicePriceController;
use App\Http\Controllers\Api\ShiftSwapRequestController;
use App\Http\Controllers\Api\ToothStatusController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\WorkScheduleController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::get('/public/services', [ServiceCatalogController::class, 'publicIndex']);
Route::get('/public/service-groups', [ServiceCatalogController::class, 'groups']);
Route::get('/public/service-packages', [ServicePackageController::class, 'publicIndex']);

// UC6.1 - Public booking endpoints (no auth).
Route::post('/public/online-bookings', [PublicBookingController::class, 'store']);
Route::get('/public/clinic-services', [PublicBookingController::class, 'services']);
Route::get('/public/clinic-branches', [PublicBookingController::class, 'branches']);
Route::get('/public/time-slots', [PublicBookingController::class, 'timeSlots']);
Route::post('/verify-login-otp', [AuthController::class, 'verifyLoginOtp']);
Route::post('/auth/google', [AuthController::class, 'googleLogin']);

Route::post('/password/forgot/send-otp', [PasswordResetController::class, 'sendResetOtp']);
Route::post('/password/forgot/verify-otp', [PasswordResetController::class, 'verifyResetOtp']);
Route::post('/password/forgot/reset', [PasswordResetController::class, 'resetPassword']);

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

    Route::get('/permissions', [PermissionController::class, 'index']);
    Route::get('/roles/{id}/permissions', [PermissionController::class, 'getRolePermissions']);
    Route::put('/roles/{id}/permissions', [PermissionController::class, 'updateRolePermissions']);
    Route::get('/users/{id}/permissions', [PermissionController::class, 'getUserPermissions']);
    Route::put('/users/{id}/permissions', [PermissionController::class, 'updateUserPermissions']);
    Route::get('/my-professional-profile', [MyProfessionalProfileController::class, 'show']);
    Route::put('/my-professional-profile/{professionalProfile}', [MyProfessionalProfileController::class, 'update'])->whereNumber('professionalProfile');
    Route::post('/my-professional-profile/{professionalProfile}/submit', [MyProfessionalProfileController::class, 'submit'])->whereNumber('professionalProfile');

    // Lich lam viec - cho moi user da dang nhap
    Route::get('/my-work-schedule', [MyWorkScheduleController::class, 'index']);
    Route::get('/staff-lookup', [MyWorkScheduleController::class, 'staffLookup']);
    Route::get('/work-shift-templates', [WorkScheduleController::class, 'templates']);
    Route::post('/work-schedules/{schedule}/leave-request', [LeaveRequestController::class, 'store'])->whereNumber('schedule');
    Route::post('/leave-requests', [LeaveRequestController::class, 'store']);
    Route::post('/shift-swap-requests', [ShiftSwapRequestController::class, 'store']);

    Route::middleware('role:admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{user}', [UserController::class, 'update'])->whereNumber('user');
        Route::put('/users/{user}/toggle-status', [UserController::class, 'toggleStatus'])->whereNumber('user');
        Route::post('/users/{user}/send-reset-otp', [UserController::class, 'sendResetOtp'])->whereNumber('user');
        Route::post('/users/{user}/verify-reset', [UserController::class, 'verifyAndResetPassword'])->whereNumber('user');
        Route::get('/users/history', [UserController::class, 'getHistory']);

        // Staff Routes
        Route::get('/staff', [\App\Http\Controllers\Api\StaffController::class, 'index']);
        Route::post('/staff', [\App\Http\Controllers\Api\StaffController::class, 'store']);
        Route::get('/staff/{staff}', [\App\Http\Controllers\Api\StaffController::class, 'show'])->whereNumber('staff');
        Route::put('/staff/{staff}', [\App\Http\Controllers\Api\StaffController::class, 'update'])->whereNumber('staff');
        Route::put('/staff/{staff}/status', [\App\Http\Controllers\Api\StaffController::class, 'changeStatus'])->whereNumber('staff');
        Route::get('/staff/{staff}/history', [\App\Http\Controllers\Api\StaffController::class, 'history'])->whereNumber('staff');
        Route::post('/staff/{staff}/reset-password', [\App\Http\Controllers\Api\StaffController::class, 'resetPassword'])->whereNumber('staff');
        Route::get('/branches', [\App\Http\Controllers\Api\BranchController::class, 'index']);
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

        // Service Catalog (UC4.1)
        Route::post('/services', [ServiceCatalogController::class, 'store']);
        Route::put('/services/{service}', [ServiceCatalogController::class, 'update'])->whereNumber('service');
        Route::post('/services/{service}/status', [ServiceCatalogController::class, 'changeStatus'])->whereNumber('service');
        Route::delete('/services/{service}', [ServiceCatalogController::class, 'destroy'])->whereNumber('service');
        Route::post('/services/{service}/attachments', [ServiceAttachmentController::class, 'store'])->whereNumber('service');
        Route::delete('/services/{service}/attachments/{attachment}', [ServiceAttachmentController::class, 'destroy'])->whereNumber('service')->whereNumber('attachment');
        Route::get('/services/audit-logs', [ServiceCatalogController::class, 'auditLogs']);

        // Work Schedule Management (UC3.3)
        Route::get('/work-schedules', [WorkScheduleController::class, 'index']);
        Route::post('/work-schedules', [WorkScheduleController::class, 'store']);
        Route::post('/work-schedules/copy', [WorkScheduleController::class, 'copy']);
        Route::get('/work-schedules/branch-stats', [WorkScheduleController::class, 'branchStats']);
        Route::get('/work-schedules/audit-logs', [WorkScheduleController::class, 'auditLogs']);
        Route::get('/work-schedules/{schedule}', [WorkScheduleController::class, 'show'])->whereNumber('schedule');
        Route::put('/work-schedules/{schedule}', [WorkScheduleController::class, 'update'])->whereNumber('schedule');
        Route::delete('/work-schedules/{schedule}', [WorkScheduleController::class, 'destroy'])->whereNumber('schedule');

        Route::get('/leave-requests', [LeaveRequestController::class, 'index']);
        Route::post('/leave-requests/{leaveRequest}/approve', [LeaveRequestController::class, 'approve'])->whereNumber('leaveRequest');
        Route::post('/leave-requests/{leaveRequest}/reject', [LeaveRequestController::class, 'reject'])->whereNumber('leaveRequest');

        Route::get('/shift-swap-requests', [ShiftSwapRequestController::class, 'index']);
        Route::post('/shift-swap-requests/{swap}/approve', [ShiftSwapRequestController::class, 'approve'])->whereNumber('swap');
        Route::post('/shift-swap-requests/{swap}/reject', [ShiftSwapRequestController::class, 'reject'])->whereNumber('swap');

        // Service Package (UC4.2)
        Route::post('/service-packages', [ServicePackageController::class, 'store']);
        Route::put('/service-packages/{package}', [ServicePackageController::class, 'update'])->whereNumber('package');
        Route::post('/service-packages/{package}/status', [ServicePackageController::class, 'changeStatus'])->whereNumber('package');
        Route::post('/service-packages/{package}/clone', [ServicePackageController::class, 'clone'])->whereNumber('package');
        Route::post('/service-packages/{package}/new-version', [ServicePackageController::class, 'newVersion'])->whereNumber('package');
        Route::delete('/service-packages/{package}', [ServicePackageController::class, 'destroy'])->whereNumber('package');
        Route::get('/service-packages/audit-logs', [ServicePackageController::class, 'auditLogs']);
    });

    // Service Prices (UC4.3)
    Route::middleware('permission:prices.view')->group(function () {
        Route::get('/service-prices', [ServicePriceController::class, 'index']);
        Route::get('/service-prices/pending', [ServicePriceController::class, 'pending']);
        Route::get('/service-prices/audit-logs', [ServicePriceController::class, 'auditLogs']);
        Route::get('/service-prices/services/{service}/timeline', [ServicePriceController::class, 'timeline'])->whereNumber('service');
    });
    Route::middleware('permission:prices.create')->group(function () {
        Route::post('/service-prices', [ServicePriceController::class, 'store']);
    });
    Route::middleware('permission:prices.edit')->group(function () {
        Route::put('/service-prices/{price}', [ServicePriceController::class, 'update'])->whereNumber('price');
    });
    Route::middleware('permission:prices.delete')->group(function () {
        Route::delete('/service-prices/{price}', [ServicePriceController::class, 'destroy'])->whereNumber('price');
    });
    Route::middleware('permission:prices.approve')->group(function () {
        Route::post('/service-prices/{price}/approve', [ServicePriceController::class, 'approve'])->whereNumber('price');
        Route::post('/service-prices/{price}/reject', [ServicePriceController::class, 'reject'])->whereNumber('price');
    });

    // Service Package - read-only for any authenticated user; controller scopes for benh_nhan
    Route::get('/service-packages', [ServicePackageController::class, 'index']);
    Route::get('/service-packages/{package}', [ServicePackageController::class, 'show'])->whereNumber('package');
    Route::get('/service-packages/{package}/discontinued-warnings', [ServicePackageController::class, 'discontinuedWarnings'])->whereNumber('package');

    // Service catalog (read for any authenticated user, scope filter applied in service)
    Route::get('/services', [ServiceCatalogController::class, 'index']);
    Route::get('/services/groups', [ServiceCatalogController::class, 'groups']);
    Route::get('/services/specialties', [ServiceCatalogController::class, 'specialties']);
    Route::get('/services/{service}', [ServiceCatalogController::class, 'show'])->whereNumber('service');
    Route::get('/services/{service}/attachments', [ServiceAttachmentController::class, 'index'])->whereNumber('service');
    Route::get('/services/{service}/attachments/{attachment}/download', [ServiceAttachmentController::class, 'download'])
        ->whereNumber('service')->whereNumber('attachment');

    // Tooth Status Management (UC4.4)
    Route::middleware('permission:tooth_statuses.view')->group(function () {
        Route::get('/tooth-statuses', [ToothStatusController::class, 'index']);
        Route::get('/tooth-status-groups', [ToothStatusController::class, 'groups']);
        Route::get('/tooth-statuses/history/recent', [ToothStatusController::class, 'recentHistory']);
        Route::get('/tooth-statuses/{tooth}', [ToothStatusController::class, 'show'])->whereNumber('tooth');
        Route::get('/tooth-statuses/{tooth}/history', [ToothStatusController::class, 'history'])->whereNumber('tooth');
    });

    // Doctors propose new/updated tooth statuses (A1) — admin still approves.
    Route::middleware('role:bac_si')->group(function () {
        Route::post('/tooth-status-proposals', [ToothStatusController::class, 'storeProposal']);
    });

    // Admin-only mutations on the master data + proposal review.
    Route::middleware('role:admin')->group(function () {
        Route::post('/tooth-statuses', [ToothStatusController::class, 'store']);
        Route::put('/tooth-statuses/{tooth}', [ToothStatusController::class, 'update'])->whereNumber('tooth');
        Route::post('/tooth-statuses/{tooth}/toggle-active', [ToothStatusController::class, 'toggleActive'])->whereNumber('tooth');
        Route::delete('/tooth-statuses/{tooth}', [ToothStatusController::class, 'destroy'])->whereNumber('tooth');
        Route::post('/tooth-statuses/reorder', [ToothStatusController::class, 'reorder']);

        Route::post('/tooth-status-groups', [ToothStatusController::class, 'storeGroup']);
        Route::put('/tooth-status-groups/{group}', [ToothStatusController::class, 'updateGroup'])->whereNumber('group');

        Route::get('/tooth-status-proposals', [ToothStatusController::class, 'listProposals']);
        Route::post('/tooth-status-proposals/{proposal}/approve', [ToothStatusController::class, 'approveProposal'])->whereNumber('proposal');
        Route::post('/tooth-status-proposals/{proposal}/reject', [ToothStatusController::class, 'rejectProposal'])->whereNumber('proposal');
    });

    // UC6.2 - Online booking management.
    Route::middleware('permission:appointments.view')->group(function () {
        Route::get('/online-bookings', [OnlineBookingController::class, 'index']);
        Route::get('/online-bookings/{id}', [OnlineBookingController::class, 'show'])->whereNumber('id');
    });

    Route::middleware('permission:appointments.create')->group(function () {
        Route::post('/online-bookings/{id}/start-processing', [OnlineBookingController::class, 'startProcessing'])->whereNumber('id');
        Route::post('/online-bookings/{id}/link-patient', [OnlineBookingController::class, 'linkPatient'])->whereNumber('id');
        Route::post('/online-bookings/{id}/create-patient', [OnlineBookingController::class, 'createPatient'])->whereNumber('id');
        Route::post('/online-bookings/{id}/confirm', [OnlineBookingController::class, 'confirm'])->whereNumber('id');
        Route::post('/online-bookings/{id}/propose-alternative', [OnlineBookingController::class, 'proposeAlternative'])->whereNumber('id');
        Route::post('/online-bookings/{id}/reject', [OnlineBookingController::class, 'reject'])->whereNumber('id');
        Route::post('/online-bookings/{id}/send-email', [OnlineBookingController::class, 'sendEmail'])->whereNumber('id');
        Route::post('/online-bookings/{id}/resend-email', [OnlineBookingController::class, 'resendEmail'])->whereNumber('id');
        Route::patch('/online-bookings/{id}/internal-note', [OnlineBookingController::class, 'updateInternalNote'])->whereNumber('id');
    });

    Route::middleware('permission:appointments.approve')->group(function () {
        Route::post('/online-bookings/{id}/reopen', [OnlineBookingController::class, 'reopen'])->whereNumber('id');
    });

    // UC7 - Quan ly lich hen chinh thuc.
    Route::middleware('permission:appointments.view')->group(function () {
        Route::get('/appointments', [AppointmentController::class, 'index']);
        Route::get('/appointments/options', [AppointmentController::class, 'options']);
        Route::get('/appointments/counts', [AppointmentController::class, 'counts']);
        Route::get('/appointments/calendar', [AppointmentController::class, 'calendar']);
        Route::get('/appointments/pending-assignment', [AppointmentController::class, 'pendingForAssignment']);
        Route::get('/appointments/{id}', [AppointmentController::class, 'show'])->whereNumber('id');
        Route::get('/appointments/{id}/available-doctors', [AppointmentController::class, 'availableDoctors'])->whereNumber('id');

        // UC8 - Doctor lookup + availability + workload.
        Route::get('/doctors', [DoctorController::class, 'index']);
        Route::get('/doctors/workload', [DoctorController::class, 'workload']);
        Route::get('/doctors/{id}/availability', [DoctorController::class, 'availability'])->whereNumber('id');
    });

    Route::middleware('permission:appointments.create')->group(function () {
        Route::post('/appointments', [AppointmentController::class, 'store']);
        Route::put('/appointments/{id}', [AppointmentController::class, 'update'])->whereNumber('id');
        Route::post('/appointments/{id}/reschedule', [AppointmentController::class, 'reschedule'])->whereNumber('id');
        Route::post('/appointments/{id}/cancel', [AppointmentController::class, 'cancel'])->whereNumber('id');
    });

    // UC8 - Dieu phoi bac si.
    Route::middleware('permission:appointments.assign')->group(function () {
        Route::post('/appointments/{id}/assign-doctor', [AppointmentController::class, 'assignDoctor'])->whereNumber('id');
    });
    Route::middleware('permission:appointments.reassign')->group(function () {
        Route::post('/appointments/{id}/reassign-doctor', [AppointmentController::class, 'reassignDoctor'])->whereNumber('id');
    });
    Route::middleware('permission:appointments.unassign')->group(function () {
        Route::post('/appointments/{id}/unassign-doctor', [AppointmentController::class, 'unassignDoctor'])->whereNumber('id');
    });

    // UC11 - Tiep nhan / check-in benh nhan.
    Route::middleware('permission:appointments.view')->group(function () {
        Route::get('/reception/today-appointments', [ReceptionController::class, 'todayAppointments']);
        Route::get('/reception/queue', [ReceptionController::class, 'queue']);
        Route::get('/reception/queue-stats', [ReceptionController::class, 'queueStats']);
        Route::get('/reception/reasons', [ReceptionController::class, 'reasons']);
    });
    Route::middleware('permission:appointments.check_in')->group(function () {
        Route::post('/appointments/{id}/check-in', [ReceptionController::class, 'checkIn'])->whereNumber('id');
        Route::post('/appointments/{id}/no-show', [ReceptionController::class, 'markNoShow'])->whereNumber('id');
    });
    Route::middleware('permission:appointments.cancel_check_in')->group(function () {
        Route::post('/appointments/{id}/cancel-check-in', [ReceptionController::class, 'cancelCheckIn'])->whereNumber('id');
    });

    // UC5 - Patient profile management.
    Route::middleware('permission:patients.view')->group(function () {
        Route::get('/patients', [PatientController::class, 'index']);
        Route::get('/patients/lookup', [PatientController::class, 'lookup']);
        Route::get('/patients/sources', [PatientController::class, 'sources']);
        Route::post('/patients/duplicate-check', [PatientController::class, 'duplicateCheck']);
        Route::get('/patients/{id}', [PatientController::class, 'show'])->whereNumber('id');
        Route::get('/patients/{id}/history', [PatientController::class, 'history'])->whereNumber('id');
    });

    Route::middleware('permission:patients.create')->group(function () {
        Route::post('/patients', [PatientController::class, 'store']);
    });

    Route::middleware('permission:patients.edit')->group(function () {
        Route::put('/patients/{id}', [PatientController::class, 'update'])->whereNumber('id');
        Route::post('/patients/{id}/deactivate', [PatientController::class, 'deactivate'])->whereNumber('id');
        Route::post('/patients/{id}/reactivate', [PatientController::class, 'reactivate'])->whereNumber('id');
        Route::post('/patients/merge', [PatientController::class, 'merge']);
    });

    // UC12 - Quan ly ho so benh an.
    Route::middleware('permission:dental_records.view')->group(function () {
        Route::get('/medical-records/worklist', [ExaminationController::class, 'worklist']);
        Route::get('/examinations/options', [ExaminationController::class, 'options']);
        Route::get('/examinations/options/services', [ExaminationController::class, 'serviceCatalog']);
        Route::get('/examinations/options/tooth-statuses', [ExaminationController::class, 'toothStatuses']);
        Route::get('/examinations/{id}', [ExaminationController::class, 'show'])->whereNumber('id');
        Route::get('/examinations/{id}/histories', [ExaminationController::class, 'histories'])->whereNumber('id');
        Route::get('/examinations/{id}/tooth-chart', [ExaminationController::class, 'toothChart'])->whereNumber('id');
        Route::get('/patients/{id}/examinations', [ExaminationController::class, 'patientExaminations'])->whereNumber('id');
    });
    Route::middleware('permission:dental_records.create')->group(function () {
        Route::post('/examinations/start', [ExaminationController::class, 'start']);
    });
    Route::middleware('permission:dental_records.edit')->group(function () {
        Route::patch('/examinations/{id}', [ExaminationController::class, 'update'])->whereNumber('id');
        Route::post('/examinations/{id}/save-draft', [ExaminationController::class, 'saveDraft'])->whereNumber('id');
        Route::post('/examinations/{id}/complete', [ExaminationController::class, 'complete'])->whereNumber('id');
        Route::post('/examinations/{id}/recall', [ExaminationController::class, 'recall'])->whereNumber('id');
        Route::post('/examinations/{id}/services', [ExaminationController::class, 'storeServiceItem'])->whereNumber('id');
        Route::patch('/examinations/{id}/services/{itemId}', [ExaminationController::class, 'updateServiceItem'])->whereNumber('id')->whereNumber('itemId');
        Route::delete('/examinations/{id}/services/{itemId}', [ExaminationController::class, 'destroyServiceItem'])->whereNumber('id')->whereNumber('itemId');
        Route::put('/examinations/{id}/tooth-chart', [ExaminationController::class, 'upsertToothChart'])->whereNumber('id');
    });
    Route::middleware('permission:dental_records.lock')->group(function () {
        Route::post('/examinations/{id}/lock', [ExaminationController::class, 'lock'])->whereNumber('id');
    });
    Route::middleware('permission:dental_records.unlock')->group(function () {
        Route::post('/examinations/{id}/unlock', [ExaminationController::class, 'unlock'])->whereNumber('id');
    });

    // UC10 - Quan ly thong bao lich hen.
    Route::middleware('permission:notifications.view')->group(function () {
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::get('/notifications/counts', [NotificationController::class, 'counts']);
        Route::get('/notifications/{id}', [NotificationController::class, 'show'])->whereNumber('id');
    });
    Route::middleware('permission:notifications.resend')->group(function () {
        Route::post('/notifications/{id}/resend', [NotificationController::class, 'resend'])->whereNumber('id');
    });
    Route::middleware('permission:notifications.send_manual')->group(function () {
        Route::post('/notifications', [NotificationController::class, 'store']);
    });
    Route::middleware('permission:notifications.cancel')->group(function () {
        Route::post('/notifications/{id}/cancel', [NotificationController::class, 'cancel'])->whereNumber('id');
    });

    // UC10 - Mau email he thong (admin).
    Route::middleware('permission:notification_templates.view')->group(function () {
        Route::get('/notification-templates', [NotificationTemplateController::class, 'index']);
        Route::get('/notification-templates/{id}', [NotificationTemplateController::class, 'show'])->whereNumber('id');
        Route::post('/notification-templates/{id}/preview', [NotificationTemplateController::class, 'preview'])->whereNumber('id');
    });
    Route::middleware('permission:notification_templates.update')->group(function () {
        Route::put('/notification-templates/{id}', [NotificationTemplateController::class, 'update'])->whereNumber('id');
        Route::patch('/notification-templates/{id}/toggle', [NotificationTemplateController::class, 'toggle'])->whereNumber('id');
    });
});
