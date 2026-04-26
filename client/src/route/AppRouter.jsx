import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

// Layout
import MainLayout from '@/layout/MainLayout';

// Public Pages
import Login from '@/page/Login';
import ForgotPassword from '@/page/ForgotPassword';

// Dashboard Pages
import AdminDashboard from '@/page/AdminDashboard';
import DoctorDashboard from '@/page/DoctorDashboard';
import StaffDashboard from '@/page/StaffDashboard';
import AccountantDashboard from '@/page/AccountantDashboard';
import PatientDashboard from '@/page/PatientDashboard';

// Feature Pages
import UserManagement from '@/page/UserManagement';
import PermissionManagement from '@/page/PermissionManagement';
import StaffManagement from '@/page/StaffManagement';
import SystemSettings from '@/page/SystemSettings';
import PatientList from '@/page/PatientList';
import Appointments from '@/page/Appointments';
import MedicalRecords from '@/page/MedicalRecords';
import InvoiceManagement from '@/page/InvoiceManagement';
import RevenueReport from '@/page/RevenueReport';
import MyAppointments from '@/page/MyAppointments';
import HealthRecords from '@/page/HealthRecords';
import ServiceManagement from '@/page/ServiceManagement'; 

// Component bảo vệ route
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
};

// Component bảo vệ dựa trên phân quyền
const PermissionRoute = ({ permission, children }) => {
  const { hasPermission, userRole } = useAuth();
  
  if (userRole === 'admin') return children; // Admin luôn có quyền truy cập
  
  if (permission && !hasPermission(permission)) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="p-10 text-center font-medium text-red-500 bg-red-50 rounded-2xl border border-red-100">
          <p className="text-lg font-bold">Truy cập bị từ chối!</p>
          <p className="text-sm text-gray-600 mt-2">Bạn không có quyền quản trị để thực hiện chức năng này.</p>
        </div>
      </div>
    );
  }
  return children;
};

// Chọn dashboard theo vai trò
const DashboardByRole = () => {
  const { userRole } = useAuth();
  switch (userRole) {
    case 'admin': return <AdminDashboard />;
    case 'bac_si': return <DoctorDashboard />;
    case 'le_tan': return <StaffDashboard />;
    case 'ke_toan': return <AccountantDashboard />;
    case 'benh_nhan': return <PatientDashboard />;
    default: return <div className="p-10 text-center font-medium">Bạn không có quyền truy cập hệ thống.</div>;
  }
};

const AppRouter = () => {
  const { isLoggedIn } = useAuth();

  return (
    <Routes>
      {/* 1. Public Routes */}
      <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* 2. Protected Routes — Bọc trong MainLayout */}
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardByRole />} />

        {/* --- NHÓM ADMIN (CHỈ ADMIN MỚI VÀO ĐƯỢC) --- */}
        {/* Minh lưu ý: Trang Dịch vụ đã được đưa về đúng vị trí dành cho Quản trị viên */}
        <Route path="services" element={<PermissionRoute permission="services.view"><ServiceManagement /></PermissionRoute>} />
        
        <Route path="users" element={<PermissionRoute permission="users.view"><UserManagement /></PermissionRoute>} />
        <Route path="permissions" element={<PermissionRoute><PermissionManagement /></PermissionRoute>} />
        <Route path="staff" element={<PermissionRoute permission="staff.view"><StaffManagement /></PermissionRoute>} />
        <Route path="settings" element={<PermissionRoute><SystemSettings /></PermissionRoute>} />

        {/* --- NHÓM DÙNG CHUNG (Theo mã quyền cụ thể) --- */}
        <Route path="patients" element={<PermissionRoute permission="patients.view"><PatientList /></PermissionRoute>} />
        <Route path="appointments" element={<PermissionRoute permission="appointments.view"><Appointments /></PermissionRoute>} />
        <Route path="medical-records" element={<PermissionRoute permission="dental_records.view"><MedicalRecords /></PermissionRoute>} />

        {/* --- NHÓM KẾ TOÁN --- */}
        <Route path="invoices" element={<PermissionRoute permission="finance.view"><InvoiceManagement /></PermissionRoute>} />
        <Route path="revenue" element={<PermissionRoute permission="reports.view"><RevenueReport /></PermissionRoute>} />

        {/* --- NHÓM BỆNH NHÂN --- */}
        <Route path="my-appointments" element={<MyAppointments />} />
        <Route path="health-records" element={<HealthRecords />} />
      </Route>

      {/* 3. Catch-all */}
      <Route path="*" element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
};

export default AppRouter;