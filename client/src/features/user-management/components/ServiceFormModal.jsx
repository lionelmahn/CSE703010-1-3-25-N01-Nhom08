import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Upload, CheckCircle } from 'lucide-react';

const ServiceFormModal = ({ service, onClose, onSuccess }) => {
    const [formData, setFormData] = useState(service ? {
        ...service,
        specialties: service.specialties?.map(s => s.id) || []
    } : {
        service_code: '',
        name: '',
        service_group: 'Điều trị',
        description: '',
        price: '',
        duration_minutes: 30,
        status: 'draft',
        visibility: 'internal',
        specialties: []
    });

    const [allSpecialties, setAllSpecialties] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

    useEffect(() => {
        // Lấy danh sách chuyên môn để hiển thị checkbox
        const fetchSpecialties = async () => {
            try {
                const res = await axios.get(`${API_URL}/specialties`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setAllSpecialties(res.data);
            } catch (err) {
                console.error("Không thể tải danh sách chuyên môn");
            }
        };
        fetchSpecialties();
    }, []);

    const handleSpecialtyChange = (id) => {
        const updated = formData.specialties.includes(id)
            ? formData.specialties.filter(item => item !== id)
            : [...formData.specialties, id];
        setFormData({ ...formData, specialties: updated });
    };

    const handleFileChange = (e) => {
        setSelectedFiles([...e.target.files]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Quy tắc 6: Kiểm tra tại Frontend
        if (formData.status === 'active' && (!formData.price || formData.specialties.length === 0)) {
            setError("Để 'Đang áp dụng', dịch vụ bắt buộc phải có giá và ít nhất 1 chuyên môn.");
            setLoading(false);
            return;
        }

        const data = new FormData();
        // Đưa dữ liệu chữ vào FormData
        Object.keys(formData).forEach(key => {
            if (key === 'specialties') {
                formData.specialties.forEach(id => data.append('specialties[]', id));
            } else {
                data.append(key, formData[key] || '');
            }
        });

        // Đưa file vào FormData
        selectedFiles.forEach(file => {
            data.append('attachments[]', file);
        });

        try {
            const config = {
                headers: { 
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data'
                }
            };

            if (service) {
                data.append('_method', 'PUT'); // Cần thiết khi dùng POST để giả lập PUT gửi kèm file
                await axios.post(`${API_URL}/services/${service.id}`, data, config);
            } else {
                await axios.post(`${API_URL}/services`, data, config);
            }
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || "Lỗi hệ thống, vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl rounded-2xl">
                <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-800">{service ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1 text-sm font-semibold text-gray-700">Mã dịch vụ *</label>
                            <input type="text" required disabled={!!service} value={formData.service_code}
                                onChange={e => setFormData({...formData, service_code: e.target.value})}
                                className="w-full px-3 py-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-semibold text-gray-700">Tên dịch vụ *</label>
                            <input type="text" required value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>

                    <div>
                        <label className="block mb-2 text-sm font-semibold text-gray-700">Chuyên môn yêu cầu (Chọn nhiều) *</label>
                        <div className="grid grid-cols-3 gap-2 p-3 border rounded-lg bg-gray-50">
                            {allSpecialties.map(spec => (
                                <label key={spec.id} className="flex items-center space-x-2 text-sm cursor-pointer hover:text-blue-600">
                                    <input type="checkbox" checked={formData.specialties.includes(spec.id)}
                                        onChange={() => handleSpecialtyChange(spec.id)}
                                        className="w-4 h-4 text-blue-600 rounded" />
                                    <span>{spec.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block mb-1 text-sm font-semibold text-gray-700">Giá (VNĐ)</label>
                            <input type="number" value={formData.price}
                                onChange={e => setFormData({...formData, price: e.target.value})}
                                className="w-full px-3 py-2 border rounded-lg" placeholder="0" />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-semibold text-gray-700">Thời gian (phút)</label>
                            <input type="number" value={formData.duration_minutes}
                                onChange={e => setFormData({...formData, duration_minutes: e.target.value})}
                                className="w-full px-3 py-2 border rounded-lg" />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-semibold text-gray-700">Trạng thái</label>
                            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
                                className="w-full px-3 py-2 border rounded-lg">
                                <option value="draft">Bản nháp</option>
                                <option value="active">Đang áp dụng</option>
                                <option value="inactive">Ngừng áp dụng</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block mb-2 text-sm font-semibold text-gray-700">Hình ảnh & Tài liệu đính kèm</label>
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-3 text-gray-400" />
                                    <p className="text-sm text-gray-500">Bấm để tải lên nhiều file</p>
                                </div>
                                <input type="file" multiple onChange={handleFileChange} className="hidden" />
                            </label>
                        </div>
                        {selectedFiles.length > 0 && (
                            <div className="mt-2 text-xs text-blue-600 font-medium">Đã chọn {selectedFiles.length} file</div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button type="button" onClick={onClose} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-xl">Hủy</button>
                        <button type="submit" disabled={loading} className="px-8 py-2 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:bg-blue-300">
                            {loading ? 'Đang lưu...' : 'Lưu dịch vụ'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ServiceFormModal;