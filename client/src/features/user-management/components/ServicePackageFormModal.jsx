import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Plus, Minus, Search, CheckCircle2, AlertCircle } from 'lucide-react';

const ServicePackageFormModal = ({ packageData, onClose, onSuccess }) => {
    const [allServices, setAllServices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState(packageData ? {
        ...packageData,
        selectedServices: packageData.services?.map(s => ({
            service_id: s.id,
            name: s.name,
            price: s.price,
            quantity: s.pivot.quantity
        })) || []
    } : {
        name: '',
        description: '',
        package_price: '',
        status: 'draft',
        selectedServices: []
    });

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const res = await axios.get(`${API_URL}/services`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                // Chỉ lấy dịch vụ đang hoạt động
                setAllServices(res.data.filter(s => s.status === 'active'));
            } catch (err) { console.error("Lỗi lấy dịch vụ", err); }
        };
        fetchServices();
    }, []);

    // Tính toán tổng giá gốc tự động
    const totalOriginalPrice = formData.selectedServices.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const toggleService = (service) => {
        const exists = formData.selectedServices.find(s => s.service_id === service.id);
        if (exists) {
            setFormData({ ...formData, selectedServices: formData.selectedServices.filter(s => s.service_id !== service.id) });
        } else {
            setFormData({ 
                ...formData, 
                selectedServices: [...formData.selectedServices, { service_id: service.id, name: service.name, price: service.price, quantity: 1 }] 
            });
        }
    };

    const updateQty = (id, delta) => {
        const updated = formData.selectedServices.map(s => {
            if (s.service_id === id) {
                const newQty = Math.max(1, s.quantity + delta);
                return { ...s, quantity: newQty };
            }
            return s;
        });
        setFormData({ ...formData, selectedServices: updated });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.status === 'active') {
            if (formData.selectedServices.length === 0) {
                setError("Gói dịch vụ phải có ít nhất 1 dịch vụ thành phần.");
                setLoading(false); return;
            }
            if (!formData.package_price || formData.package_price <= 0) {
                setError("Vui lòng nhập giá bán cho gói.");
                setLoading(false); return;
            }
        }

        const payload = {
            name: formData.name,
            description: formData.description,
            package_price: formData.package_price,
            status: formData.status,
            services: formData.selectedServices // Backend sẽ nhận mảng objects này
        };

        try {
            const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
            if (packageData) {
                await axios.put(`${API_URL}/service-packages/${packageData.id}`, payload, config);
            } else {
                await axios.post(`${API_URL}/service-packages`, payload, config);
            }
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || "Lỗi lưu dữ liệu.");
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex h-[90vh]">
                
                {/* Cột trái: Chọn dịch vụ */}
                <div className="w-1/2 border-r border-slate-100 flex flex-col bg-slate-50/50">
                    <div className="p-6 border-b bg-white">
                        <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-4">Chọn dịch vụ lẻ</h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                            <input type="text" placeholder="Tìm tên dịch vụ..." 
                                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-3">
                        {allServices.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(service => {
                            const isSelected = formData.selectedServices.find(s => s.service_id === service.id);
                            return (
                                <div key={service.id} onClick={() => toggleService(service)}
                                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center bg-white shadow-sm
                                    ${isSelected ? 'border-blue-600 ring-4 ring-blue-500/5' : 'border-transparent hover:border-slate-200'}`}>
                                    <div>
                                        <div className="font-bold text-slate-800 text-sm">{service.name}</div>
                                        <div className="text-xs text-blue-600 font-black">{parseInt(service.price).toLocaleString()}đ</div>
                                    </div>
                                    {isSelected && <CheckCircle2 className="text-blue-600" size={20}/>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Cột phải: Thông tin gói */}
                <div className="w-1/2 flex flex-col bg-white">
                    <div className="p-6 border-b flex justify-between items-center">
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Thiết lập gói combo</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all"><X size={24}/></button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
                        {error && <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-xs font-bold flex items-center gap-2"><AlertCircle size={16}/> {error}</div>}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Tên gói dịch vụ *</label>
                                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 font-bold" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Giá bán gói (VNĐ) *</label>
                                    <input type="number" required value={formData.package_price} onChange={e => setFormData({...formData, package_price: e.target.value})}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:border-teal-500 font-black text-teal-600" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Tổng giá gốc (Dự kiến)</label>
                                    <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-400">{totalOriginalPrice.toLocaleString()}đ</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Danh sách thành phần ({formData.selectedServices.length})</h3>
                            {formData.selectedServices.length === 0 ? (
                                <div className="py-10 text-center text-slate-300 italic text-sm font-medium">Chưa có dịch vụ nào được chọn</div>
                            ) : (
                                formData.selectedServices.map(item => (
                                    <div key={item.service_id} className="flex items-center justify-between p-3 bg-blue-50/50 rounded-2xl border border-blue-100">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-slate-800 truncate">{item.name}</div>
                                            <div className="text-[10px] text-blue-500 font-bold">{parseInt(item.price).toLocaleString()}đ/lượt</div>
                                        </div>
                                        <div className="flex items-center gap-3 bg-white p-1 rounded-xl shadow-sm border border-blue-100">
                                            <button type="button" onClick={() => updateQty(item.service_id, -1)} className="p-1 text-slate-400 hover:text-blue-600"><Minus size={14}/></button>
                                            <span className="text-xs font-black w-4 text-center text-blue-600">{item.quantity}</span>
                                            <button type="button" onClick={() => updateQty(item.service_id, 1)} className="p-1 text-slate-400 hover:text-blue-600"><Plus size={14}/></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Trạng thái</label>
                                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none font-bold bg-white">
                                    <option value="draft">📁 Lưu bản nháp</option>
                                    <option value="active">✅ Đang áp dụng</option>
                                    <option value="inactive">🚫 Ngừng hoạt động</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6">
                            <button type="button" onClick={onClose} className="px-6 py-3 text-slate-400 font-bold hover:bg-slate-50 rounded-2xl transition-all">Hủy bỏ</button>
                            <button type="submit" disabled={loading} className="px-10 py-3 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95">
                                {loading ? 'Đang lưu...' : (packageData ? 'Cập nhật gói' : 'Khởi tạo gói')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ServicePackageFormModal;