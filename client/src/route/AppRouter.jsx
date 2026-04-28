import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

import MainLayout from '@/layout/MainLayout';

import Login from '@/page/Login';
import ForgotPassword from '@/page/ForgotPassword';

// Dashboard Pages (theo vai trò)
import AdminDashboard from '@/page/AdminDashboard';
import DoctorDashboard from '@/page/DoctorDashboard';
import StaffDashboard from '@/page/StaffDashboard';
import AccountantDashboard from '@/page/AccountantDashboard';
import PatientDashboard from '@/page/PatientDashboard';

// Feature Pages
import UserManagement from '@/page/UserManagement';
import PermissionManagement from '@/page/PermissionManagement';
import StaffManagement from '@/page/StaffManagement';
import ProfessionalProfileManagement from '@/page/ProfessionalProfileManagement';
import SystemSettings from '@/page/SystemSettings';
import PatientList from '@/page/PatientList';
import Appointments from '@/page/Appointments';
import MedicalRecords from '@/page/MedicalRecords';
import InvoiceManagement from '@/page/InvoiceManagement';
import RevenueReport from '@/page/RevenueReport';
import MyAppointments from '@/page/MyAppointments';
import HealthRecords from '@/page/HealthRecords';

// --- ĐÃ THÊM IMPORT CÒN THIẾU ---
import MyProfessionalProfile from '@/page/MyProfessionalProfile'; 
import ServiceManagement from '@/page/ServiceManagement';

// Component bảo vệ route — chuyển hướng về login nếu chưa đăng nhập
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
};

// Component bảo vệ dựa trên phân quyền (ĐÃ NÂNG CẤP ĐỂ HIỂU "ROLES")
const PermissionRoute = ({ permission, roles, children }) => {
  const { hasPermission, userRole, isLoggedIn } = useAuth();
  
  // Chống crash màn hình trắng khi chưa load xong userRole
  if (isLoggedIn && userRole === undefined) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-teal-500"></div>
        <p className="mt-4 text-slate-500 font-medium italic">Đang xác thực quyền...</p>
      </div>
    );
  }

  if (userRole === 'admin') return children; // Admin qua hết
  
  // --- MỞ KHÓA THEO VAI TRÒ (DÀNH CHO BÁC SĨ, KẾ TOÁN) ---
  if (roles && roles.includes(userRole)) return children;

  if (permission && hasPermission && hasPermission(permission)) return children;

  // Trả về dấu "!" nếu không đủ quyền
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] bg-white m-6 rounded-3xl border border-slate-100 shadow-sm">
      <div className="p-10 text-center font-medium">
        <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-red-500 text-3xl font-bold">!</span>
        </div>
        <p className="text-lg font-bold text-red-500">Truy cập bị từ chối!</p>
        <p className="text-sm text-gray-500 mt-2">Bạn không có quyền truy cập chức năng này.</p>
      </div>
    </div>
  );
};

// Component chọn dashboard theo vai trò
const DashboardByRole = () => {
  const { userRole } = useAuth();
  if (!userRole) return null;
  
  switch (userRole) {
    case 'admin':
      return <AdminDashboard />;
    case 'bac_si':
      return <DoctorDashboard />;
    case 'le_tan':
      return <StaffDashboard />;
    case 'ke_toan':
      return <AccountantDashboard />;
    case 'benh_nhan':
      return <PatientDashboard />;
    default:
      return <div className="p-10 text-center font-medium">Bạn không có quyền truy cập hệ thống.</div>;
  }
};

const AppRouter = () => {
  const { isLoggedIn } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected Routes — Bọc trong MainLayout */}
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardByRole />} />

        {/* --- UC 4.1: QUẢN LÝ DỊCH VỤ --- */}
        <Route 
          path="services" 
          element={
            <PermissionRoute roles={['admin', 'bac_si', 'ke_toan']} permission="services.view">
              <ServiceManagement />
            </PermissionRoute>
          } 
        />

        {/* Admin Routes */}
        <Route path="users" element={<PermissionRoute permission="users.view"><UserManagement /></PermissionRoute>} />
        <Route path="permissions" element={<PermissionRoute><PermissionManagement /></PermissionRoute>} />
        <Route path="staff" element={<PermissionRoute permission="staff.view"><StaffManagement /></PermissionRoute>} />
        <Route path="professional-profiles" element={<PermissionRoute permission="professional_profiles.view"><ProfessionalProfileManagement /></PermissionRoute>} />
        <Route path="settings" element={<PermissionRoute><SystemSettings /></PermissionRoute>} />

        {/* Shared Routes */}
        <Route path="patients" element={<PermissionRoute permission="patients.view"><PatientList /></PermissionRoute>} />
        <Route path="appointments" element={<PermissionRoute permission="appointments.view"><Appointments /></PermissionRoute>} />
        <Route path="medical-records" element={<PermissionRoute permission="dental_records.view"><MedicalRecords /></PermissionRoute>} />

        {/* Kế toán Routes */}
        <Route path="invoices" element={<PermissionRoute permission="finance.view"><InvoiceManagement /></PermissionRoute>} />
        <Route path="revenue" element={<PermissionRoute permission="reports.view"><RevenueReport /></PermissionRoute>} />
        <Route path="my-professional-profile" element={<MyProfessionalProfile />} />

        {/* Bệnh nhân Routes */}
        <Route path="my-appointments" element={<MyAppointments />} />
        <Route path="health-records" element={<HealthRecords />} />
      </Route>

      {/* Catch-all — Redirect */}
      <Route path="*" element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
};

export default AppRouter;