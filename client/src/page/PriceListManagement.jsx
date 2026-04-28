import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { History, Plus, AlertCircle, CheckCircle2, Clock, X, ShieldCheck, Check, Ban, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const PriceListManagement = () => {
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState(null);
    const [priceHistory, setPriceHistory] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form trạng thái
    const [newPrice, setNewPrice] = useState('');
    const [applyType, setApplyType] = useState('now');
    const [effectiveFrom, setEffectiveFrom] = useState('');
    const [note, setNote] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { userRole } = useAuth();
    const isAdmin = userRole === 'admin';
    const isKeToan = userRole === 'ke_toan';
    const isLeTan = userRole === 'le_tan';
    
    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

    useEffect(() => { fetchServices(); }, []);

    const fetchServices = async () => {
        try {
            const res = await axios.get(`${API_URL}/price-list`, config);
            setServices(res.data);
        } catch (err) { console.error("Lỗi lấy danh sách", err); }
    };

    const handleOpenHistory = async (service) => {
        setSelectedService(service);
        try {
            const res = await axios.get(`${API_URL}/price-list/${service.id}/history`, config);
            setPriceHistory(res.data);
            setIsModalOpen(true);
            setNewPrice(''); setApplyType('now'); setEffectiveFrom(''); setNote(''); setError('');
        } catch (err) { console.error("Lỗi lấy lịch sử", err); }
    };

    // Thao tác 1: Gửi mức giá (Admin ban hành hoặc Kế toán đề xuất)
    const handleSubmitPrice = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await axios.post(`${API_URL}/price-list`, {
                service_id: selectedService.id,
                price: newPrice,
                apply_type: applyType,
                effective_from: applyType === 'future' ? effectiveFrom : null,
                note: note
            }, config);
            
            fetchServices();
            handleOpenHistory(selectedService); 
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi lưu giá.');
        } finally { setLoading(false); }
    };

    // Thao tác 2: Admin Phê duyệt hoặc Từ chối (Dành cho Admin)
    const handleApprove = async (id, action) => {
        if (!window.confirm(`Xác nhận ${action === 'approve' ? 'PHÊ DUYỆT' : 'TỪ CHỐI'} mức giá này?`)) return;
        try {
            await axios.put(`${API_URL}/price-list/${id}/approve`, { action }, config);
            fetchServices();
            handleOpenHistory(selectedService);
        } catch (err) { alert("Lỗi xử lý phê duyệt"); }
    };

    return (
        <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-teal-100 text-teal-600 rounded-lg"><FileText size={24}/></div>
                <h1 className="text-2xl font-extrabold text-slate-800">Bảng giá Dịch vụ Nha khoa</h1>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Dịch vụ</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Giá hiện tại</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Thời gian áp dụng</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase text-center">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {services.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-16 text-center bg-slate-50/30">
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <FileText size={48} className="text-slate-300" />
                                        <p className="font-black text-lg text-slate-500">Chưa có dịch vụ nào trong hệ thống</p>
                                        <p className="text-sm text-slate-400 max-w-md">Vui lòng chuyển sang menu <span className="font-bold">"Quản lý dịch vụ"</span> để tạo dịch vụ mới. Hệ thống sẽ tự động đồng bộ danh sách sang đây để bạn thiết lập giá.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            services.map(service => (
                                <tr key={service.id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800">{service.name}</div>
                                        <div className="text-[10px] font-mono text-slate-400">{service.service_code}</div>
                                    </td>
                                    <td className="px-6 py-4 font-black text-teal-600">
                                        {service.current_price ? parseInt(service.current_price.price).toLocaleString() + 'đ' : '---'}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                                        {service.current_price ? new Date(service.current_price.effective_from).toLocaleDateString('vi-VN') : 'Chưa có'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button onClick={() => handleOpenHistory(service)} 
                                            className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all text-xs flex items-center gap-2 mx-auto">
                                            <History size={14} /> {isAdmin || isKeToan ? 'Cập nhật / Lịch sử' : 'Xem lịch sử giá'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Lịch sử & Thêm giá - Được gộp luôn vào file này */}
            {isModalOpen && selectedService && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex h-[85vh]">
                        
                        {/* PHẦN 1: LỊCH SỬ GIÁ (Ai cũng xem được) */}
                        <div className={`flex flex-col bg-slate-50/50 ${isAdmin || isKeToan ? 'w-2/3' : 'w-full'}`}>
                            <div className="p-6 border-b bg-white flex justify-between items-center">
                                <div>
                                    <h3 className="font-black text-slate-800 uppercase text-sm">Dòng thời gian bảng giá</h3>
                                    <p className="text-xs font-bold text-teal-600">{selectedService.name}</p>
                                </div>
                                {!isAdmin && !isKeToan && <button onClick={() => setIsModalOpen(false)}><X/></button>}
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 space-y-4">
                                {priceHistory.length === 0 ? (
                                    <div className="text-center text-slate-400 italic py-10">Chưa có lịch sử giá nào cho dịch vụ này.</div>
                                ) : (
                                    priceHistory.map((ph) => (
                                        <div key={ph.id} className={`p-5 rounded-2xl border-2 flex justify-between items-center bg-white shadow-sm ${
                                            ph.status === 'pending' ? 'border-amber-200' : ph.status === 'approved' ? 'border-teal-100' : 'border-red-100 opacity-60'
                                        }`}>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-xl text-slate-800">{parseInt(ph.price).toLocaleString()}đ</span>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                                        ph.status === 'pending' ? 'bg-amber-100 text-amber-700' : ph.status === 'approved' ? 'bg-teal-100 text-teal-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {ph.status === 'pending' ? 'Chờ duyệt' : ph.status === 'approved' ? 'Đang áp dụng' : 'Bị từ chối'}
                                                    </span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-bold">Áp dụng từ: {new Date(ph.effective_from).toLocaleString('vi-VN')}</div>
                                                {ph.note && <div className="text-xs italic text-slate-500">"{ph.note}"</div>}
                                            </div>

                                            {/* Nút Phê duyệt (Chỉ Admin thấy ở dòng Chờ duyệt) */}
                                            {isAdmin && ph.status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleApprove(ph.id, 'approve')} className="p-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600" title="Phê duyệt"><Check size={18}/></button>
                                                    <button onClick={() => handleApprove(ph.id, 'reject')} className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600" title="Từ chối"><Ban size={18}/></button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* PHẦN 2: FORM THAY ĐỔI (Chỉ Admin & Kế toán thấy) */}
                        {(isAdmin || isKeToan) && (
                            <div className="w-1/3 flex flex-col bg-white border-l">
                                <div className="p-6 border-b flex justify-between items-center">
                                    <h2 className="text-lg font-black text-slate-800 uppercase italic">
                                        {isAdmin ? '📌 Thiết lập giá' : '📝 Đề xuất giá'}
                                    </h2>
                                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X/></button>
                                </div>
                                <form onSubmit={handleSubmitPrice} className="p-6 space-y-5">
                                    {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold flex items-center gap-2"><AlertCircle size={14}/> {error}</div>}
                                    
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Mức giá mới *</label>
                                        <input type="number" required value={newPrice} onChange={e => setNewPrice(e.target.value)}
                                            className="w-full px-4 py-3 border rounded-xl font-black text-teal-600 text-lg outline-none focus:border-teal-500" placeholder="VD: 500000" />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Hình thức áp dụng</label>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                                                <input type="radio" checked={applyType === 'now'} onChange={() => setApplyType('now')} /> Áp dụng ngay
                                            </label>
                                            <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                                                <input type="radio" checked={applyType === 'future'} onChange={() => setApplyType('future')} /> Lên lịch tương lai
                                            </label>
                                        </div>
                                    </div>

                                    {applyType === 'future' && (
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Ngày giờ bắt đầu</label>
                                            <input type="datetime-local" required value={effectiveFrom} onChange={e => setEffectiveFrom(e.target.value)}
                                                className="w-full px-4 py-2 border rounded-xl font-bold outline-none focus:border-teal-500" />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Lý do điều chỉnh (Tùy chọn)</label>
                                        <textarea value={note} onChange={e => setNote(e.target.value)} className="w-full px-4 py-2 border rounded-xl text-sm outline-none focus:border-teal-500" rows="3" placeholder="Nhập ghi chú..."></textarea>
                                    </div>

                                    <button type="submit" disabled={loading} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-lg active:scale-95">
                                        {loading ? 'Đang xử lý...' : isAdmin ? 'BAN HÀNH GIÁ MỚI' : 'GỬI ĐỀ XUẤT DUYỆT'}
                                    </button>

                                    <div className="mt-4 p-4 bg-blue-50 rounded-2xl flex gap-3 italic">
                                        <ShieldCheck className="text-blue-500 shrink-0" size={18}/>
                                        <p className="text-[10px] text-blue-600 font-medium">
                                            {isAdmin ? 'Quyền Admin: Giá sẽ có hiệu lực ngay sau khi bấm ban hành.' : 'Quyền Kế toán: Giá sẽ được chuyển trạng thái "Chờ duyệt" để Admin phê duyệt.'}
                                        </p>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PriceListManagement;