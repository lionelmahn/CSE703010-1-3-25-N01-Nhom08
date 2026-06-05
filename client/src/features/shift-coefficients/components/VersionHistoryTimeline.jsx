import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import StatusBadge from './StatusBadge';
import {
  dayTypeLabel,
  formatCoefficient,
  formatDate,
  shiftTypeLabel,
  sortCoefficientsAsc,
  versionLabel,
} from '../utils';

const VersionHistoryTimeline = ({ open, coefficient, rows = [], onClose }) => {
  const versions = useMemo(() => {
    if (!coefficient) return [];
    return sortCoefficientsAsc(
      rows.filter((row) => row.day_type === coefficient.day_type && row.shift_type === coefficient.shift_type),
    ).reverse();
  }, [coefficient, rows]);

  if (!open || !coefficient) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/45 p-3 sm:items-center">
      <section className="w-full max-w-[520px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex h-12 items-center justify-between border-b border-slate-200 px-4">
          <div>
            <h3 className="text-[13px] font-extrabold uppercase tracking-[0.04em] text-slate-950">Lịch sử phiên bản</h3>
            <p className="text-[11px] text-slate-500">
              {dayTypeLabel(coefficient.day_type)} / {shiftTypeLabel(coefficient.shift_type)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Đóng">
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[72vh] overflow-y-auto p-5 text-[12px]">
          {versions.length === 0 && (
            <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-4 text-center text-slate-500">
              Chưa có phiên bản nào trong nhóm này.
            </p>
          )}

          <div className="relative space-y-0 pl-4">
            <div className="absolute left-[22px] top-2 h-[calc(100%-16px)] w-px bg-slate-200" />
            {versions.map((row) => (
              <article key={row.id} className="relative grid grid-cols-[26px_1fr] gap-3 pb-5">
                <span className={`relative z-10 mt-1 h-3 w-3 rounded-full border-2 bg-white ${
                  row.status === 'active' ? 'border-emerald-500' : row.status === 'upcoming' ? 'border-violet-500' : 'border-slate-300'
                }`} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[12px] font-extrabold text-slate-950">{versionLabel(rows, row)}</span>
                    <StatusBadge status={row.status} />
                    <span className="text-[11px] text-slate-500">{formatDate(row.created_at)}</span>
                  </div>
                  <p className="mt-1 text-[12px] font-semibold text-slate-900">x{formatCoefficient(row.coefficient)}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {formatDate(row.effective_from)} - {row.effective_to ? formatDate(row.effective_to) : 'Không thời hạn'}
                  </p>
                  <p className="mt-2 text-[11px] leading-5 text-slate-600">
                    Tạo bởi: {row.creator?.name || 'Hệ thống'}
                    {row.note ? ` · ${row.note}` : ''}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-full rounded-md border border-slate-200 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            Đóng
          </button>
        </div>
      </section>
    </div>
  );
};

export default VersionHistoryTimeline;
