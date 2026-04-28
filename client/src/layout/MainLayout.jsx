import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Bell,
  BriefcaseMedical,
  Calendar,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';

const MainLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { userRole, userName, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  const roleNames = {
    admin: 'Quản trị viên',
    bac_si: 'Bác sĩ chuyên khoa',
    le_tan: 'Bộ phận Lễ tân',
    ke_toan: 'Kế toán',
    benh_nhan: 'Bệnh nhân',
  };

  const allMenuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Tổng quan', path: '/dashboard', roles: ['admin', 'bac_si', 'le_tan', 'ke_toan', 'benh_nhan'] },
    
    // Nhóm Admin Only
    { icon: <ShieldCheck size={20} />, label: 'Quản lý tài khoản', path: '/users', roles: ['admin'] },
    { icon: <ShieldCheck size={20} />, label: 'Phân quyền hệ thống', path: '/permissions', roles: ['admin'] },
    { icon: <Users size={20} />, label: 'Quản lý nhân sự', path: '/staff', roles: ['admin'] },
    
    // Nhóm Nghiệp vụ - ĐÃ BỎ permission Ở DỊCH VỤ ĐỂ HIỆN LÊN CHO BÁC SĨ/KẾ TOÁN
    { icon: <BriefcaseMedical size={20} />, label: 'Quản lý dịch vụ', path: '/services', roles: ['admin', 'bac_si', 'ke_toan'] },
    { icon: <ClipboardList size={20} />, label: 'Quản lý gói dịch vụ', path: '/service-packages', roles: ['admin', 'ke_toan', 'bac_si', 'le_tan'] },
    
    { icon: <Calendar size={20} />, label: 'Lịch hẹn', path: '/appointments', roles: ['admin', 'bac_si', 'le_tan'], permission: 'appointments.view' },
    { icon: <Users size={20} />, label: 'Danh sách bệnh nhân', path: '/patients', roles: ['admin', 'bac_si', 'le_tan'], permission: 'patients.view' },
    { icon: <ClipboardList size={20} />, label: 'Hồ sơ bệnh án', path: '/medical-records', roles: ['admin', 'bac_si'], permission: 'dental_records.view' },
    
    // Nhóm Tài chính
    { icon: <FileText size={20} />, label: 'Hóa đơn', path: '/invoices', roles: ['admin', 'ke_toan'], permission: 'finance.view' },
    { icon: <TrendingUp size={20} />, label: 'Báo cáo doanh thu', path: '/revenue', roles: ['admin', 'ke_toan'], permission: 'reports.view' },
  ];

  // Logic lọc Menu: Ưu tiên lọc theo Role trước
  const authorizedMenus = allMenuItems.filter(item => {
    // 1. Kiểm tra Role: Nếu role hiện tại không có trong mảng roles của item thì ẩn luôn
    const isRoleAllowed = item.roles.includes(userRole);
    if (!isRoleAllowed) return false;

    // 2. Nếu là Admin thì cho qua hết các mục đã khớp Role ở trên
    if (userRole === 'admin') return true;

    // 3. Nếu mục đó có yêu cầu quyền (permission) cụ thể, kiểm tra tiếp quyền
    if (item.permission) {
      return hasPermission(item.permission);
    }
    
    // 4. Nếu không yêu cầu permission (như mục Tổng quan, Dịch vụ), chỉ cần khớp Role là cho hiện
    return true;
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-20'} bg-slate-900 transition-all duration-300 flex flex-col shadow-2xl z-30`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          {isSidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                <BriefcaseMedical className="text-white" size={20} />
              </div>
              <span className="text-white font-black text-xl tracking-tighter">DENTAL<span className="text-teal-400">PRO</span></span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-slate-400 hover:text-white transition-colors">
            {isSidebarOpen ? <X size={20} /> : <Menu size={24} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {authorizedMenus.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group
                ${isActive ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
              `}
            >
              <div className={`${isSidebarOpen ? '' : 'mx-auto'}`}>{item.icon}</div>
              {isSidebarOpen && <span className="font-bold text-sm tracking-wide">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-4 w-full px-4 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all duration-200 group">
            <LogOut size={20} className="group-hover:rotate-180 transition-transform duration-500" />
            {isSidebarOpen && <span className="font-bold text-sm">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-20">
          <div className="flex items-center gap-4 flex-1">
            {isSidebarOpen && (
              <div className="relative w-full max-w-md hidden md:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Tìm kiếm nhanh..." className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none text-sm transition-all" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            <button className="relative text-slate-500 hover:text-teal-600 transition-colors">
              <Bell size={22} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold border-2 border-white">3</span>
            </button>
            <div className="flex items-center gap-3 border-l pl-6 border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">{userName || 'Người dùng'}</p>
                <p className="text-xs font-medium text-teal-600">{roleNames[userRole] || 'Người dùng'}</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-full border-2 border-teal-500 flex items-center justify-center text-teal-700 font-bold">
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto bg-slate-50/50 p-8 custom-scrollbar">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default MainLayout;