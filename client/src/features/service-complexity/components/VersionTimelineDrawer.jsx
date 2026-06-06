import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import { formatCoefficient, formatDate, levelLabel, serviceLabel } from '../utils';
import StatusBadge from './StatusBadge';

const VersionTimelineDrawer = ({ open, coefficient, rows, onClose }) => {
  const versions = useMemo(() => {
    if (!coefficient) return [];
    return [...(rows || [])]
      .filter((row) => (
        Number(row.service_id) === Number(coefficient.service_id)
        && row.processing_level === coefficient.processing_level
      ))
      .sort((a, b) => new Date(b.effective_from || 0) - new Date(a.effective_from || 0));
  }, [coefficient, rows]);

  if (!open || !coefficient) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45">
      <section className="h-full w-full max-w-[640px] overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-5">
          <h3 className="text-[14px] font-extrabold text-slate-950">Timeline phiên bản</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-5 text-[12px]">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="text-[13px] font-extrabold text-slate-950">{serviceLabel(coefficient.service)}</div>
            <div className="mt-1 text-slate-600">{levelLabel(coefficient.processing_level)}</div>
          </div>

          <div className="space-y-3">
            {versions.length === 0 ? (
              <div className="rounded-md border border-slate-200 px-3 py-6 text-center text-slate-500">
                Chỉ có phiên bản hiện tại trong trang đang tải.
              </div>
            ) : null}
            {versions.map((version, index) => (
              <div key={version.id} className="relative rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-mono text-[11px] font-bold text-slate-500">v{versions.length - index} | {version.code}</div>
                    <div className="mt-1 text-[18px] font-extrabold text-slate-950">+{formatCoefficient(version.coefficient)}</div>
                  </div>
                  <StatusBadge status={version.status} />
                </div>
                <dl className="mt-3 grid grid-cols-[120px_1fr] gap-y-2 text-[12px]">
                  <dt className="text-slate-500">Hiệu lực</dt>
                  <dd className="font-semibold text-slate-800">
                    {formatDate(version.effective_from)} - {version.effective_to ? formatDate(version.effective_to) : 'Không thời hạn'}
                  </dd>
                  <dt className="text-slate-500">Lý do</dt>
                  <dd className="text-slate-700">{version.change_reason || '-'}</dd>
                  <dt className="text-slate-500">Đã dùng</dt>
                  <dd className="text-slate-700">{version.service_items_count || 0} dòng UC12</dd>
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default VersionTimelineDrawer;
