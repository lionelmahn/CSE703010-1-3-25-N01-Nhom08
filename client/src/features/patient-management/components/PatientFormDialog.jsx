import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, X } from 'lucide-react';

import { GENDER_OPTIONS, MARITAL_STATUS_OPTIONS, NOTE_MAX_LENGTH } from '../constants';
import { toDateInputValue } from '../utils';
import { validatePatientForm } from '../validation';

/**
 * UC5 - dialog them moi / chinh sua ho so benh nhan.
 *
 * Mac dinh hien thi section co ban; section y te + ghi chu collapse,
 * giong HTML mockup (hai dong "Thong tin y te" / "Ghi chu" co the click mo rong).
 */
const buildInitialValues = (patient) => ({
  full_name: patient?.full_name || '',
  gender: patient?.gender || 'Nam',
  dob: toDateInputValue(patient?.dob),
  phone: patient?.phone || '',
  email: patient?.email || '',
  id_number: patient?.id_number || '',
  address: patient?.address || '',
  source: patient?.source || '',
  occupation: patient?.occupation || '',
  marital_status: patient?.marital_status || '',
  medical_history: patient?.medical_history || '',
  allergies: patient?.allergies || '',
  notes: patient?.notes || '',
  force_create_reason: '',
});

const PatientFormDialog = ({
  open,
  mode = 'create', // create | edit
  patient,
  sources = [],
  submitting = false,
  serverErrors = {},
  duplicateWarning = null,
  onClose,
  onSubmit,
}) => {
  const initial = useMemo(() => buildInitialValues(patient), [patient]);
  const [values, setValues] = useState(initial);
  const [touched, setTouched] = useState({});
  const [showMedical, setShowMedical] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValues(initial);
    setTouched({});
    setShowMedical(false);
    setShowNotes(false);
  }, [open, initial]);

  const { errors: clientErrors } = validatePatientForm(values, { isUpdate: mode === 'edit' });
  const combinedErrors = { ...clientErrors, ...serverErrors };

  if (!open) return null;

  const setField = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    setTouched({
      full_name: true,
      gender: true,
      dob: true,
      phone: true,
      email: true,
      id_number: true,
      source: true,
    });
    const { isValid } = validatePatientForm(values, { isUpdate: mode === 'edit' });
    if (!isValid) return;
    onSubmit?.(values);
  };

  const showError = (key) => (touched[key] || serverErrors?.[key]) && combinedErrors?.[key];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-4 py-2.5 flex justify-between items-center border-b">
          <h2 className="font-semibold text-gray-800 text-sm">
            {mode === 'edit' ? `Chỉnh sửa hồ sơ${patient?.patient_code ? ` (${patient.patient_code})` : ''}` : 'Thêm mới hồ sơ bệnh nhân'}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Đóng">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex-1 overflow-y-auto flex flex-col gap-3 text-[12px]">
          {duplicateWarning && (
            <div className="bg-orange-50 border border-orange-100 text-orange-800 p-2 rounded text-[11px]">
              {duplicateWarning}
            </div>
          )}

          <div className="font-bold text-gray-800 border-b pb-1">Thông tin cơ bản</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-gray-500 mb-1 block">Họ và tên *</label>
              <input
                type="text"
                value={values.full_name}
                onChange={(e) => setField('full_name', e.target.value)}
                placeholder="Nhập họ và tên"
                className="w-full border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {showError('full_name') && <p className="text-[10px] text-red-600 mt-1">{combinedErrors.full_name}</p>}
            </div>

            <div>
              <label className="text-gray-500 mb-1 block">Giới tính *</label>
              <div className="flex gap-3 mt-1.5">
                {GENDER_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value={opt.value}
                      checked={values.gender === opt.value}
                      onChange={(e) => setField('gender', e.target.value)}
                      className="accent-slate-800"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {showError('gender') && <p className="text-[10px] text-red-600 mt-1">{combinedErrors.gender}</p>}
            </div>

            <div>
              <label className="text-gray-500 mb-1 block">Ngày sinh</label>
              <input
                type="date"
                value={values.dob}
                onChange={(e) => setField('dob', e.target.value)}
                className="w-full border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {showError('dob') && <p className="text-[10px] text-red-600 mt-1">{combinedErrors.dob}</p>}
            </div>

            <div>
              <label className="text-gray-500 mb-1 block">Số điện thoại *</label>
              <input
                type="tel"
                value={values.phone}
                onChange={(e) => setField('phone', e.target.value)}
                placeholder="VD: 0901234567"
                className="w-full border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {showError('phone') && <p className="text-[10px] text-red-600 mt-1">{combinedErrors.phone}</p>}
            </div>

            <div>
              <label className="text-gray-500 mb-1 block">Email</label>
              <input
                type="email"
                value={values.email}
                onChange={(e) => setField('email', e.target.value)}
                placeholder="Nhập email"
                className="w-full border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {showError('email') && <p className="text-[10px] text-red-600 mt-1">{combinedErrors.email}</p>}
            </div>

            <div>
              <label className="text-gray-500 mb-1 block">CCCD/CMND</label>
              <input
                type="text"
                value={values.id_number}
                onChange={(e) => setField('id_number', e.target.value)}
                placeholder="9–12 chữ số"
                className="w-full border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {showError('id_number') && <p className="text-[10px] text-red-600 mt-1">{combinedErrors.id_number}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="text-gray-500 mb-1 block">Địa chỉ</label>
              <input
                type="text"
                value={values.address}
                onChange={(e) => setField('address', e.target.value)}
                placeholder="Nhập địa chỉ"
                className="w-full border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-gray-500 mb-1 block">Nguồn tiếp nhận *</label>
              <select
                value={values.source}
                onChange={(e) => setField('source', e.target.value)}
                className="w-full border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              >
                <option value="">Chọn nguồn</option>
                {sources.map((src) => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>
              {showError('source') && <p className="text-[10px] text-red-600 mt-1">{combinedErrors.source}</p>}
            </div>

            <div>
              <label className="text-gray-500 mb-1 block">Nghề nghiệp</label>
              <input
                type="text"
                value={values.occupation}
                onChange={(e) => setField('occupation', e.target.value)}
                className="w-full border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-gray-500 mb-1 block">Tình trạng hôn nhân</label>
              <select
                value={values.marital_status}
                onChange={(e) => setField('marital_status', e.target.value)}
                className="w-full border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              >
                {MARITAL_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowMedical((v) => !v)}
            className="border rounded px-3 py-2 flex justify-between items-center text-gray-700 font-medium hover:bg-gray-50"
          >
            Thông tin y tế <span>{showMedical ? '−' : '+'}</span>
          </button>
          {showMedical && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 -mt-1">
              <div className="sm:col-span-2">
                <label className="text-gray-500 mb-1 block">Tiền sử bệnh lý</label>
                <textarea
                  value={values.medical_history}
                  onChange={(e) => setField('medical_history', e.target.value)}
                  rows={2}
                  className="w-full border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-gray-500 mb-1 block">Dị ứng thuốc</label>
                <textarea
                  value={values.allergies}
                  onChange={(e) => setField('allergies', e.target.value)}
                  rows={2}
                  className="w-full border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowNotes((v) => !v)}
            className="border rounded px-3 py-2 flex justify-between items-center text-gray-700 font-medium hover:bg-gray-50"
          >
            Ghi chú <span>{showNotes ? '−' : '+'}</span>
          </button>
          {showNotes && (
            <div>
              <textarea
                value={values.notes}
                onChange={(e) => setField('notes', e.target.value)}
                rows={3}
                maxLength={NOTE_MAX_LENGTH}
                placeholder="Ghi chú thêm về bệnh nhân"
                className="w-full border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                {values.notes?.length || 0}/{NOTE_MAX_LENGTH} ký tự
              </p>
            </div>
          )}

          {mode === 'create' && (
            <div>
              <label className="text-gray-500 mb-1 block">
                Lý do tạo hồ sơ trùng (chỉ nhập khi đã xác minh trùng)
              </label>
              <input
                type="text"
                value={values.force_create_reason}
                onChange={(e) => setField('force_create_reason', e.target.value)}
                placeholder="Để trống nếu không trùng"
                className="w-full border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Backend sẽ chặn nếu phát hiện trùng và ô này chưa nhập lý do.
              </p>
            </div>
          )}
        </form>

        <div className="p-2.5 border-t flex justify-between bg-gray-50 text-xs">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-1.5 border rounded bg-white hover:bg-gray-100 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-1.5 bg-slate-800 text-white rounded hover:bg-slate-700 font-medium flex items-center gap-1.5 disabled:opacity-50"
          >
            {submitting && <Loader2 size={12} className="animate-spin" />}
            {mode === 'edit' ? 'Lưu thay đổi' : 'Lưu hồ sơ'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientFormDialog;
