import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Filter, Package } from 'lucide-react';
import ServicePackageFormModal from '@/features/user-management/components/ServicePackageFormModal';
import { useAuth } from '@/hooks/useAuth';

const ServicePackageManagement = () => {
    const [packages, setPackages] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPackage, setCurrentPackage] = useState(null);
    const [filterStatus, setFilterStatus] = useState('');
    
    const { userRole } = useAuth();
    const isAdmin = userRole === 'admin';
    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

    useEffect(() => { fetchPackages(); }, []);

    const fetchPackages = async () => {
        try {
            const res = await axios.get(`${API_URL}/service-packages`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setPackages(res.data);
        } catch (error) { console.error("Lỗi lấy danh sách gói", error); }
    };

    const handleDelete = async (pkg) => {
        if (!isAdmin) return;
        const isDraft = pkg.status === 'draft';
        const msg = isDraft ? "XÓA VĨNH VIỄN gói nháp này?" : "Chuyển gói này sang 'Ngừng áp dụng'?";
        
        if (window.confirm(msg)) {
            try {
                await axios.delete(`${API_URL}/service-packages/${pkg.id}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                fetchPackages();
            } catch (error) { console.error("Lỗi xóa gói", error); }
        }
    };

    const filtered = packages.filter(p => filterStatus === '' || p.status === filterStatus);

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Package size={24}/></div>
                    <h1 className="text-2xl font-extrabold text-gray-800">Quản lý Gói Dịch vụ (Combo)</h1>
                </div>
                {isAdmin && (
                    <button onClick={() => { setCurrentPackage(null); setIsModalOpen(true); }}
                        className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all flex items-center gap-2 shadow-lg">
                        <Plus size={20} /> Thiết lập gói mới
                    </button>
                )}
            </div>

            <div className="mb-6 flex gap-3 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <Filter size={18} className="text-slate-400" />
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                    className="border-none bg-transparent font-bold text-slate-600 outline-none cursor-pointer">
                    <option value="">Tất cả trạng thái</option>
                    <option value="active">Đang áp dụng</option>
                    <option value="draft">Bản nháp</option>
                    <option value="inactive">Ngừng áp dụng</option>
                </select>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Mã Gói</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Tên Gói</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Giá Gói (Giảm giá)</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Dịch vụ thành phần</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Trạng thái</th>
                            {isAdmin && <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase text-center">Thao tác</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map((pkg) => (
                            <tr key={pkg.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-mono font-bold text-blue-600">{pkg.package_code}</td>
                                <td className="px-6 py-4 font-bold text-slate-800">{pkg.name}</td>
                                <td className="px-6 py-4">
                                    <div className="font-black text-teal-600">{parseInt(pkg.package_price).toLocaleString()}đ</div>
                                    <div className="text-[10px] text-slate-400 line-through">Gốc: {parseInt(pkg.original_price).toLocaleString()}đ</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {pkg.services?.map(s => (
                                            <span key={s.id} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                                                {s.name} x{s.pivot.quantity}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full border ${
                                        pkg.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 
                                        pkg.status === 'draft' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'
                                    }`}>
                                        {pkg.status === 'active' ? 'Đang áp dụng' : pkg.status === 'draft' ? 'Bản nháp' : 'Ngừng hoạt động'}
                                    </span>
                                </td>
                                {isAdmin && (
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => { setCurrentPackage(pkg); setIsModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit size={18}/></button>
                                            <button onClick={() => handleDelete(pkg)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18}/></button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <ServicePackageFormModal 
                    packageData={currentPackage} 
                    onClose={() => setIsModalOpen(false)} 
                    onSuccess={() => { setIsModalOpen(false); fetchPackages(); }} 
                />
            )}
        </div>
    );
};

export default ServicePackageManagement;