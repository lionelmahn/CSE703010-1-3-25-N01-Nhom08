import React, { useEffect, useState } from 'react';
import { Search, X, Loader2, Check, BadgeCheck } from 'lucide-react';
import { salarySlipApi } from '@/api/salarySlipApi';
import { branchApi } from '@/api/branchApi';

const initials = (name) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

const DoctorPickerDialog = ({ open, periodMonth, periodYear, currentStaffId, onSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [branchId, setBranchId] = useState('');
  const [branches, setBranches] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Reset + load branches when opened.
  useEffect(() => {
    if (!open) return;
    setSearchTerm('');
    setBranchId('');
    branchApi
      .list()
      .then((res) => setBranches(Array.isArray(res.data) ? res.data : res.data?.data || []))
      .catch(() => setBranches([]));
  }, [open]);

  // Debounced doctor search (server-side, scales to hundreds of doctors).
  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setLoading(true);
    const handler = setTimeout(async () => {
      try {
        const { data } = await salarySlipApi.doctors({
          q: searchTerm.trim() || undefined,
          branch_id: branchId || undefined,
          period_month: periodMonth,
          period_year: periodYear,
          limit: 50,
        });
        if (!cancelled) setResults(data?.data || []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(handler);
    };
  }, [searchTerm, branchId, periodMonth, periodYear, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4" onClick={onClose}>
      <div
        className="flex max-h-[88vh] w-full max-w-[560px] flex-col rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h3 className="text-[14px] font-extrabold text-slate-900">Chọn bác sĩ</h3>
            <p className="text-[11px] text-slate-500">
              Kỳ lương {String(periodMonth).padStart(2, '0')}/{periodYear}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2 border-b border-slate-200 p-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              autoFocus
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên hoặc mã nhân viên..."
              className="h-9 w-full rounded-md border border-slate-200 pl-8 pr-3 text-[12px] focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="h-9 w-full rounded-md border border-slate-200 px-2 text-[12px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Tất cả chi nhánh</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center gap-2 p-4 text-[12px] text-slate-500">
              <Loader2 size={14} className="animate-spin" /> Đang tìm...
            </div>
          ) : !results.length ? (
            <div className="p-8 text-center text-[12px] text-slate-500">Không tìm thấy bác sĩ phù hợp.</div>
          ) : (
            <ul className="space-y-1">
              {results.map((doctor) => {
                const selected = doctor.id === currentStaffId;
                return (
                  <li key={doctor.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(doctor);
                        onClose();
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition ${
                        selected ? 'border-blue-300 bg-blue-50' : 'border-transparent hover:bg-slate-50'
                      }`}
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-600">
                        {initials(doctor.full_name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-[12px] font-semibold text-slate-900">
                            {doctor.full_name}
                          </span>
                          <span className="shrink-0 text-[10.5px] text-slate-400">{doctor.employee_code}</span>
                        </span>
                        <span className="block truncate text-[11px] text-slate-500">
                          {doctor.branch_name || 'Chưa gán chi nhánh'}
                        </span>
                      </span>
                      {doctor.has_slip_this_period && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
                          <BadgeCheck size={12} /> Đã có phiếu
                        </span>
                      )}
                      {selected && <Check size={16} className="shrink-0 text-blue-600" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorPickerDialog;
