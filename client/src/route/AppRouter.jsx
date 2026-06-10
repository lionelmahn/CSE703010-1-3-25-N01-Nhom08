import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

import AppLayout from '@/components/layout/AppLayout';

import Login from '@/page/Login';
import ForgotPassword from '@/page/ForgotPassword';
import LandingPage from '@/page/LandingPage';
import BookingPage from '@/page/BookingPage';

import AdminDashboard from '@/page/AdminDashboard';
import DoctorDashboard from '@/page/DoctorDashboard';
import StaffDashboard from '@/page/StaffDashboard';
import AccountantDashboard from '@/page/AccountantDashboard';
import PatientDashboard from '@/page/PatientDashboard';

import UserManagement from '@/page/UserManagement';
import PermissionManagement from '@/page/PermissionManagement';
import StaffManagement from '@/page/StaffManagement';
import ProfessionalProfileManagement from '@/page/ProfessionalProfileManagement';
import ServiceCatalogManagement from '@/page/ServiceCatalogManagement';
import ServicePackageManagement from '@/page/ServicePackageManagement';
import ServicePriceManagement from '@/page/ServicePriceManagement';
import HourlyRateSettings from '@/page/HourlyRateSettings';
import ShiftCoefficientSettings from '@/page/ShiftCoefficientSettings';
import ServiceComplexitySettings from '@/page/ServiceComplexitySettings';
import DoctorQualificationCoefficientSettings from '@/page/DoctorQualificationCoefficientSettings';
import SalarySlipManagement from '@/page/SalarySlipManagement';
import ToothStatusManagement from '@/page/ToothStatusManagement';
import SystemSettings from '@/page/SystemSettings';
import PatientList from '@/page/PatientList';
import Appointments from '@/page/Appointments';
import DoctorDispatch from '@/page/DoctorDispatch';
import MedicalRecords from '@/page/MedicalRecords';
import MedicalRecordsWorkspace from '@/page/MedicalRecordsWorkspace';
import InvoiceManagement from '@/page/InvoiceManagement';
import RevenueReport from '@/page/RevenueReport';
import SalaryReport from '@/page/SalaryReport';
import SalaryAnnualReport from '@/page/SalaryAnnualReport';
import MyAppointments from '@/page/MyAppointments';
import HealthRecords from '@/page/HealthRecords';
import MyProfessionalProfile from '@/page/MyProfessionalProfile';
import WorkScheduleManagement from '@/page/WorkScheduleManagement';
import MyWorkSchedule from '@/page/MyWorkSchedule';
import OnlineBookingManagement from '@/page/OnlineBookingManagement';
import Notifications from '@/page/Notifications';
import NotificationTemplates from '@/page/NotificationTemplates';
import Reception from '@/page/Reception';

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
};

const PermissionRoute = ({ permission, children }) => {
  const { hasPermission, userRole } = useAuth();

  if (userRole === 'admin') return children;
  // `permission` co the la 1 slug hoac mang slug (chi can khop 1 - any-of).
  const allowed = Array.isArray(permission)
    ? permission.some((p) => hasPermission(p))
    : !permission || hasPermission(permission);
  if (!allowed) {
    return <div className="p-10 text-center font-medium text-red-500">Ban khong co quyen truy cap trang nay.</div>;
  }
  return children;
};

const DashboardByRole = () => {
  const { userRole } = useAuth();
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
      return <div className="p-10 text-center font-medium">Ban khong co quyen truy cap he thong.</div>;
  }
};

