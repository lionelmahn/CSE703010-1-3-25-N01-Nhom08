import {
  Bell,
  BriefcaseMedical,
  Calendar,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  FileText,
  Inbox,
  LayoutDashboard,
  Mail,
  Settings,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  UserCog,
  Users,
} from 'lucide-react';

/**
 * Single source of truth for the authenticated sidebar.
 *
 * Each item:
 *   - label                : visible text
 *   - path                 : matches a route declared in src/route/AppRouter.jsx
 *   - icon                 : lucide-react component
 *   - roles                : list of roles allowed to see the item
 *   - requiredPermissions  : optional list of permission slugs (any match grants access)
 *   - badge                : optional key into the badge map passed by the layout
 *
 * Groups are declared separately so the sidebar can render section titles
 * and reorder/relabel groups without touching individual items.
 */

export const SIDEBAR_GROUPS = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'appointments', label: 'Lịch hẹn & Tiếp nhận' },
  { id: 'patients', label: 'Bệnh nhân & Hồ sơ' },
  { id: 'schedules', label: 'Lịch làm việc' },
  { id: 'services', label: 'Dịch vụ & Bảng giá' },
  { id: 'finance', label: 'Tài chính' },
  { id: 'staff', label: 'Nhân sự' },
  { id: 'system', label: 'Hệ thống' },
];

export const SIDEBAR_ITEMS = [
  // -- Tổng quan --------------------------------------------------------------
  {
    label: 'Tổng quan',
    path: '/dashboard',
    icon: LayoutDashboard,
    group: 'overview',
    roles: ['admin', 'bac_si', 'le_tan', 'ke_toan', 'benh_nhan'],
  },

  // -- Lịch hẹn & Tiếp nhận ---------------------------------------------------
  {
    label: 'Lịch hẹn phòng khám',
    path: '/appointments',
    icon: Calendar,
    group: 'appointments',
    roles: ['admin', 'bac_si', 'le_tan'],
    requiredPermissions: ['appointments.view'],
  },
  {
    label: 'Yêu cầu đặt lịch online',
    path: '/online-bookings',
    icon: Inbox,
    group: 'appointments',
    roles: ['admin', 'le_tan'],
    requiredPermissions: ['appointments.view'],
    badge: 'pending_online_bookings',
  },
  {
    label: 'Điều phối bác sĩ',
    path: '/doctor-dispatch',
    icon: Stethoscope,
    group: 'appointments',
    roles: ['admin', 'le_tan'],
    requiredPermissions: ['appointments.assign'],
  },
  {
    label: 'Tiếp nhận / Check-in',
    path: '/reception',
    icon: ClipboardCheck,
    group: 'appointments',
    roles: ['admin', 'le_tan'],
    requiredPermissions: ['appointments.view'],
  },
  {
    label: 'Thông báo lịch hẹn',
    path: '/notifications',
    icon: Bell,
    group: 'appointments',
    roles: ['admin', 'le_tan'],
    requiredPermissions: ['notifications.view'],
  },
  {
    label: 'Lịch hẹn của tôi',
    path: '/my-appointments',
    icon: Calendar,
    group: 'appointments',
    roles: ['benh_nhan'],
  },

  // -- Bệnh nhân & Hồ sơ ------------------------------------------------------
  {
    label: 'Danh sách bệnh nhân',
    path: '/patients',
    icon: Users,
    group: 'patients',
    roles: ['admin', 'bac_si', 'le_tan'],
    requiredPermissions: ['patients.view'],
  },
  {
    label: 'Quản lý bệnh án',
    path: '/medical-records',
    icon: ClipboardList,
    group: 'patients',
    roles: ['admin', 'bac_si'],
    requiredPermissions: ['dental_records.view'],
  },
  {
    label: 'Hồ sơ sức khỏe',
    path: '/health-records',
    icon: ClipboardList,
    group: 'patients',
    roles: ['benh_nhan'],
  },

  // -- Lịch làm việc ----------------------------------------------------------
  {
    label: 'Lịch làm việc',
    path: '/work-schedules',
    icon: Calendar,
    group: 'schedules',
    roles: ['admin'],
    requiredPermissions: ['schedules.view'],
  },
  {
    label: 'Lịch làm việc của tôi',
    path: '/my-work-schedule',
    icon: Calendar,
    group: 'schedules',
    roles: ['bac_si', 'le_tan', 'ke_toan'],
  },

  // -- Dịch vụ & Bảng giá -----------------------------------------------------
  {
    label: 'Dịch vụ nha khoa',
    path: '/services',
    icon: BriefcaseMedical,
    group: 'services',
    roles: ['admin', 'bac_si', 'le_tan', 'ke_toan', 'benh_nhan'],
    requiredPermissions: ['services.view'],
  },
  {
    label: 'Gói dịch vụ',
    path: '/service-packages',
    icon: ClipboardList,
    group: 'services',
    roles: ['admin', 'bac_si', 'le_tan', 'ke_toan', 'benh_nhan'],
    requiredPermissions: ['packages.view'],
  },
  {
    label: 'Bảng giá dịch vụ',
    path: '/service-prices',
    icon: CreditCard,
    group: 'services',
    roles: ['admin', 'bac_si', 'le_tan', 'ke_toan'],
    requiredPermissions: ['prices.view'],
  },
  {
    label: 'Trạng thái răng',
    path: '/tooth-statuses',
    icon: ClipboardList,
    group: 'services',
    roles: ['admin', 'bac_si', 'le_tan', 'ke_toan'],
    requiredPermissions: ['tooth_statuses.view'],
  },

  // -- Tài chính --------------------------------------------------------------
  {
    label: 'Thanh toán hóa đơn',
    path: '/invoices',
    icon: FileText,
    group: 'finance',
    roles: ['admin', 'ke_toan', 'le_tan'],
    requiredPermissions: ['invoices.view'],
  },
  {
    label: 'Báo cáo doanh thu',
    path: '/revenue',
    icon: TrendingUp,
    group: 'finance',
    roles: ['admin', 'ke_toan'],
    requiredPermissions: ['reports.view'],
  },

  // -- Nhân sự ----------------------------------------------------------------
  {
    label: 'Quản lý nhân sự',
    path: '/staff',
    icon: Users,
    group: 'staff',
    roles: ['admin'],
    requiredPermissions: ['staff.view'],
  },
  {
    label: 'Hồ sơ chuyên môn',
    path: '/professional-profiles',
    icon: BriefcaseMedical,
    group: 'staff',
    roles: ['admin'],
    requiredPermissions: ['professional_profiles.view'],
  },
  {
    label: 'Hồ sơ chuyên môn của tôi',
    path: '/my-professional-profile',
    icon: BriefcaseMedical,
    group: 'staff',
    roles: ['bac_si', 'ke_toan'],
  },

  // -- Hệ thống ---------------------------------------------------------------
  {
    label: 'Quản lý tài khoản',
    path: '/users',
    icon: UserCog,
    group: 'system',
    roles: ['admin'],
    requiredPermissions: ['users.view'],
  },
  {
    label: 'Phân quyền',
    path: '/permissions',
    icon: ShieldCheck,
    group: 'system',
    roles: ['admin'],
    requiredPermissions: ['users.view'],
  },
  {
    label: 'Mẫu email',
    path: '/notification-templates',
    icon: Mail,
    group: 'system',
    roles: ['admin'],
    requiredPermissions: ['notification_templates.view'],
  },
  {
    label: 'Cài đặt hệ thống',
    path: '/settings',
    icon: Settings,
    group: 'system',
    roles: ['admin'],
  },
];

