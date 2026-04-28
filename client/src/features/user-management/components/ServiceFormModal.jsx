import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Upload, Info, CheckCircle2, ShieldCheck } from 'lucide-react';

const ServiceFormModal = ({ service, onClose, onSuccess }) => {
    const [formData, setFormData] = useState(service ? {
        ...service,
        specialties: service.specialties?.map(s => s.id) || []
    } : {
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
        // Lấy danh sách chuyên môn thật từ Database
        const fetchSpecialties = async () => {
            try {
                const res = await axios.get(`${API_URL}/specialties`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setAllSpecialties(res.data);
            } catch (err) {
                console.error("Lỗi lấy danh sách chuyên môn:", err);
                // Fallback nếu API lỗi để Minh vẫn có cái test giao diện
                setAllSpecialties([
                    { id: 1, name: 'Răng sứ thẩm mỹ' },
                    { id: 2, name: 'Niềng răng - Chỉnh nha' },
                    { id: 3, name: 'Cấy ghép Implant' },
                    { id: 4, name: 'Điều trị nội nha' }
                ]);
            }
        };
        fetchSpecialties();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Kiểm tra Quy tắc E6 trước khi gửi
        if (formData.status === 'active' && (!formData.price || formData.specialties.length === 0)) {
            setError("Để ở trạng thái 'Đang áp dụng', bạn bắt buộc phải nhập Giá và chọn ít nhất 1 Chuyên môn.");
            setLoading(false);
            return;
        }

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (key === 'specialties') {
                formData.specialties.forEach(id => data.append('specialties[]', id));
            } else if (key === 'attachments') {
                return; // Không gửi lại mảng file cũ ở định dạng này
            } else {
                data.append(key, formData[key] || '');
            }
        });

        selectedFiles.forEach(file => data.append('attachments[]', file));

        try {
            const config = {
                headers: { 
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data'
                }
            };

            if (service) {
                data.append('_method', 'PUT'); // Cần thiết để Laravel nhận diện file trong method PUT
                await axios.post(`${API_URL}/services/${service.id}`, data, config);
            } else {
                await axios.post(`${API_URL}/services`, data, config);
            }
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || "Lỗi lưu dữ liệu. Vui lòng kiểm tra lại Backend.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                
                {/* Modal Header */}
                <div className="px-8 py-5 border-b flex justify-between items-center bg-white">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-800">
                            {service ? 'Cập nhật dịch vụ' : 'Thiết lập dịch vụ mới'}
                        </h2>
                        <p className="text-sm text-slate-500 font-medium">Cấu hình danh mục và chuyên môn nha khoa</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl">
                            <Info size={20} />
                            <span className="text-sm font-bold">{error}</span>
                        </div>
                    )}

                    {/* Section 1: Định danh */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                            <h3 className="font-bold text-slate-700 uppercase tracking-wider text-xs">Thông tin cơ bản</h3>
                        </div>
                        <div className="grid grid-cols-12 gap-5">
                            <div className="col-span-4">
                                <label className="block text-sm font-bold text-slate-600 mb-1.5">Mã dịch vụ</label>
                                <input type="text" disabled value={service ? formData.service_code : "Hệ thống tự sinh"}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-blue-700 font-bold italic" />
                            </div>
                            <div className="col-span-8">
                                <label className="block text-sm font-bold text-slate-600 mb-1.5">Tên dịch vụ hiển thị *</label>
                                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium" 
                                    placeholder="Ví dụ: Nhổ răng khôn hàm dưới" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1.5">Nhóm dịch vụ chính *</label>
                                <select value={formData.service_group} onChange={e => setFormData({...formData, service_group: e.target.value})}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none bg-white font-medium">
                                    <option value="Khám tổng quát">Khám tổng quát & Tư vấn</option>
                                    <option value="Điều trị">Điều trị nội nha</option>
                                    <option value="Thẩm mỹ">Nha khoa thẩm mỹ</option>
                                    <option value="Nhổ răng">Tiểu phẫu - Nhổ răng</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1.5">Đơn giá (VNĐ)</label>
                                <div className="relative">
                                    <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}
                                        className="w-full pl-4 pr-12 py-2.5 border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-blue-600" />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">VND</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Chuyên môn (Layout Cards như ảnh) */}
                    <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-6 bg-teal-500 rounded-full"></div>
                            <h3 className="font-bold text-slate-700 uppercase tracking-wider text-xs">Chuyên môn yêu cầu *</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {allSpecialties.map(spec => (
                                <label key={spec.id} 
                                    className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer shadow-sm
                                    ${formData.specialties.includes(spec.id) ? 'bg-white border-teal-500 ring-4 ring-teal-500/5' : 'bg-white border-transparent hover:border-slate-200'}`}>
                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all
                                        ${formData.specialties.includes(spec.id) ? 'bg-teal-500 border-teal-500' : 'bg-slate-100 border-slate-200'}`}>
                                        {formData.specialties.includes(spec.id) && <CheckCircle2 size={14} className="text-white" />}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={formData.specialties.includes(spec.id)}
                                        onChange={() => {
                                            const specs = formData.specialties.includes(spec.id)
                                                ? formData.specialties.filter(id => id !== spec.id)
                                                : [...formData.specialties, spec.id];
                                            setFormData({...formData, specialties: specs});
                                        }} />
                                    <span className={`text-sm font-bold ${formData.specialties.includes(spec.id) ? 'text-slate-800' : 'text-slate-500'}`}>
                                        {spec.name}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Section 3: Cấu hình vận hành */}
                    <div className="grid grid-cols-3 gap-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-1.5">Thời gian thực hiện</label>
                            <div className="relative">
                                <input type="number" value={formData.duration_minutes} onChange={e => setFormData({...formData, duration_minutes: e.target.value})}
                                    className="w-full pl-4 pr-12 py-2.5 border border-slate-300 rounded-xl focus:border-blue-500 outline-none" />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs uppercase">Phút</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-1.5">Trạng thái</label>
                            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl outline-none focus:border-blue-500 font-bold bg-white">
                                <option value="draft">📁 Bản nháp</option>
                                <option value="active">✅ Đang áp dụng</option>
                                <option value="inactive">🚫 Ngừng áp dụng</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-1.5">Hiển thị</label>
                            <select value={formData.visibility} onChange={e => setFormData({...formData, visibility: e.target.value})}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl outline-none focus:border-blue-500 font-bold bg-white">
                                <option value="internal">🔒 Nội bộ</option>
                                <option value="public">🌐 Công khai</option>
                            </select>
                        </div>
                    </div>

                    {/* Section 4: Tài liệu & Mô tả */}
                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-1.5">Mô tả chi tiết kỹ thuật</label>
                        <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-2xl outline-none focus:border-blue-500 h-24 resize-none transition-all"
                            placeholder="Nhập thông tin mô tả về dịch vụ..." />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">Hình ảnh & Hồ sơ đính kèm</label>
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-3xl cursor-pointer bg-slate-50 hover:bg-blue-50 hover:border-blue-400 transition-all group">
                            <div className="flex flex-col items-center justify-center py-5">
                                <Upload className="w-8 h-8 mb-2 text-slate-400 group-hover:text-blue-500 group-hover:scale-110 transition-all" />
                                <p className="text-sm text-slate-600 font-bold">Kéo thả hoặc nhấn để tải lên</p>
                                <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-tighter">Hỗ trợ JPG, PNG, PDF (Max 5MB)</p>
                            </div>
                            <input type="file" multiple onChange={e => setSelectedFiles([...e.target.files])} className="hidden" />
                        </label>
                        {selectedFiles.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {selectedFiles.map((f, i) => (
                                    <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-extrabold uppercase">
                                        {f.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Form Footer */}
                    <div className="flex justify-end gap-4 pt-6 border-t">
                        <button type="button" onClick={onClose} 
                            className="px-8 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-all">
                            Hủy bỏ
                        </button>
                        <button type="submit" disabled={loading} 
                            className="px-12 py-3 bg-slate-800 text-white font-extrabold rounded-2xl hover:bg-slate-900 disabled:bg-slate-300 shadow-xl transition-all transform active:scale-95">
                            {loading ? 'Đang xử lý...' : (service ? 'Cập nhật dịch vụ' : 'Lưu dịch vụ')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ServiceFormModal;