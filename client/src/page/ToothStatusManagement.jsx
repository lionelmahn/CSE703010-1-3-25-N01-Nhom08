import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Edit, Trash2, Check, X, ShieldCheck, 
  Activity, Info, AlertTriangle, Stethoscope, Palette, Search 
} from 'lucide-react'; // ĐẢM BẢO ĐÃ IMPORT ĐỦ ICON
import { useAuth } from '@/hooks/useAuth';

const ToothStatusManagement = () => {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  
  const [statuses, setStatuses] = useState([]); // Khởi tạo mảng rỗng để tránh lỗi .map
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    status_code: '', name: '', status_group: 'normal', color_code: '#34d399', icon: 'tooth-normal', description: ''
  });

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

  // Danh sách Icon mô phỏng hình trạng thái răng (E4)
  const iconOptions = [
    { id: 'tooth-normal', icon: <Activity size={20}/>, label: 'Bình thường' },
    { id: 'tooth-decay', icon: <AlertTriangle size={20} className="text-red-500"/>, label: 'Sâu răng' },
    { id: 'tooth-missing', icon: <X size={20} className="text-slate-400"/>, label: 'Mất răng' },
    { id: 'tooth-filled', icon: <ShieldCheck size={20} className="text-teal-500"/>, label: 'Đã trám' },
  ];

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    try {
      const res = await axios.get(`${API_URL}/tooth-statuses`, config);
      // Kiểm tra nếu res.data là mảng thì mới set, nếu không set mảng rỗng
      setStatuses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Lỗi API:", err);
      setStatuses([]); // Tránh sập trang khi lỗi API
    }
  };

  const handleOpenModal = (status = null) => {
    if (status) {
      setFormData(status);
      setEditingId(status.id);
    } else {
      setFormData({ status_code: '', name: '', status_group: 'normal', color_code: '#34d399', icon: 'tooth-normal', description: '' });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/tooth-statuses/${editingId}`, formData, config);
      } else {
        await axios.post(`${API_URL}/tooth-statuses`, formData, config);
      }
      setIsModalOpen(false);
      fetchStatuses();
      alert("Xử lý thành công!");
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi. Vui lòng kiểm tra mã trùng.");
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-teal-500 text-white rounded-2xl shadow-lg"><Stethoscope size={24}/></div>
          <div>
            <h1 className="text-2xl font-black uppercase italic text-slate-800">Trạng thái răng</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Master Data Management • UC 4.4</p>
          </div>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-black transition-all active:scale-95">
          {isAdmin ? 'BAN HÀNH MỚI' : 'GỬI ĐỀ XUẤT'}
        </button>
      </div>

      {/* Danh sách */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statuses && statuses.map(s => (
          <div key={s.id} className={`bg-white p-6 rounded-[2.5rem] border-2 shadow-sm transition-all ${s.approval_status === 'pending' ? 'border-amber-200 bg-amber-50/20' : 'border-slate-50'}`}>
            <div className="flex justify-between items-start mb-6">
              {/* Hình trạng thái (E4) */}
              <div className="w-16 h-16 rounded-2xl shadow-inner border-4 border-white flex items-center justify-center" style={{backgroundColor: s.color_code}}>
                {iconOptions.find(i => i.id === s.icon)?.icon || <Activity size={24} className="text-white"/>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${s.approval_status === 'approved' ? 'bg-teal-100 text-teal-600' : 'bg-amber-100 text-amber-600'}`}>
                  {s.approval_status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
                </span>
                {!s.is_active && <span className="text-[9px] font-black text-red-500 uppercase">Ngừng sử dụng</span>}
              </div>
            </div>
            <h3 className="font-black text-slate-800 uppercase text-lg leading-tight mb-1">{s.name}</h3>
            <p className="text-[10px] font-mono font-bold text-slate-400 mb-6 uppercase tracking-tighter">Mã: {s.status_code}</p>
            
            {isAdmin && s.approval_status === 'pending' && (
              <div className="flex gap-2 pt-4 border-t">
                <button onClick={() => axios.put(`${API_URL}/tooth-statuses/${s.id}/approve`, {action: 'approve'}, config).then(fetchStatuses)} className="flex-1 bg-teal-500 text-white py-2 rounded-xl font-black text-[10px] hover:bg-teal-600">DUYỆT</button>
                <button onClick={() => axios.put(`${API_URL}/tooth-statuses/${s.id}/approve`, {action: 'reject'}, config).then(fetchStatuses)} className="flex-1 bg-red-100 text-red-500 py-2 rounded-xl font-black text-[10px] hover:bg-red-200">LOẠI</button>
              </div>
            )}
          </div>
        ))}
        {statuses.length === 0 && <div className="col-span-full text-center py-20 font-bold text-slate-400 italic uppercase">Chưa có dữ liệu trạng thái nào được thiết lập</div>}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <h2 className="font-black uppercase italic tracking-tighter">{editingId ? 'Cập nhật' : (isAdmin ? 'Ban hành' : 'Đề xuất')}</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={24}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase ml-2">Chọn Hình biểu diễn (E4)</label>
                <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                  {iconOptions.map(opt => (
                    <button key={opt.id} type="button" onClick={() => setFormData({...formData, icon: opt.id})} className={`p-3 rounded-xl border-2 flex justify-center transition-all ${formData.icon === opt.id ? 'border-teal-500 bg-white' : 'border-transparent opacity-40'}`}>
                      {opt.icon}
                    </button>
                  ))}
                </div>
              </div>
              <input placeholder="MÃ (VD: RANG_SAU)" required value={formData.status_code} onChange={e => setFormData({...formData, status_code: e.target.value.toUpperCase()})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-black text-sm outline-none focus:ring-2 ring-teal-500" />
              <input placeholder="TÊN TRẠNG THÁI" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 ring-teal-500" />
              <div className="grid grid-cols-2 gap-4">
                <select value={formData.status_group} onChange={e => setFormData({...formData, status_group: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-black text-xs outline-none focus:ring-2 ring-teal-500">
                  <option value="normal">Bình thường</option>
                  <option value="pathology">Bệnh lý</option>
                  <option value="treated">Đã điều trị</option>
                  <option value="monitored">Cần theo dõi</option>
                  <option value="missing">Mất răng</option>
                </select>
                <input type="color" value={formData.color_code} onChange={e => setFormData({...formData, color_code: e.target.value})} className="w-full h-14 bg-white border-none rounded-2xl cursor-pointer" />
              </div>
              <button type="submit" className="w-full py-5 bg-teal-500 text-white font-black rounded-[2rem] shadow-xl uppercase italic active:scale-95 transition-all">LƯU VÀO HỆ THỐNG</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToothStatusManagement;