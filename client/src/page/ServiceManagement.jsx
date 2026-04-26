import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Filter } from 'lucide-react';
import ServiceFormModal from '@/features/user-management/components/ServiceFormModal';

const ServiceManagement = () => {
    const [services, setServices] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentService, setCurrentService] = useState(null);
    const [filterStatus, setFilterStatus] = useState('');

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const response = await axios.get(`${API_URL}/services`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setServices(response.data);
        } catch (error) {
            console.error("Lỗi lấy danh sách", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Quy tắc E6: Bạn chỉ có thể ngừng áp dụng, không thể xóa vật lý. Đồng ý?")) {
            try {
                await axios.delete(`${API_URL}/services/${id}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                fetchServices();
            } catch (error) {
                alert("Lỗi khi đổi trạng thái.");
            }
        }
    };

    const filteredServices = services.filter(s => filterStatus === '' || s.status === filterStatus);

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Quản lý Dịch vụ Nha khoa</h1>
                <button 
                    onClick={() => { setCurrentService(null); setIsModalOpen(true); }}
                    className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                    <Plus size={18} className="mr-2" /> Thêm dịch vụ
                </button>
            </div>

            <div className="flex gap-4 p-4 mb-6 bg-white rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-500" />
                    <select 
                        value={filterStatus} 
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-400"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="active">Đang áp dụng</option>
                        <option value="draft">Bản nháp</option>
                        <option value="inactive">Ngừng áp dụng</option>
                    </select>
                </div>
            </div>

            <div className="overflow-hidden bg-white rounded-lg shadow">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Mã DV</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tên dịch vụ</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Giá tiền</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredServices.map((service) => (
                            <tr key={service.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium">{service.service_code}</td>
                                <td className="px-6 py-4 text-gray-600">{service.name}</td>
                                <td className="px-6 py-4 font-semibold text-blue-600">
                                    {service.price ? parseInt(service.price).toLocaleString() + ' đ' : '---'}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        service.status === 'active' ? 'bg-green-100 text-green-700' : 
                                        service.status === 'draft' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                        {service.status === 'active' ? 'Đang áp dụng' : service.status === 'draft' ? 'Bản nháp' : 'Ngừng áp dụng'}
                                    </span>
                                </td>
                                <td className="flex justify-center gap-3 px-6 py-4">
                                    <button onClick={() => { setCurrentService(service); setIsModalOpen(true); }} className="text-blue-500 hover:text-blue-700"><Edit size={18} /></button>
                                    <button onClick={() => handleDelete(service.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <ServiceFormModal 
                    service={currentService} 
                    onClose={() => setIsModalOpen(false)} 
                    onSuccess={() => { setIsModalOpen(false); fetchServices(); }}
                />
            )}
        </div>
    );
};

export default ServiceManagement;