/**
 * Filter sidebar items by current user role + permissions.
 * Mirrors the existing rule in MainLayout: admin sees everything;
 * for other roles, either the role matches OR any required permission matches.
 */
export const getVisibleSidebarItems = ({ userRole, hasPermission }) => {
  if (!userRole) return [];
  if (userRole === 'admin') return SIDEBAR_ITEMS;

  return SIDEBAR_ITEMS.filter((item) => {
    const roleMatches = item.roles?.includes(userRole);
    const permissionMatches = item.requiredPermissions?.some((p) =>
      typeof hasPermission === 'function' ? hasPermission(p) : false,
    );
    return roleMatches || permissionMatches;
  });
};

/**
 * Group already-filtered items by their `group` id, preserving the
 * order declared in SIDEBAR_GROUPS and skipping empty groups.
 */
export const groupSidebarItems = (items) => {
  return SIDEBAR_GROUPS
    .map((group) => ({
      ...group,
      items: items.filter((item) => item.group === group.id),
    }))
    .filter((group) => group.items.length > 0);
};

/**
 * Flat map of `path -> item` used by the breadcrumb / page-title resolver.
 */
export const SIDEBAR_ITEMS_BY_PATH = SIDEBAR_ITEMS.reduce((acc, item) => {
  acc[item.path] = item;
  return acc;
}, {});
