import React, { useEffect, useRef, useState } from 'react';
import { Loader2, UserPlus } from 'lucide-react';

import { usePatientLookup } from '../hooks/usePatientLookup';
import { PATIENT_TABS } from '../constants';
import { validateNewPatient } from '../validation';
import { formatPhone, getBranchLabel } from '../utils';
import { CLINIC_BRANCHES } from '@/features/online-booking/data';

const PatientCard = ({ patient, isLinked, isSelected, onSelect, disabled }) => (
  <label
    className={`block rounded-lg p-3 cursor-pointer transition ${
      isSelected ? 'border-2 border-blue-500 bg-blue-50/30' : 'border border-gray-200 hover:bg-gray-50'
    } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
  >
    <div className="flex gap-3">
      <input
        type="radio"
        name="patient"
        className="mt-1 accent-blue-600"
        checked={isSelected}
        disabled={disabled}
        onChange={() => !disabled && onSelect(patient.id)}
      />
      <div className="flex-1 text-[11px] min-w-0">
        <div className="flex justify-between items-start mb-1 gap-2">
          <div className="font-bold text-gray-900 truncate">{patient.code}</div>
          {patient.active ? (
            <span className="bg-green-100 text-green-700 text-[9px] px-1.5 py-0.5 rounded shrink-0">Hoat dong</span>
          ) : (
            <span className="bg-gray-200 text-gray-600 text-[9px] px-1.5 py-0.5 rounded shrink-0">Ngung h.dong</span>
          )}
        </div>
        <div className="font-medium text-gray-900 text-[12px] mb-1 truncate">{patient.name}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1 text-gray-600">
          <div className="truncate">
            {patient.gender === 'male' ? 'Nam' : patient.gender === 'female' ? 'Nu' : 'Khac'}
            {patient.age ? `, ${patient.age} tuoi` : ''}
            {patient.birthdate ? ` | ${patient.birthdate}` : ''}
          </div>
          <div className="truncate" title={`Dia chi: ${patient.address}`}>Dia chi: {patient.address || '-'}</div>
          <div>{formatPhone(patient.phone)}</div>
          <div className="truncate">Email: {patient.email || '-'}</div>
          <div className="col-span-1 sm:col-span-2 text-gray-400">
            Lan kham gan nhat: {patient.last_visit_at || '-'}
          </div>
        </div>
        {isLinked && (
          <div className="mt-1 inline-block bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0.5 rounded">Da lien ket voi yeu cau</div>
        )}
      </div>
    </div>
  </label>
);

const NewPatientForm = ({ request, onSubmit, submitting }) => {
  const [form, setForm] = useState({
    name: request?.name || '',
    phone: request?.phone || '',
    email: request?.email || '',
    gender: 'male',
    birthdate: '',
    address: '',
  });
  const [errors, setErrors] = useState({});

  const submit = async (e) => {
    e.preventDefault();
    const v = validateNewPatient(form);
    if (!v.ok) {
      setErrors(v.errors);
      return;
    }
    setErrors({});
    await onSubmit(form);
  };

  return (
    <form onSubmit={submit} className="space-y-2 text-[11px]">
      <div>
        <label className="text-gray-500 mb-1 block">Ho va ten <span className="text-red-500">*</span></label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border rounded px-2 py-1.5 focus:outline-none"
        />
        {errors.name && <div className="text-[10px] text-red-500 mt-0.5">{errors.name}</div>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-gray-500 mb-1 block">So dien thoai <span className="text-red-500">*</span></label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full border rounded px-2 py-1.5 focus:outline-none"
          />
          {errors.phone && <div className="text-[10px] text-red-500 mt-0.5">{errors.phone}</div>}
        </div>
        <div>
          <label className="text-gray-500 mb-1 block">Email</label>
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border rounded px-2 py-1.5 focus:outline-none"
          />
          {errors.email && <div className="text-[10px] text-red-500 mt-0.5">{errors.email}</div>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-gray-500 mb-1 block">Gioi tinh</label>
          <select
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className="w-full border rounded px-2 py-1.5 focus:outline-none"
          >
            <option value="male">Nam</option>
            <option value="female">Nu</option>
            <option value="other">Khac</option>
          </select>
        </div>
        <div>
          <label className="text-gray-500 mb-1 block">Ngay sinh</label>
          <input
            type="date"
            value={form.birthdate}
            onChange={(e) => setForm({ ...form, birthdate: e.target.value })}
            className="w-full border rounded px-2 py-1.5 focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label className="text-gray-500 mb-1 block">Dia chi</label>
        <input
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className="w-full border rounded px-2 py-1.5 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded py-1.5 font-medium text-[11px] flex items-center justify-center gap-1.5 disabled:opacity-50"
      >
        {submitting ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
        Tao ho so moi va lien ket
      </button>
    </form>
  );
};

const PatientInfoPanel = ({ request, onLinkPatient, onCreatePatient, submitting, disabled }) => {
  const [tab, setTab] = useState(PATIENT_TABS.EXISTING);
  const linkedId = request?.patient_id || null;
  const prevLinkedIdRef = useRef(linkedId);

  // refreshToken buoc usePatientLookup re-fetch sau khi tao moi/link ho so.
  // Truoc fix: SDT/email yeu cau khong doi -> hook giu ket qua cu (rong) ->
  // tab "Ho so hien co" van empty mac du ho so vua tao xong.
  const { items, loading } = usePatientLookup({
    phone: request?.phone,
    email: request?.email,
    refreshToken: `${request?.id || 'none'}:${linkedId || 'none'}`,
  });

  // Khi UC6.2 vua link/tao ho so thanh cong, tu dong chuyen ve tab "Ho so hien
  // co" de receptionist nhin thay ket qua. Truoc fix: tab NEW giu nguyen va
  // form trong khien user tuong dau co lam gi.
  useEffect(() => {
    if (linkedId && prevLinkedIdRef.current !== linkedId) {
      setTab(PATIENT_TABS.EXISTING);
    }
    prevLinkedIdRef.current = linkedId;
  }, [linkedId]);

  return (
    <div className="flex-1 bg-white border rounded-lg shadow-sm flex flex-col min-w-0 min-h-0">
      <h2 className="px-4 py-3 font-semibold text-gray-800 text-[13px] border-b">Thong tin benh nhan</h2>
      <div className="flex border-b text-[11px] px-2 bg-gray-50">
        <button
          type="button"
          onClick={() => setTab(PATIENT_TABS.EXISTING)}
          className={`px-3 py-2 border-b-2 ${tab === PATIENT_TABS.EXISTING ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          Ho so hien co
        </button>
        <button
          type="button"
          onClick={() => setTab(PATIENT_TABS.NEW)}
          className={`px-3 py-2 border-b-2 ${tab === PATIENT_TABS.NEW ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          Tao ho so moi
        </button>
      </div>

      <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-3">
        {tab === PATIENT_TABS.EXISTING && (
          <>
            {loading ? (
              <div className="text-center text-xs text-gray-400 py-6">
                <Loader2 size={14} className="animate-spin inline mr-2" />
                Dang tim ho so trung khop...
              </div>
            ) : items.length === 0 ? (
              <div className="bg-amber-50 text-amber-700 px-3 py-2 rounded flex items-start gap-1.5 text-[11px] border border-amber-100">
                <span>!</span>
                <span>Khong tim thay ho so trung khop voi so dien thoai hoac email. Vui long tao ho so moi.</span>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded flex items-start gap-1.5 text-[11px]">
                  <span>i</span>
                  <span>
                    Tim thay <strong>{items.length}</strong> ho so co thong tin tuong tu.
                    Vui long chon ho so phu hop hoac tao moi.
                  </span>
                </div>
                {items.map((p) => (
                  <PatientCard
                    key={p.id}
                    patient={p}
                    isLinked={linkedId === p.id}
                    isSelected={linkedId === p.id}
                    onSelect={onLinkPatient}
                    disabled={disabled || submitting}
                  />
                ))}
              </>
            )}
          </>
        )}

        {tab === PATIENT_TABS.NEW && (
          <NewPatientForm
            request={request}
            submitting={submitting}
            onSubmit={onCreatePatient}
          />
        )}
      </div>

      <div className="p-3 border-t bg-gray-50 text-[10px] text-gray-500">
        <strong>Goi y:</strong>
        {' '}So dien thoai khach: <strong>{formatPhone(request?.phone)}</strong>.
        {' '}Chi nhanh dang chon: <strong>{getBranchLabel(request?.branch_id)}</strong>.
        {' '}{CLINIC_BRANCHES.length} chi nhanh dang hoat dong.
      </div>
    </div>
  );
};

export default PatientInfoPanel;