const AppRouter = () => {
  const { isLoggedIn } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/booking" element={<BookingPage />} />

      <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<DashboardByRole />} />

        <Route path="users" element={<PermissionRoute permission="users.view"><UserManagement /></PermissionRoute>} />
        <Route path="permissions" element={<PermissionRoute><PermissionManagement /></PermissionRoute>} />
        <Route path="staff" element={<PermissionRoute permission="staff.view"><StaffManagement /></PermissionRoute>} />
        <Route path="professional-profiles" element={<PermissionRoute permission="professional_profiles.view"><ProfessionalProfileManagement /></PermissionRoute>} />
        <Route path="services" element={<PermissionRoute permission="services.view"><ServiceCatalogManagement /></PermissionRoute>} />
        <Route path="service-packages" element={<PermissionRoute permission="packages.view"><ServicePackageManagement /></PermissionRoute>} />
        <Route path="service-prices" element={<PermissionRoute permission="prices.view"><ServicePriceManagement /></PermissionRoute>} />
        <Route path="tooth-statuses" element={<PermissionRoute permission="tooth_statuses.view"><ToothStatusManagement /></PermissionRoute>} />
        <Route path="settings" element={<PermissionRoute><SystemSettings /></PermissionRoute>} />

        <Route path="patients" element={<PermissionRoute permission="patients.view"><PatientList /></PermissionRoute>} />
        <Route path="appointments" element={<PermissionRoute permission="appointments.view"><Appointments /></PermissionRoute>} />
        <Route path="doctor-dispatch" element={<PermissionRoute permission="appointments.assign"><DoctorDispatch /></PermissionRoute>} />
        <Route path="reception" element={<PermissionRoute permission="appointments.view"><Reception /></PermissionRoute>} />
        <Route path="online-bookings" element={<PermissionRoute permission="appointments.view"><OnlineBookingManagement /></PermissionRoute>} />
        <Route path="notifications" element={<PermissionRoute permission="notifications.view"><Notifications /></PermissionRoute>} />
        <Route path="notification-templates" element={<PermissionRoute permission="notification_templates.view"><NotificationTemplates /></PermissionRoute>} />
        <Route path="medical-records" element={<PermissionRoute permission="dental_records.view"><MedicalRecords /></PermissionRoute>} />
        <Route path="medical-records/:examinationId/workspace" element={<PermissionRoute permission="dental_records.view"><MedicalRecordsWorkspace /></PermissionRoute>} />

        <Route path="invoices" element={<PermissionRoute permission="invoices.view"><InvoiceManagement /></PermissionRoute>} />
        <Route path="invoices/:id" element={<PermissionRoute permission="invoices.view"><InvoiceManagement /></PermissionRoute>} />
        <Route path="revenue" element={<PermissionRoute permission="reports.view"><RevenueReport /></PermissionRoute>} />
        <Route path="payroll/settings/hourly-rate" element={<PermissionRoute permission="payroll.hourly_rate.view"><HourlyRateSettings /></PermissionRoute>} />
        <Route path="payroll/settings/shift-coefficients" element={<PermissionRoute permission="payroll.shift_coefficient.view"><ShiftCoefficientSettings /></PermissionRoute>} />
        <Route path="payroll/settings/service-complexity" element={<PermissionRoute permission="payroll.service_complexity.view"><ServiceComplexitySettings /></PermissionRoute>} />
        <Route path="payroll/settings/doctor-qualification-coefficients" element={<PermissionRoute permission="payroll.doctor_qualification_coefficient.view"><DoctorQualificationCoefficientSettings /></PermissionRoute>} />
        <Route path="payroll/salary-slips" element={<PermissionRoute permission="payroll.salary_slip.view"><SalarySlipManagement /></PermissionRoute>} />
        <Route path="payroll/salary-report" element={<PermissionRoute permission="payroll.salary_report.view"><SalaryReport /></PermissionRoute>} />
        <Route path="payroll/salary-annual-report" element={<PermissionRoute permission={['payroll.salary_report_annual.view', 'payroll.salary_report_annual.view_own']}><SalaryAnnualReport /></PermissionRoute>} />
        <Route path="my-professional-profile" element={<MyProfessionalProfile />} />
        <Route path="work-schedules" element={<PermissionRoute permission="schedules.view"><WorkScheduleManagement /></PermissionRoute>} />
        <Route path="my-work-schedule" element={<MyWorkSchedule />} />

        <Route path="my-appointments" element={<MyAppointments />} />
        <Route path="health-records" element={<HealthRecords />} />
      </Route>

      <Route path="*" element={<Navigate to={isLoggedIn ? '/dashboard' : '/'} replace />} />
    </Routes>
  );
};

export default AppRouter;
