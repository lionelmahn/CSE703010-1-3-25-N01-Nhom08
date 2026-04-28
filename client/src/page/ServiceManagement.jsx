import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Filter } from 'lucide-react';
import ServiceFormModal from '@/features/user-management/components/ServiceFormModal';
import { useAuth } from '@/hooks/useAuth';

const ServiceManagement = () => {
    const [services, setServices] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentService, setCurrentService] = useState(null);
    const [filterStatus, setFilterStatus] = useState('');
    
    const { userRole } = useAuth();
    const isAdmin = userRole === 'admin';
    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

    useEffect(() => { fetchServices(); }, []);

    const fetchServices = async () => {
        try {
            const response = await axios.get(`${API_URL}/services`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setServices(response.data);
        } catch (error) { console.error("Lỗi lấy danh sách", error); }
    };

    const handleDelete = async (service) => {
        if (!isAdmin) return;
        
        const isDraft = service.status === 'draft';
        const confirmMsg = isDraft 
            ? "XÁC NHẬN: Bạn muốn XÓA VĨNH VIỄN bản nháp này khỏi hệ thống?" 
            : "THÔNG BÁO (E6): Dịch vụ này sẽ chuyển sang trạng thái 'Ngừng áp dụng', không thể xóa vật lý. Đồng ý?";

        if (window.confirm(confirmMsg)) {
            try {
                await axios.delete(`${API_URL}/services/${service.id}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                fetchServices();
            } catch (error) { console.error("Lỗi khi xóa", error); }
        }
    };

    const filteredServices = services.filter(s => filterStatus === '' || s.status === filterStatus);

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Quản lý Dịch vụ Nha khoa</h1>
                {isAdmin && (
                    <button onClick={() => { setCurrentService(null); setIsModalOpen(true); }}
                        className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-md transition-all">
                        <Plus size={18} className="mr-2" /> Thêm dịch vụ
                    </button>
                )}
            </div>

            <div className="mb-4 flex items-center gap-2">
                <Filter size={18} className="text-gray-500" />
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                    className="border rounded-md px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Tất cả trạng thái</option>
                    <option value="active">Đang áp dụng</option>
                    <option value="draft">Bản nháp</option>
                    <option value="inactive">Ngừng áp dụng</option>
                </select>
            </div>

            <div className="overflow-hidden bg-white rounded-xl shadow-sm border border-gray-100">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Mã DV</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Tên dịch vụ</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Giá tiền</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Trạng thái</th>
                            {isAdmin && <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center">Thao tác</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredServices.map((service) => (
                            <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-mono text-sm font-bold text-teal-600">{service.service_code}</td>
                                <td className="px-6 py-4 text-gray-700 font-medium">{service.name}</td>
                                <td className="px-6 py-4 font-semibold text-blue-600">
                                    {service.price ? parseInt(service.price).toLocaleString() + ' đ' : 'Chưa có giá'}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full border ${
                                        service.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 
                                        service.status === 'draft' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                                        'bg-red-50 text-red-700 border-red-200'
                                    }`}>
                                        {service.status === 'active' ? '● Đang áp dụng' : 
                                         service.status === 'draft' ? '○ Bản nháp' : 'x Ngừng áp dụng'}
                                    </span>
                                </td>
                                {isAdmin && (
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-3">
                                            <button onClick={() => { setCurrentService(service); setIsModalOpen(true); }} className="text-blue-500 hover:text-blue-700 transition-colors"><Edit size={18} /></button>
                                            <button onClick={() => handleDelete(service)} className="text-red-500 hover:text-red-700 transition-colors"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && isAdmin && (
                <ServiceFormModal service={currentService} onClose={() => setIsModalOpen(false)} 
                    onSuccess={() => { setIsModalOpen(false); fetchServices(); }} />
            )}
        </div>
    );
};

export default ServiceManagement;