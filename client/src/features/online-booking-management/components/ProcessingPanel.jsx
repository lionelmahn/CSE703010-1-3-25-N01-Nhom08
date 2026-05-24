import React, { useEffect, useMemo, useState } from 'react';
import { Ban, CalendarClock, Check, Loader2, Plus, X } from 'lucide-react';

import {
  PROCESSING_TABS,
  PROCESSABLE_STATUSES,
  REJECT_REASON_PRESETS,
  REQUEST_STATUS,
  TERMINAL_STATUSES,
} from '../constants';
import {
  validateConfirmPayload,
  validateProposePayload,
  validateRejectPayload,
} from '../validation';
import useOnlineBookingCatalogs from '../hooks/useOnlineBookingCatalogs';

const TabBtn = ({ active, onClick, children, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`px-3 py-2 border-b-2 ${active ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-800'} disabled:opacity-40 disabled:cursor-not-allowed`}
  >
    {children}
  </button>
);

const ConfirmForm = ({ request, onSubmit, submitting, catalogs }) => {
  const { services, branches, timeSlots } = catalogs;
  const [form, setForm] = useState({
    date: request.preferred_date || '',
    time_slot_id: request.preferred_time_slot_id || '',
    service_id: request.service_ids?.[0] ? String(request.service_ids[0]) : '',
    branch_id: request.branch_id ? String(request.branch_id) : '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      date: request.preferred_date || '',
      time_slot_id: request.preferred_time_slot_id || '',
      service_id: request.service_ids?.[0] ? String(request.service_ids[0]) : '',
      branch_id: request.branch_id ? String(request.branch_id) : '',
    });

    setErrors({});
  }, [request.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasPatient = !!request.patient_id;
  const isDuplicated = !!request.appointment_id;
  const submit = async (e) => {
    e.preventDefault();
    const v = validateConfirmPayload(request, {
      ...form,
      service_ids: form.service_id ? [form.service_id] : [],
    }, catalogs);
    if (!v.ok) {
      setErrors(v.errors);
      return;
    }
    setErrors({});
    await onSubmit({
      date: form.date,
      time_slot_id: form.time_slot_id,
      service_ids: [form.service_id],
      branch_id: form.branch_id,
    });
  };

  return (
    <form onSubmit={submit} className="p-4 flex-1 flex flex-col gap-3 text-[11px]">
      {!isDuplicated && (
        <div className="bg-green-50 text-green-700 px-3 py-2 rounded flex items-center gap-1.5 border border-green-100 text-[11px]">
          <Check size={12} /> Khung gio mong muon con kha dung (kiem tra so bo)
        </div>
      )}
      {!hasPatient && (
        <div className="bg-amber-50 text-amber-700 px-3 py-2 rounded flex items-start gap-1.5 border border-amber-100">
          <span>!</span>
          <span>Vui long chon hoac tao ho so benh nhan o cot ben trai truoc khi xac nhan.</span>
        </div>
      )}
      {isDuplicated && (
        <div className="bg-red-50 text-red-700 px-3 py-2 rounded border border-red-100">
          Yeu cau nay da tao lich hen <strong>{request.appointment_code}</strong>. Khong the tao them.
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-gray-500 mb-1 block">Ngay hen <span className="text-red-500">*</span></label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full border rounded px-2 py-1.5 focus:outline-none"
            disabled={isDuplicated}
          />
          {errors.date && <div className="text-[10px] text-red-500 mt-0.5">{errors.date}</div>}
        </div>
        <div>
          <label className="text-gray-500 mb-1 block">Khung gio <span className="text-red-500">*</span></label>
          <select
            value={form.time_slot_id}
            onChange={(e) => setForm({ ...form, time_slot_id: e.target.value })}
            className="w-full border rounded px-2 py-1.5 focus:outline-none"
            disabled={isDuplicated}
          >
            <option value="">-- Chon khung gio --</option>
            {timeSlots.filter((t) => !t.break).map((t) => (
              <option key={t.id} value={t.id}>{t.label.replace(/\s*\(.*?\)\s*$/, '')}</option>
            ))}
          </select>
          {errors.time_slot && <div className="text-[10px] text-red-500 mt-0.5">{errors.time_slot}</div>}
        </div>
        <div>
          <label className="text-gray-500 mb-1 block">Dich vu <span className="text-red-500">*</span></label>
          <select
            value={form.service_id}
            onChange={(e) => setForm({ ...form, service_id: e.target.value })}
            className="w-full border rounded px-2 py-1.5 focus:outline-none"
            disabled={isDuplicated}
          >
            <option value="">-- Chon dich vu --</option>
            {services.filter((s) => s.active !== false).map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          {errors.service && <div className="text-[10px] text-red-500 mt-0.5">{errors.service}</div>}
        </div>
        <div>
          <label className="text-gray-500 mb-1 block">Chi nhanh <span className="text-red-500">*</span></label>
          <select
            value={form.branch_id}
            onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
            className="w-full border rounded px-2 py-1.5 focus:outline-none"
            disabled={isDuplicated}
          >
            <option value="">-- Chon chi nhanh --</option>
            {branches.filter((b) => b.active !== false).map((b) => (
              <option key={b.id} value={b.id}>{b.label}</option>
            ))}
          </select>
          {errors.branch && <div className="text-[10px] text-red-500 mt-0.5">{errors.branch}</div>}
        </div>
      </div>

      <div className="text-blue-700 bg-blue-50 p-2 rounded text-[10px] border border-blue-100 flex items-start gap-1">
        <span>i</span>
        <span>Sau khi xac nhan, he thong se tao lich hen chinh thuc (trang thai <strong>Cho phan cong bac si</strong>) va gui email xac nhan cho khach hang.</span>
      </div>

      <div className="mt-auto pt-3 border-t -mx-4 px-4 -mb-4 pb-3 bg-gray-50 flex justify-end">
        <button
          type="submit"
          disabled={submitting || !hasPatient || isDuplicated}
          className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-1.5 rounded font-medium text-[11px] flex items-center gap-1.5"
        >
          {submitting ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          Xac nhan & Tao lich hen
        </button>
      </div>
    </form>
  );
};

const ProposeForm = ({ request, onSubmit, submitting, catalogs }) => {
  const { timeSlots } = catalogs;
  const initial = useMemo(() => (
    request.proposed_slots && request.proposed_slots.length
      ? request.proposed_slots
      : [{ date: '', time_slot_id: '' }]
  ), [request.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const [slots, setSlots] = useState(initial);
  const [reason, setReason] = useState('Khung gio mong muon khong kha dung, vui long chon khung gio thay the.');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSlots(initial);

    setErrors({});
  }, [initial]);

  const update = (idx, key, value) => {
    setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, [key]: value } : s)));
  };

  const add = () => setSlots((prev) => [...prev, { date: '', time_slot_id: '' }]);
  const remove = (idx) => setSlots((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));

  const submit = async (e) => {
    e.preventDefault();
    const v = validateProposePayload(request, { slots, reason }, catalogs);
    if (!v.ok) {
      setErrors(v.errors);
      return;
    }
    setErrors({});
    await onSubmit(slots, reason);
  };

  return (
    <form onSubmit={submit} className="p-4 flex-1 flex flex-col gap-3 text-[11px]">
      <div>
        <label className="text-gray-500 mb-1 block">Ly do de xuat <span className="text-red-500">*</span></label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border rounded px-2 py-1.5 focus:outline-none resize-none min-h-[50px]"
        />
        {errors.reason && <div className="text-[10px] text-red-500 mt-0.5">{errors.reason}</div>}
      </div>

      <div className="flex justify-between items-center mt-2">
        <label className="text-gray-500 font-medium">Khung gio thay the <span className="text-red-500">*</span></label>
        <button
          type="button"
          onClick={add}
          className="text-blue-600 hover:underline text-[10px] flex items-center gap-1"
        >
          <Plus size={11} /> Them khung gio
        </button>
      </div>
      {errors.slots && <div className="text-[10px] text-red-500">{errors.slots}</div>}

      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
        {slots.map((slot, idx) => (
          <div key={idx} className="flex items-end gap-2 border border-gray-200 rounded p-2 bg-blue-50/30">
            <div className="flex-1">
              <label className="text-gray-500 mb-0.5 block">Ngay</label>
              <input
                type="date"
                value={slot.date}
                onChange={(e) => update(idx, 'date', e.target.value)}
                className="w-full border rounded px-2 py-1.5 focus:outline-none bg-white"
              />
              {errors[`slot_${idx}_date`] && <div className="text-[10px] text-red-500 mt-0.5">{errors[`slot_${idx}_date`]}</div>}
            </div>
            <div className="flex-1">
              <label className="text-gray-500 mb-0.5 block">Khung gio</label>
              <select
                value={slot.time_slot_id}
                onChange={(e) => update(idx, 'time_slot_id', e.target.value)}
                className="w-full border rounded px-2 py-1.5 focus:outline-none bg-white"
              >
                <option value="">-- Chon --</option>
                {timeSlots.filter((t) => !t.break).map((t) => (
                  <option key={t.id} value={t.id}>{t.label.replace(/\s*\(.*?\)\s*$/, '')}</option>
                ))}
              </select>
              {errors[`slot_${idx}_time`] && <div className="text-[10px] text-red-500 mt-0.5">{errors[`slot_${idx}_time`]}</div>}
            </div>
            {slots.length > 1 && (
              <button
                type="button"
                onClick={() => remove(idx)}
                className="mb-1 p-1.5 border border-gray-200 rounded text-gray-500 hover:bg-white"
                aria-label="Xoa khung gio"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="text-blue-700 bg-blue-50 p-2 rounded text-[10px] border border-blue-100 mt-1">
        He thong se gui email cho khach hang voi danh sach khung gio thay the va huong dan xac nhan.
      </div>

      <div className="mt-auto pt-3 border-t -mx-4 px-4 -mb-4 pb-3 bg-gray-50 flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-6 py-1.5 rounded font-medium text-[11px] flex items-center gap-1.5"
        >
          {submitting ? <Loader2 size={12} className="animate-spin" /> : <CalendarClock size={12} />}
          De xuat lich khac
        </button>
      </div>
    </form>
  );
};

const RejectForm = ({ request, onSubmit, submitting }) => {
  const [preset, setPreset] = useState(REJECT_REASON_PRESETS[0]);
  const [reason, setReason] = useState(REJECT_REASON_PRESETS[0]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreset(REJECT_REASON_PRESETS[0]);

    setReason(REJECT_REASON_PRESETS[0]);

    setErrors({});
  }, [request.id]);

  const handlePresetChange = (v) => {
    setPreset(v);
    if (v.startsWith('Khac')) {
      setReason('');
    } else {
      setReason(v);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const v = validateRejectPayload({ reason });
    if (!v.ok) {
      setErrors(v.errors);
      return;
    }
    setErrors({});
    await onSubmit(reason);
  };

  return (
    <form onSubmit={submit} className="p-4 flex-1 flex flex-col gap-3 text-[11px]">
      <div className="bg-red-50 text-red-700 px-3 py-2 rounded border border-red-100 flex items-start gap-1.5">
        <span>!</span>
        <span>Tu choi yeu cau se khoa thao tac xu ly tiep theo. He thong se gui email phan hoi cho khach.</span>
      </div>

      <div>
        <label className="text-gray-500 mb-1 block">Ly do tu choi <span className="text-red-500">*</span></label>
        <select
          value={preset}
          onChange={(e) => handlePresetChange(e.target.value)}
          className="w-full border rounded px-2 py-1.5 focus:outline-none"
        >
          {REJECT_REASON_PRESETS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-gray-500 mb-1 block">Noi dung chi tiet <span className="text-red-500">*</span></label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Nhap ly do tu choi gui khach hang (toi thieu 5 ky tu)"
          className="w-full border rounded px-2 py-1.5 focus:outline-none resize-none"
        />
        {errors.reason && <div className="text-[10px] text-red-500 mt-0.5">{errors.reason}</div>}
      </div>

      <div className="mt-auto pt-3 border-t -mx-4 px-4 -mb-4 pb-3 bg-gray-50 flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white px-6 py-1.5 rounded font-medium text-[11px] flex items-center gap-1.5"
        >
          {submitting ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />}
          Tu choi yeu cau
        </button>
      </div>
    </form>
  );
};

const ProcessingPanel = ({
  request,
  isAdmin,
  onConfirm,
  onPropose,
  onReject,
  onReopen,
  submitting,
}) => {
  const [tab, setTab] = useState(PROCESSING_TABS.CONFIRM);
  const catalogs = useOnlineBookingCatalogs();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTab(PROCESSING_TABS.CONFIRM);
  }, [request?.id]);

  if (!request) return null;

  const isTerminal = TERMINAL_STATUSES.includes(request.status);
  const isRejected = request.status === REQUEST_STATUS.REJECTED;
  const isProcessable = PROCESSABLE_STATUSES.includes(request.status);

  return (
    <div className="flex-1 bg-white border rounded-lg shadow-sm flex flex-col min-w-0 min-h-0">
      <h2 className="px-4 py-3 font-semibold text-gray-800 text-[13px] border-b">Xu ly yeu cau</h2>
      <div className="flex border-b text-[11px] px-2 bg-gray-50">
        <TabBtn active={tab === PROCESSING_TABS.CONFIRM} onClick={() => setTab(PROCESSING_TABS.CONFIRM)} disabled={!isProcessable}>
          Xac nhan lich hen
        </TabBtn>
        <TabBtn active={tab === PROCESSING_TABS.PROPOSE} onClick={() => setTab(PROCESSING_TABS.PROPOSE)} disabled={!isProcessable}>
          De xuat lich khac
        </TabBtn>
        <TabBtn active={tab === PROCESSING_TABS.REJECT} onClick={() => setTab(PROCESSING_TABS.REJECT)} disabled={!isProcessable}>
          Tu choi yeu cau
        </TabBtn>
      </div>

      {isTerminal && (
        <div className="m-4 p-3 bg-gray-50 border border-gray-200 rounded text-[11px] text-gray-700">
          <strong>Yeu cau da o trang thai ket thuc.</strong>
          <div className="mt-1">
            Trang thai: <strong>{request.status === REQUEST_STATUS.APPOINTMENT_CREATED ? 'Da tao lich hen' : 'Da huy'}</strong>
            {request.appointment_code && (
              <>{' '}- Lich hen: <strong className="text-green-700">{request.appointment_code}</strong></>
            )}
          </div>
          <div className="text-gray-500 mt-1 text-[10px]">Khong the xu ly tiep tu UC6.2.</div>
        </div>
      )}

      {isRejected && (
        <div className="m-4 p-3 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800 flex justify-between items-center gap-2">
          <div>
            <strong>Yeu cau da bi tu choi.</strong>
            <div className="text-[10px] mt-1 text-amber-700">Ly do: {request.reject_reason || '-'}</div>
            <div className="text-[10px] mt-0.5">{isAdmin ? 'Admin co the mo lai yeu cau de xu ly lai.' : 'Lien he Admin neu can mo lai (BR-19).'}</div>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => onReopen('Mo lai theo yeu cau admin')}
              disabled={submitting}
              className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded font-medium text-[11px] disabled:opacity-50"
            >
              Mo lai yeu cau
            </button>
          )}
        </div>
      )}

      {isProcessable && tab === PROCESSING_TABS.CONFIRM && (
        <ConfirmForm request={request} onSubmit={onConfirm} submitting={submitting} catalogs={catalogs} />
      )}
      {isProcessable && tab === PROCESSING_TABS.PROPOSE && (
        <ProposeForm request={request} onSubmit={onPropose} submitting={submitting} catalogs={catalogs} />
      )}
      {isProcessable && tab === PROCESSING_TABS.REJECT && (
        <RejectForm request={request} onSubmit={onReject} submitting={submitting} />
      )}
    </div>
  );
};

export default ProcessingPanel;
