import React, { useEffect, useRef, useState } from 'react';
import { Search, X, Loader2, ChevronDown } from 'lucide-react';
import { salarySlipApi } from '@/api/salarySlipApi';

const now = new Date();

// Combobox inline tim bac si theo ten/ma (tai dung endpoint salary-slips/doctors).
const DoctorSearchSelect = ({ value, year, onSelect, disabled }) => {
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dong dropdown khi click ra ngoai.
  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Tim kiem server-side, debounce.
  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await salarySlipApi.doctors({
          q: q.trim() || undefined,
          period_month: now.getMonth() + 1,
          period_year: year,
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
      clearTimeout(timer);
    };
  }, [q, open, year]);

  const label = value ? `${value.full_name} (${value.employee_code})` : '';

  return (
    <div ref={wrapRef} className="relative">
      <div
        className={`flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-2 ${
          disabled ? 'opacity-60' : ''
        }`}
      >
        <Search size={14} className="shrink-0 text-slate-400" />
        <input
          type="text"
          disabled={disabled}
          value={open ? q : label}
          placeholder="Tìm bác sĩ theo tên hoặc mã..."
          onFocus={() => {
            if (disabled) return;
            setQ('');
            setOpen(true);
          }}
          onChange={(e) => setQ(e.target.value)}
          className="h-full w-full min-w-0 bg-transparent text-[12px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        {value && !open ? (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="shrink-0 text-slate-400 hover:text-slate-600"
            aria-label="Xóa bác sĩ"
          >
            <X size={14} />
          </button>
        ) : (
          <ChevronDown size={14} className="shrink-0 text-slate-400" />
        )}
      </div>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-72 overflow-y-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-3 text-[12px] text-slate-500">
              <Loader2 size={14} className="animate-spin" /> Đang tìm...
            </div>
          ) : !results.length ? (
            <div className="px-3 py-4 text-center text-[12px] text-slate-500">Không tìm thấy bác sĩ phù hợp.</div>
          ) : (
            <ul>
              {results.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(d);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-slate-50 ${
                      value?.id === d.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-semibold text-slate-900">{d.full_name}</span>
                      <span className="block truncate text-[11px] text-slate-500">
                        {d.employee_code}
                        {d.branch_name ? ` · ${d.branch_name}` : ''}
                      </span>
                    </span>
                    {d.has_slip_this_period ? (
                      <span className="shrink-0 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                        Có phiếu
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default DoctorSearchSelect;
